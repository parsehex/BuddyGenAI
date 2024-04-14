<script setup lang="ts">
import type { Message } from 'ai/vue';
import type { PersonaVersionMerged } from '~/server/database/types';
import useElectron from '~/composables/useElectron';
const { copyToClipboard } = useElectron();

const props = defineProps<{
	threadId: string;
	message: Message;
	threadMode: 'persona' | 'custom';
	currentPersona?: PersonaVersionMerged;
}>();

const emit = defineEmits<{
	(e: 'edit', id: string): void;
	(e: 'delete', id: string): void;
	(e: 'clearThread'): void;
}>();

const { threadId, message, threadMode, currentPersona } = toRefs(props);
const isUser = computed(() => message.value.role === 'user');

const editingMessageTitle = ref('');
const editingMessage = ref('');

const triggerEdit = async () => {
	editingMessageTitle.value = `Editing Message`;
	editingMessage.value = message.value.content;
};
const handleEdit = async () => {
	await $fetch(`/api/message`, {
		method: 'PUT',
		body: JSON.stringify({ id: message.value.id, content: editingMessage.value }),
		headers: { 'Content-Type': 'application/json' },
	});
	editingMessage.value = '';
	emit('edit', message.value.id);
};

const doDelete = async () => {
	if (message.value.role !== 'user') return;
	await $fetch(`/api/message?id=${message.value.id}`, { method: 'DELETE' });
	emit('delete', message.value.id);
};
const doCopyMessage = () => {
	if (!message.value.content || !copyToClipboard) return;
	copyToClipboard(message.value.content);
};
const doClearThread = async () => {
	if (!threadId) return;
	await $fetch(`/api/messages?threadId=${threadId.value}`, {
		method: 'DELETE',
	});
	emit('clearThread');
};
</script>

<template>
	<Dialog :modal="true">
		<ContextMenu>
			<ContextMenuTrigger>
				<Card class="chat-message whitespace-pre-wrap" :id="'message-' + message.id">
					<CardHeader class="p-3" v-if="threadMode === 'persona'">
						{{ message.role === 'user' ? 'User' : currentPersona?.name }}
					</CardHeader>
					<CardHeader class="p-3" v-else>
						{{ message.role === 'user' ? 'User' : 'AI' }}
					</CardHeader>
					<CardContent class="p-3 pl-6 pt-0">{{ message.content }}</CardContent>
				</Card>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem @click="doCopyMessage">Copy</ContextMenuItem>
				<DialogTrigger asChild>
					<ContextMenuItem @click="triggerEdit">Edit</ContextMenuItem>
				</DialogTrigger>
				<ContextMenuItem @click="doDelete" v-if="isUser">Delete</ContextMenuItem>
				<ContextMenuSeparator />
				<!-- TODO confirm (reuse same dialog) -->
				<ContextMenuItem @click="doClearThread">Delete All Messages</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{{ editingMessageTitle }}</DialogTitle>
			</DialogHeader>
			<DialogDescription>
				<!-- TODO how to programmatically close dialog? (i.e. on ctrl+enter) -->
				<Textarea v-model="editingMessage" placeholder="Message content..." />
				<p class="py-1 text-sm text-muted-foreground">
					<b>Warning</b>: Clicking outside to cancel is broken -- <u>use the X button above instead</u>.
					<br />
					(If the textarea is empty then click Close above and try again)
				</p>
			</DialogDescription>
			<DialogFooter>
				<DialogClose as-child>
					<Button @click="handleEdit" type="button">Confirm</Button>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
