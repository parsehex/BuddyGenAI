<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue';
import { v4 } from 'uuid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { Volume2, MoreHorizontal, Image, Copy } from 'lucide-vue-next';
import BuddyAvatar from '@/components/BuddyAvatar.vue';
import MessageImage from './MessageImage.vue';
import type { BuddyVersionMerged, ChatMessage } from '@/src/lib/api/types-db';
import { playAudio, popError, textToHslColor, isDevMode } from '@/src/lib/utils';
import { useAppStore } from '@/src/stores/main';
import { getAudio } from '@/src/lib/api/audio';
import { cleanTextForTTS } from '@/src/lib/ai/utils';
import { useTTSAI } from '@/src/composables/ai/useTTSAI';
import { insert } from '@/src/lib/sql';
import { api } from '@/src/lib/api';
import useDB from '@/src/composables/useDB';

const props = defineProps<{
	isUser: boolean;
	message: ChatMessage;
	threadMode: 'persona' | 'custom';
	currentBuddy?: BuddyVersionMerged;
	isLoading: boolean;
	canGenerate: boolean;
}>();
const { message, isUser, currentBuddy } = toRefs(props);

const emit = defineEmits<{
	(e: 'copy'): void;
	(e: 'delete'): void;
	(e: 'edit'): void;
	(e: 'clear'): void;
	(e: 'generate'): void;
}>();

const db = useDB();
const store = useAppStore();
const ttsAI = useTTSAI();

const userName = computed(() => store.settings.user_name);
const userImage = computed(() => store.settings.user_image);
const chatStreaming = computed(() => store.settings.chat_streaming);
const chatImagesEnabled = computed(() => store.settings.chat_image_enabled);

const aiName = computed(() => {
	if (props.threadMode === 'persona') return props.currentBuddy?.name || 'Assistant'
	return 'Assistant';
});

const msgInitials = computed(() => {
	if (isUser.value) return userName.value[0];
	if (!aiName.value) return 'AI';

	const firstName = aiName.value.split(' ')[0];
	return firstName[0];
});

const isTypingIndicator = ref(false);

// Watch message changes to set typing state
watch(
	() => message.value,
	(newVal) => {
		if (chatStreaming.value) {
			isTypingIndicator.value = false;
			return;
		}
		if (!isUser.value && !chatStreaming.value) {
			// Typing starts if no content yet
			isTypingIndicator.value = !newVal.content?.trim();
		} else {
			isTypingIndicator.value = props.isLoading;
		}
	},
	{ immediate: true }
);

const imgValue = ref(message.value.image || '');
watch(
	() => message.value,
	async (newVal) => {
		if (!newVal.image) return;
		imgValue.value = newVal.image;
	},
	{ deep: true }
);

const ttsEnabled = computed(() => {
	if (props.isLoading) return false;
	return store.settings.selected_provider_tts === 'koboldcpp';
});
const hasTTS = computed(() => {
	if (!message.value.tts) return false;
	return !!message.value.tts;
});
const tts = computed(async () => {
	const id: string = message.value.tts || '';
	if (!id) return '';
	const ttsData = await getAudio(id);
	if (!ttsData) return '';
	return ttsData;
});
const ttsLoading = ref(false);
const doTTS = async () => {
	if (isUser.value) return;
	if (ttsLoading.value) return;

	ttsLoading.value = true;
	if (!hasTTS.value) {
		if (!ttsEnabled.value) {
			return popError('Please set a Text-to-Speech provider in Options -> Providers', 'TTS is disabled');
		}
		const text = cleanTextForTTS(message.value.content);

		const id = v4();
		const voice = ttsAI.getSelectedVoice(currentBuddy.value?.id || '')
		const ttsData = await ttsAI.makeTTS({
			text,
			voice,
		});
		if (!ttsData) return popError('TTS failed to generate');

		const response = await fetch(ttsData);
		const audioBlob = await response.blob();

		const sqlAudioAdd = insert('audio', { id, data: audioBlob });
		await db.run(sqlAudioAdd[0], sqlAudioAdd[1]);

		playAudio(ttsData);

		await api.message.updateOne(message.value.id, undefined, undefined, id);
		ttsLoading.value = false;
		emit('edit');
		return;
	}

	playAudio(await tts.value);
	ttsLoading.value = false;
};
</script>
<template>
	<Card class="chat-message whitespace-pre-wrap" :id="'message-' + message.id">
		<CardHeader class="p-3 flex flex-row items-center py-2">
			<div class="flex items-center space-x-2">
				<span v-if="threadMode === 'persona' && !isUser">
					<RouterLink :to="`/buddy/${currentBuddy?.id}/view`"
						class="flex items-center hover:bg-primary-foreground hover:text-primary-background p-1 rounded-lg">
						<BuddyAvatar v-if="!isUser && currentBuddy" :buddy="currentBuddy" /> {{ currentBuddy?.name }}
					</RouterLink>
				</span>
				<span v-else>
					<Avatar class="text-md font-bold mr-2" :style="{
						backgroundColor: isUser ? textToHslColor(userName, 60, 80) : '',
					}">
						<AvatarImage v-if="isUser && userImage" :src="userImage" />
						<img v-if="!isUser" src="/assets/logo.png" />
						<AvatarFallback v-else>{{ msgInitials }}</AvatarFallback>
					</Avatar>
					<span> {{ isUser ? userName : 'Assistant' }} </span>
				</span>
				<Button v-if="(!isUser && ttsEnabled) || hasTTS" @click="doTTS" :variant="hasTTS ? 'secondary' : 'ghost'"
					size="sm" class="ml-2" :disabled="ttsLoading">
					<Volume2 />
				</Button>
				<!-- add audio speed control -->
			</div>
			<div class="ml-auto mr-1">
				<Tooltip v-if="!isUser && chatImagesEnabled">
					<TooltipTrigger as-child>
						<Button variant="ghost" size="sm" @click="emit('generate')" :disabled="!canGenerate">
							<Image />
						</Button>
					</TooltipTrigger>
					<TooltipContent> Request Image </TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger as-child>
						<Button variant="ghost" size="sm" @click="emit('copy')">
							<Copy />
						</Button>
					</TooltipTrigger>
					<TooltipContent> Copy Message </TooltipContent>
				</Tooltip>
				<DropdownMenu>
					<DropdownMenuTrigger as-child>
						<Button variant="ghost" size="sm" class="ml-auto">
							<MoreHorizontal />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DialogTrigger asChild>
							<DropdownMenuItem @click="emit('edit')" v-if="isUser"> Edit </DropdownMenuItem>
						</DialogTrigger>
						<DropdownMenuItem @click="emit('delete')">Delete</DropdownMenuItem>
						<DropdownMenuItem v-if="canGenerate" @click="emit('generate')">Request Image</DropdownMenuItem>
						<DropdownMenuSeparator v-if="isDevMode()" />
						<DropdownMenuItem v-if="isDevMode()" @click="emit('clear')"> Delete All Messages </DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</CardHeader>
		<CardContent class="p-3 pl-6 pt-0 flex items-center justify-between gap-2">
			<div class="grow">
				<span v-if="isTypingIndicator" class="typing-indicator"> {{ aiName }} is typing<span class="dots"></span>
				</span>
				<span v-else> {{ message.content }} </span>
			</div>
			<MessageImage v-if="imgValue" :imgValue="imgValue" />
		</CardContent>
	</Card>
</template>
