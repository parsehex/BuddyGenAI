<script setup lang="ts">
import { useChat } from 'ai/vue';
import { RefreshCcwDot } from 'lucide-vue-next';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useAppStore } from '../stores/main';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const sysIsOpen = ref(false);
const hasSysMessage = computed(() => messages.value.some((m: any) => m.role === 'system'));
const sysMessage = computed(() => messages.value.find((m: any) => m.role === 'system'));
const newSysMessage = ref('');

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

const { messages, input, handleSubmit, setMessages, reload, isLoading, stop } = useChat({
	api: api.value,
	initialMessages: msgs,
	onFinish: async () => {
		const newMessages = await fetchMessages();
		setMessages(newMessages);
	},
});
const uiMessages = computed(() => messages.value.filter((m: any) => m.role !== 'system'));

const doSubmit = async (e: Event) => {
	if (input.value === '') return;
	if (isLoading.value) {
		e.preventDefault();
		stop();
		console.log('prevented submit & stopped');
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

const editingMessageTitle = ref('');
const editingMessage = ref('');
const triggerEdit = async () => {
	const msg = messages.value.find((m: any) => m.id === currentRightClickedMessageId.value);
	if (msg) {
		const role = msg.role === 'user' ? 'User' : 'AI';
		editingMessageTitle.value = `Editing ${role}'s Message`;
		editingMessage.value = msg.content;
	}
	console.log('triggerEdit', msg);
};
const handleEdit = async () => {
	const msg = messages.value.find((m: any) => m.id === currentRightClickedMessageId.value);
	if (!currentRightClickedMessageId.value || !msg) return;
	await fetch(`/api/message`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ id: msg.id, content: editingMessage.value }),
	});

	const newMessages = await fetchMessages();
	setMessages(newMessages);

	editingMessage.value = '';
};

const handleSysMessageOpen = async () => {
	if (!sysMessage.value) return;
	newSysMessage.value = sysMessage.value.content;
};
const updateSysMessage = async () => {
	if (!sysMessage.value) return;
	await fetch(`/api/message`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ id: sysMessage.value.id, content: newSysMessage.value }),
	});
	const newMessages = await fetchMessages();
	setMessages(newMessages);
	const newSys = newMessages.find((m: any) => m.role === 'system');
	if (newSys) {
		newSysMessage.value = newSys.content;
	}
};
</script>

<template>
	<div class="flex flex-col w-full py-24 mx-auto stretch" v-if="store.selectedThreadId !== ''">
		<h2 class="text-2xl font-bold mb-4">{{ threadTitle }}</h2>
		<Collapsible v-if="hasSysMessage" class="my-2" v-model:open="sysIsOpen" :defaultOpen="false">
			<CollapsibleTrigger @click="handleSysMessageOpen">
				<Button type="button" size="sm">{{ sysIsOpen ? 'Hide' : 'Show' }} System Message</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<Card class="whitespace-pre-wrap">
					<CardHeader>System</CardHeader>
					<CardContent><Textarea v-model="newSysMessage" /></CardContent>
					<CardFooter>
						<Button type="button" @click="updateSysMessage">Update</Button>
					</CardFooter>
				</Card>
			</CollapsibleContent>
		</Collapsible>
		<Dialog :modal="true">
			<ContextMenu>
				<ContextMenuTrigger>
					<Card v-for="m in uiMessages" :key="m.id" class="whitespace-pre-wrap" @contextmenu="currentRightClickedMessageId = m.id">
						<CardHeader>{{ m.role === 'user' ? 'User' : 'AI' }}</CardHeader>
						<CardContent>{{ m.content }}</CardContent>
					</Card>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<DialogTrigger asChild>
						<ContextMenuItem>
							<span @click="triggerEdit">Edit</span>
						</ContextMenuItem>
					</DialogTrigger>
					<ContextMenuItem @click="doDelete" v-if="didRightClickUser">Delete</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{{ editingMessageTitle }}</DialogTitle>
				</DialogHeader>
				<DialogDescription>
					<Textarea v-model="editingMessage" placeholder="Message content..." />
					<p class="py-1 text-sm text-muted-foreground"
						><b>Warning</b>: Clicking outside to cancel is broken -- <b><u>use the X button above instead</u></b
						>.</p
					>
				</DialogDescription>
				<DialogFooter>
					<DialogClose as-child>
						<Button @click="handleEdit" type="button">Confirm</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<form class="w-full fixed bottom-0 flex gap-1.5">
			<Input class="p-2 mb-8 border border-gray-300 rounded shadow-xl" tabindex="1" v-model="input" placeholder="Say something..." @keydown.enter="doSubmit" />
			<Button type="button" size="sm" @click="doSubmit">{{ isLoading ? 'Stop' : 'Send' }}</Button>
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
