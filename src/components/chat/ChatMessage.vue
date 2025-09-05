<script setup lang="ts">
import { ref, computed, toRefs, watch } from 'vue';
import type { BuddyVersionMerged, ChatMessage } from '@/lib/api/types-db';
import { Button } from '@/components/ui/button';
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
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/main';
import { copyTextToClipboard, popError } from '@/src/lib/utils';
import { isDevMode } from '@/lib/utils';
import { useImgAI } from '@/src/composables/ai/useImgAI';
import ChatMessageCard from './ChatMessageCard.vue';

const store = useAppStore();
const imgAI = useImgAI();

const props = defineProps<{
	threadId: string;
	message: ChatMessage;
	threadMode: 'persona' | 'custom';
	currentBuddy?: BuddyVersionMerged;
	isLoading: boolean;
}>();
const { threadId, message, threadMode, isLoading } = toRefs(props);

const emit = defineEmits<{
	(e: 'edit', id: string): void;
	(e: 'delete', id: string): void;
	(e: 'clearThread'): void;
	(e: 'generateImage', messageId: string): void;
}>();

const isUser = computed(() => message.value.role === 'user');
const isAssistant = computed(() => message.value.role === 'assistant');

const editingMessageTitle = ref('');
const editingMessage = ref('');
const modalOpen = ref(false);

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

const canGenerateImage = computed(() => {
	if (!isAssistant.value) return false;
	if (!store.settings.chat_image_enabled) return false;
	if (!imgAI.isAvailable) return false;
	if (isLoading.value) return false;
	if (message.value.image) return false; // Already has an image
	return true;
});

const doDelete = async () => {
	await api.message.removeOne(message.value.id);
	emit('delete', message.value.id);
};
const doCopyMessage = () => {
	copyTextToClipboard(message.value.content);
};
const doClearThread = async () => {
	if (!threadId) return;
	await api.message.removeAll(threadId.value);
	emit('clearThread');
};
const doGenerateImage = async () => {
	if (!canGenerateImage.value) return;
	emit('generateImage', message.value.id);
};
</script>
<template>
	<Dialog :modal="true" :open="modalOpen" @update:open="modalOpen = $event">
		<ContextMenu>
			<ContextMenuTrigger>
				<ChatMessageCard :can-generate="canGenerateImage" :current-buddy="currentBuddy" :is-loading="isLoading"
					:is-user="isUser" :message="message" :thread-mode="threadMode" @clear="doClearThread" @copy="doCopyMessage"
					@delete="doDelete" @edit="triggerEdit" @generate="doGenerateImage" />
			</ContextMenuTrigger>
			<ContextMenuContent>
				<DialogTrigger asChild>
					<ContextMenuItem @click="triggerEdit" v-if="isUser || threadMode === 'custom'"> Edit </ContextMenuItem>
				</DialogTrigger>
				<ContextMenuItem @click="doDelete">Delete</ContextMenuItem>
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
					<Button @click="handleEdit(null, true)" type="button">Save</Button>
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
