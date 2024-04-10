<script setup lang="ts">
import { useChat } from 'ai/vue';
import { RefreshCcwDot } from 'lucide-vue-next';
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from './ui/context-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { useAppStore } from '../stores/main';

const store = useAppStore();

const threadTitle = ref('');
const api = computed(() => `/api/message?threadId=${store.selectedThreadId}`);

const fetchMessages = async () => {
	if (!store.selectedThreadId) return;

	const res = await fetch(`/api/messages?threadId=${store.selectedThreadId}`);
	let msgs = await res.json();

	return msgs;
};
const updateThreadTitle = async () => {
	if (!store.selectedThreadId) return;
	const res = await fetch(`/api/thread?id=${store.selectedThreadId}`);
	const thread = await res.json();
	threadTitle.value = thread.name;
};

await updateThreadTitle();
const msgs = await fetchMessages();

const { messages, input, handleSubmit, setMessages, reload, isLoading } = useChat({
	api: api.value,
	initialMessages: msgs,
	onFinish: async () => {
		const newMessages = await fetchMessages();
		setMessages(newMessages);
	},
});

const doSubmit = async (e: Event) => {
	if (input.value === '') return;
	if (isLoading.value) {
		e.preventDefault();
		console.log('prevented submit');
		return;
	}
	handleSubmit(e);
};
const doReload = async () => {
	if (isLoading.value) {
		return;
	}
	reload();
};
const doDelete = async () => {
	if (!currentRightClickedMessageId.value) return;
	const msg = messages.value.find((m: any) => m.id === currentRightClickedMessageId.value);
	console.log('deleting message', msg);
	if (msg && msg.role !== 'user') {
		console.log('only user messages can be deleted');
		return;
	}
	await fetch(`/api/message?id=${currentRightClickedMessageId.value}`, {
		method: 'DELETE',
	});

	const newMessages = await fetchMessages();
	console.log('newMessages', newMessages);
	setMessages(newMessages);
};

const currentRightClickedMessageId = ref(null as any);
const didRightClickUser = computed(() => {
	const msg = messages.value.find((m: any) => m.id === currentRightClickedMessageId.value);
	return msg && msg.role === 'user';
});
</script>

<template>
	<div class="flex flex-col w-full py-24 mx-auto stretch" v-if="store.selectedThreadId !== ''">
		<h2 class="text-2xl font-bold mb-4">{{ threadTitle }}</h2>
		<Dialog>
			<ContextMenu>
				<ContextMenuTrigger>
					<Card v-for="m in messages" :key="m.id" class="whitespace -pre-wrap" @contextmenu="currentRightClickedMessageId = m.id">
						<CardHeader>{{ m.role === 'user' ? 'User' : 'AI' }}</CardHeader>
						<CardContent>{{ m.content }}</CardContent>
					</Card>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuLabel>Message Options</ContextMenuLabel>
					<ContextMenuSeparator />
					<ContextMenuItem @click="console.log('edit')">Edit</ContextMenuItem>
					<ContextMenuItem @click="doDelete" v-if="didRightClickUser">Delete</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
			<!-- TODO: Edit message textarea -->
		</Dialog>

		<form class="w-full fixed bottom-0 flex gap-1.5">
			<Input class="p-2 mb-8 border border-gray-300 rounded shadow-xl" tabindex="1" v-model="input" placeholder="Say something..." @keydown.enter="doSubmit" />
			<Button type="button" size="sm" @click="doSubmit">Send</Button>
			<Button type="button" size="sm" @click="doReload"><RefreshCcwDot /> </Button>
		</form>
	</div>
</template>

<style lang="scss" scoped>
form {
	align-items: normal;
}
div,
form,
div > form > input {
	max-width: 40rem;
}
</style>
