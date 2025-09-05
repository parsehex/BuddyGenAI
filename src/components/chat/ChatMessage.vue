<script setup lang="ts">
import { ref, computed, toRefs, watch } from 'vue';
import type { BuddyVersionMerged, ChatMessage } from '@/lib/api/types-db';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import BuddyAvatar from '@/components/BuddyAvatar.vue';
import useElectron from '@/composables/useElectron';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/main';
import { copyTextToClipboard, popError, textToHslColor } from '@/src/lib/utils';
import MessageImage from './MessageImage.vue';
import { isDevMode, playAudio } from '@/lib/utils';
import { Volume2 } from 'lucide-vue-next';
import { useToast } from '../ui/toast';
import { cleanTextForTTS } from '@/src/lib/ai/utils';
import { insert } from '@/src/lib/sql';
import { v4 } from 'uuid';
import { getAudio } from '@/src/lib/api/audio';
import { useTTSAI } from '@/src/composables/ai/useTTSAI';
import { useImgAI } from '@/src/composables/ai/useImgAI';

const { toast } = useToast();

const { dbRun } = useElectron();
const store = useAppStore();
const ttsAI = useTTSAI();
const imgAI = useImgAI();
const chatStreaming = computed(() => store.settings.chat_streaming);

const props = defineProps<{
	threadId: string;
	message: ChatMessage;
	threadMode: 'persona' | 'custom';
	currentBuddy?: BuddyVersionMerged;
	isLoading: boolean;
}>();
const { threadId, message, threadMode, currentBuddy } = toRefs(props);

const emit = defineEmits<{
	(e: 'edit', id: string): void;
	(e: 'delete', id: string): void;
	(e: 'clearThread'): void;
	(e: 'generateImage', messageId: string): void;
}>();

const isUser = computed(() => message.value.role === 'user');
const isAssistant = computed(() => message.value.role === 'assistant');

const aiName = computed(() => {
	if (props.threadMode === 'persona') return props.currentBuddy?.name || 'Assistant'
	return 'Assistant';
})

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

// @ts-ignore
const imgValue = ref(message.value.image || '');
watch(
	() => message.value,
	async (newVal) => {
		console.log(newVal.image);
		// @ts-ignore
		if (!newVal.image) return;
		// @ts-ignore
		imgValue.value = newVal.image;
	},
	{ deep: true }
);

const editingMessageTitle = ref('');
const editingMessage = ref('');
const modalOpen = ref(false);

const userName = computed(() => {
	if (isUser.value) return store.settings.user_name;
	return '';
});

const triggerEdit = async () => {
	editingMessageTitle.value = `Editing Message`;
	editingMessage.value = message.value.content;
	modalOpen.value = true;
};
const handleEdit = async (e: KeyboardEvent | null, confirm = false) => {
	if (!confirm) return;
	if (e?.key !== 'Enter' && !confirm) return;
	if (!e?.ctrlKey && !confirm) return;

	await api.message.updateOne(message.value.id, editingMessage.value);
	editingMessage.value = '';
	emit('edit', message.value.id);
	modalOpen.value = false;
};
const handleCancel = () => {
	editingMessage.value = '';
	modalOpen.value = false;
};

const doDelete = async () => {
	await api.message.removeOne(message.value.id);
	emit('delete', message.value.id);
};
const doCopyMessage = () => {
	if (!message.value.content) return;
	copyTextToClipboard(message.value.content);
};
const doClearThread = async () => {
	if (!threadId) return;
	await api.message.removeAll(threadId.value);
	emit('clearThread');
};

const msgInitials = computed(() => {
	if (isUser.value) return userName.value[0];
	if (!currentBuddy.value) return '';

	const firstName = currentBuddy.value.name.split(' ')[0];
	return firstName[0];
});

const ttsEnabled = computed(() => {
	if (props.isLoading) return false;
	return store.settings.selected_provider_tts === 'koboldcpp';
});
const hasTTS = computed(() => {
	// @ts-ignore
	if (!message.value.tts) return false;
	// @ts-ignore
	return !!message.value.tts;
});
const tts = computed(async () => {
	// @ts-ignore
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
		await dbRun(sqlAudioAdd[0], sqlAudioAdd[1]);

		playAudio(ttsData);

		await api.message.updateOne(message.value.id, undefined, undefined, id);
		ttsLoading.value = false;
		emit('edit', message.value.id);
		return;
	}

	playAudio(await tts.value);
	ttsLoading.value = false;
};

const canGenerateImage = computed(() => {
	if (!isAssistant.value) return false;
	if (!imgAI.isAvailable) return false;
	if (message.value.image) return false; // Already has an image
	return true;
});

const doGenerateImage = async () => {
	if (!canGenerateImage.value) return;
	emit('generateImage', message.value.id);
};
</script>
<template>
	<Dialog :modal="true" :open="modalOpen" @update:open="modalOpen = $event">
		<ContextMenu>
			<ContextMenuTrigger>
				<Card class="chat-message whitespace-pre-wrap" :id="'message-' + message.id">
					<CardHeader v-if="threadMode === 'persona'" class="p-3 flex flex-row items-center space-x-2 py-2">
						<!-- would be good ux to have an option or a link to option to update user name -->
						<!-- TODO button to Request Pic -->
						<Avatar v-if="isUser" class="text-md font-bold mr-2" :style="{
							backgroundColor: textToHslColor(userName, 60, 80),
						}">
							<AvatarImage v-if="store.settings.user_image" :src="store.settings.user_image" />
							<AvatarFallback v-else>{{ msgInitials }}</AvatarFallback>
						</Avatar>
						<span v-if="isUser"> {{ userName }} </span>
						<span v-else>
							<RouterLink :to="`/buddy/${currentBuddy?.id}/view`"
								class="flex items-center hover:bg-primary-foreground hover:text-primary-background p-1 rounded-lg">
								<BuddyAvatar v-if="!isUser && currentBuddy" :buddy="currentBuddy" /> {{ currentBuddy?.name }}
							</RouterLink>
						</span>
						<Button v-if="(!isUser && ttsEnabled) || hasTTS" @click="doTTS" :variant="hasTTS ? 'secondary' : 'ghost'"
							size="sm" class="ml-2" :disabled="ttsLoading">
							<Volume2 />
						</Button>
						<!-- add audio speed control -->
					</CardHeader>
					<CardHeader v-else class="p-3 flex flex-row items-center space-x-2 py-2">
						<Avatar class="text-md font-bold mr-2" :style="{
							backgroundColor: isUser ? textToHslColor(userName, 60, 80) : '',
						}">
							<AvatarImage v-if="isUser && store.settings.user_image" :src="store.settings.user_image" />
							<img v-if="!isUser" src="/assets/logo.png" />
							<AvatarFallback v-else>{{ msgInitials }}</AvatarFallback>
						</Avatar> {{ isUser ? userName : 'Assistant' }} <Button v-if="(!isUser && ttsEnabled) || hasTTS"
							@click="doTTS" :variant="hasTTS ? 'secondary' : 'ghost'" size="sm" class="ml-2" :disabled="ttsLoading">
							<Volume2 />
						</Button>
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
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem @click="doCopyMessage">Copy</ContextMenuItem>
				<DialogTrigger asChild>
					<ContextMenuItem @click="triggerEdit" v-if="isUser || threadMode === 'custom'"> Edit </ContextMenuItem>
				</DialogTrigger>
				<ContextMenuItem @click="doDelete">Delete</ContextMenuItem>
				<ContextMenuItem @click="doGenerateImage" v-if="canGenerateImage">Request Image</ContextMenuItem>
				<!-- TODO confirm (reuse same dialog) -->
				<ContextMenuSeparator v-if="isDevMode()" />
				<ContextMenuItem v-if="isDevMode()" @click="doClearThread"> Delete All Messages </ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{{ editingMessageTitle }}</DialogTitle>
			</DialogHeader>
			<DialogDescription>
				<Textarea v-model="editingMessage" @keydown.enter="handleEdit" placeholder="Message content..."
					class="w-full min-h-48" />
			</DialogDescription>
			<DialogFooter>
				<DialogClose as-child>
					<Button @click="handleCancel" type="button" variant="outline">Cancel</Button>
					<Button @click="handleEdit(null, true)" type="button">Confirm</Button>
					<!-- TODO rework buttons - Save / Re-Send? (disabled if not last message, probably with alert explaining + maybe override link btn) -->
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
<style>
.typing-indicator {
	font-style: italic;
	opacity: 0.8;
}

.dots::after {
	content: '';
	display: inline-block;
	width: 1em;
	text-align: left;
	animation: dots 1.2s steps(4, end) infinite;
}

@keyframes dots {

	0%,
	20% {
		content: '';
	}

	40% {
		content: '.';
	}

	60% {
		content: '..';
	}

	80%,
	100% {
		content: '...';
	}
}
</style>
