<script setup lang="ts">
import { ref, computed, toRefs, watch } from 'vue';
import type { Message } from 'ai/vue';
import type { BuddyVersionMerged, ChatMessage } from '@/lib/api/types-db';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { textToHslColor } from '@/src/lib/utils';
import MessageImage from './MessageImage.vue';
import { isDevMode, playAudio } from '@/lib/utils';
import { Volume2 } from 'lucide-vue-next';
import { makeTTS } from '@/src/lib/ai/tts';

import urls from '@/src/lib/api/urls';
import { useToast } from '../ui/toast';
import { cleanTextForTTS } from '@/src/lib/ai/utils';

const { toast } = useToast();

const { copyToClipboard } = useElectron();
const store = useAppStore();

const props = defineProps<{
	threadId: string;
	message: Message | ChatMessage;
	threadMode: 'persona' | 'custom';
	currentBuddy?: BuddyVersionMerged;
}>();
const { threadId, message, threadMode, currentBuddy } = toRefs(props);

const emit = defineEmits<{
	(e: 'edit', id: string): void;
	(e: 'delete', id: string): void;
	(e: 'clearThread'): void;
}>();

const isUser = computed(() => message.value.role === 'user');

// @ts-ignore
const imgValue = ref(message.value.image || '');
watch(
	() => message.value,
	async (newVal) => {
		// @ts-ignore
		if (!newVal.image) return;
		// @ts-ignore
		imgValue.value = newVal.image;
	}
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
const handleEdit = async (e: KeyboardEvent) => {
	if (e.key !== 'Enter') return;
	if (!e.ctrlKey) return;

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
	if (message.value.role !== 'user') return;
	await api.message.removeOne(message.value.id);
	emit('delete', message.value.id);
};
const doCopyMessage = () => {
	if (!message.value.content || !copyToClipboard) return;
	copyToClipboard(message.value.content);
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

const hasTTS = computed(() => {
	// @ts-ignore
	if (!message.value.tts) return false;
	// @ts-ignore
	return message.value.tts;
});
const tts = computed(() => {
	// @ts-ignore
	return message.value.tts || '';
});

const doTTS = async () => {
	if (isUser.value) return;

	if (!hasTTS.value) {
		const ttsModel = store.getTTSModelPath(currentBuddy.value?.id || '');
		const ttsEnabled = !!ttsModel;

		if (!ttsEnabled) {
			toast({
				variant: 'destructive',
				title: 'TTS is disabled',
				description: 'Please set a Text-to-Speech voice in the settings',
			});
			return;
		}
		const filename = `${Date.now()}.wav`;
		const text = cleanTextForTTS(message.value.content);

		await makeTTS({
			absModelPath: ttsModel,
			outputFilename: filename,
			text,
		});

		const ttsUrl = urls.tts.get(filename);
		playAudio(ttsUrl);

		await api.message.updateOne(message.value.id, undefined, undefined, ttsUrl);
		emit('edit', message.value.id);
		return;
	}

	playAudio(tts.value);
};
</script>

<template>
	<Dialog :modal="true" :open="modalOpen" @update:open="modalOpen = $event">
		<ContextMenu>
			<ContextMenuTrigger>
				<Card
					class="chat-message whitespace-pre-wrap"
					:id="'message-' + message.id"
				>
					<CardHeader
						v-if="threadMode === 'persona'"
						class="p-3 flex flex-row items-center space-x-2 pt-1 pb-2"
					>
						<!-- would be good ux to have an option or a link to option to update user name -->
						<!-- TODO button to Request Pic -->
						<Avatar
							v-if="isUser"
							class="text-md mt-2 font-bold"
							:style="{
								backgroundColor: textToHslColor(userName, 60, 80),
							}"
						>
							<AvatarFallback>{{ msgInitials }}</AvatarFallback>
						</Avatar>
						<span v-if="isUser">
							{{ userName }}
						</span>
						<span v-else>
							<RouterLink
								:to="`/buddy/${currentBuddy?.id}/view`"
								class="flex items-center hover:bg-primary-foreground hover:text-primary-background p-1 rounded-lg"
							>
								<BuddyAvatar v-if="!isUser && currentBuddy" :buddy="currentBuddy" />
								{{ currentBuddy?.name }}
							</RouterLink>
						</span>

						<Button
							v-if="!isUser"
							@click="doTTS"
							variant="secondary"
							size="sm"
							class="ml-2"
						>
							<Volume2 />
						</Button>
						<!-- add audio speed control -->
					</CardHeader>
					<CardHeader
						v-else
						class="p-3 flex flex-row items-center space-x-2 pt-1 pb-2"
					>
						{{ message.role === 'user' ? userName : 'AI' }}
						<Button
							v-if="!isUser"
							@click="doTTS"
							variant="secondary"
							size="sm"
							class="ml-2"
						>
							<Volume2 />
						</Button>
					</CardHeader>
					<CardContent class="p-3 pl-6 pt-0 flex items-center justify-between gap-2">
						<div class="grow">
							{{ message.content }}
						</div>
						<MessageImage v-if="imgValue" :imgValue="imgValue" />
					</CardContent>
				</Card>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem @click="doCopyMessage">Copy</ContextMenuItem>
				<DialogTrigger asChild>
					<ContextMenuItem
						@click="triggerEdit"
						v-if="isUser || threadMode === 'custom'"
					>
						Edit
					</ContextMenuItem>
				</DialogTrigger>
				<ContextMenuItem @click="doDelete" v-if="isUser">Delete</ContextMenuItem>

				<!-- TODO confirm (reuse same dialog) -->
				<ContextMenuSeparator v-if="isDevMode()" />
				<ContextMenuItem v-if="isDevMode()" @click="doClearThread">
					Delete All Messages
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{{ editingMessageTitle }}</DialogTitle>
			</DialogHeader>
			<DialogDescription>
				<Textarea
					v-model="editingMessage"
					@keydown.enter="handleEdit"
					placeholder="Message content..."
					class="w-full min-h-48"
				/>
			</DialogDescription>
			<DialogFooter>
				<DialogClose as-child>
					<Button @click="handleCancel" type="button" variant="outline"
						>Cancel</Button
					>
					<Button @click="handleEdit" type="button">Confirm</Button>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
