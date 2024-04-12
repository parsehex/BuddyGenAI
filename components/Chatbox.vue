<script setup lang="ts">
import { useChat } from 'ai/vue';
import type { Message } from 'ai/vue';
import { RefreshCcwDot } from 'lucide-vue-next';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getThread, updateThread } from '@/lib/api/thread';
import { getMessages, deleteMessages, updateMessage, deleteMessage, apiMsgsToOpenai } from '@/lib/api/message';
import type { ChatMessage, ChatThread, Persona } from '~/server/database/types';

const props = defineProps<{
	threadId: string;
}>();
const { threadId } = toRefs(props);

const sysIsOpen = ref(false);
const hasSysMessage = computed(() => messages.value.some((m) => m.role === 'system'));
const sysMessage = computed(() => messages.value.find((m) => m.role === 'system'));
const newSysMessage = ref('');

const threadTitle = ref('');
const api = ref(`/api/message?threadId=${threadId}`);

const updateThreadTitle = async () => {
	// TODO remove this -- how to get updates to thread title?
	// idea: only allow rename from sidebar + save to store, watch store from here
	const { value: thread } = await getThread(threadId.value);
	threadTitle.value = thread.name;
};

await updateThreadTitle();
const msgs = ref([] as ChatMessage[]);

const apiPartialBody = { threadId: threadId.value };

const { messages, input, handleSubmit, setMessages, reload, isLoading, stop } = useChat({
	api: api.value,
	body: apiPartialBody,
	onFinish: async () => {
		// const { value: newMessages } = await getMessages(threadId.value);
		const newMessages = await $fetch(`/api/messages?threadId=${threadId.value}`);
		setMessages(apiMsgsToOpenai(newMessages));

		setTimeout(() => {
			const lastMessage = document.getElementById(`message-${newMessages[newMessages.length - 1].id}`);
			if (lastMessage) {
				lastMessage.scrollIntoView();
			}
		}, 10);
	},
});

const uiMessages = computed(() => messages.value.filter((m) => m.role !== 'system'));

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
const currentRightClickedMessageId = ref('' as string);
const doDelete = async () => {
	if (!currentRightClickedMessageId.value) return;
	const msg = messages.value.find((m) => m.id === currentRightClickedMessageId.value);
	console.log('deleting message', msg);
	if (msg && msg.role !== 'user') {
		console.log('only user messages can be deleted');
		return;
	}
	await deleteMessage(currentRightClickedMessageId.value);

	const { value: newMessages } = await getMessages(threadId.value);
	console.log('newMessages', newMessages);
	setMessages(apiMsgsToOpenai(newMessages));
};

const didRightClickUser = computed(() => {
	const msg = messages.value.find((m) => m.id === currentRightClickedMessageId.value);
	return msg && msg.role === 'user';
});

const editingMessageTitle = ref('');
const editingMessage = ref('');
const triggerEdit = async () => {
	const msg = messages.value.find((m) => m.id === currentRightClickedMessageId.value);
	if (msg) {
		const role = msg.role === 'user' ? 'User' : 'AI';
		editingMessageTitle.value = `Editing ${role}'s Message`;
		editingMessage.value = msg.content;
	}
	console.log('triggerEdit', msg);
};
const handleEdit = async () => {
	const msg = messages.value.find((m) => m.id === currentRightClickedMessageId.value);
	if (!currentRightClickedMessageId.value || !msg) return;
	await updateMessage({
		id: msg.id,
		content: editingMessage.value,
	});

	const { value: newMessages } = await getMessages(threadId.value);
	setMessages(apiMsgsToOpenai(newMessages));

	editingMessage.value = '';
};

const handleSysMessageOpen = async () => {
	if (!sysMessage.value) return;
	newSysMessage.value = sysMessage.value.content;
};
const updateSysMessage = async () => {
	if (!sysMessage.value) return;
	await updateMessage({
		id: sysMessage.value.id,
		content: newSysMessage.value,
	});
	const { value: newMessages } = await getMessages(threadId.value);
	setMessages(apiMsgsToOpenai(newMessages));
	const newSys = newMessages.find((m) => m.role === 'system');
	if (newSys) {
		newSysMessage.value = newSys.content;
	}
};

const refreshed = ref(false);
const thread = ref({} as ChatThread);
const threadMode = ref('custom' as 'custom' | 'persona');
const handleThreadModeChange = async (newMode: 'custom' | 'persona') => {
	if (!threadId) return;
	if (refreshed.value) {
		setTimeout(() => {
			refreshed.value = false;
			console.log('refreshed');
		}, 10);
		return;
	}
	if (uiMessages.value.length) {
		// TODO allow but clear messages
		console.log('changing mode with messages is not supported yet');
		return;
	}
	await updateThread({
		id: threadId.value,
		mode: newMode,
	});

	const { value: newMessages } = await getMessages(threadId.value);
	setMessages(apiMsgsToOpenai(newMessages));
};
watch(threadMode, handleThreadModeChange);

const personas = ref([] as Persona[]);

const selectedPersona = ref('');
const handlePersonaChange = async () => {
	if (!threadId) return;
	if (refreshed.value) {
		setTimeout(() => {
			refreshed.value = false;
		}, 10);
		return;
	}
	await $fetch('/api/thread', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			id: threadId.value,
			persona_id: selectedPersona.value,
		}),
	});

	const { value: newMessages } = await getMessages(threadId.value);
	setMessages(apiMsgsToOpenai(newMessages));

	const p = await $fetch(`/api/personas`);
	personas.value = p;
};
const currentPersona = computed(() => personas.value.find((p) => p.id === selectedPersona.value));
watch(selectedPersona, handlePersonaChange);

const doClearThread = async () => {
	if (!threadId) return;
	await deleteMessages(threadId.value);

	const { value: newMessages } = await getMessages(threadId.value);
	setMessages(apiMsgsToOpenai(newMessages));
};

onBeforeMount(async () => {
	const p = await $fetch('/api/personas');
	personas.value = p;

	const t = await $fetch(`/api/thread?id=${threadId.value}`);
	thread.value = t;

	refreshed.value = true;
	threadMode.value = t.mode;
	threadMode.value === 'persona' ? thread.value.persona_id : '';

	refreshed.value = true;
	selectedPersona.value = t.persona_id || '';

	const m = await $fetch(`/api/messages?threadId=${threadId.value}`);
	msgs.value = m;
	setMessages(apiMsgsToOpenai(m));
});

const updateSysFromPersona = async () => {
	if (!threadId) return;
	await $fetch(`/api/update-thread-from-persona?threadId=${threadId.value}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	const m = await $fetch(`/api/messages?threadId=${threadId.value}`);
	msgs.value = m;
};
</script>

<template>
	<div class="flex flex-col w-full pt-4 pb-24 mx-auto stretch" v-if="threadId !== ''">
		<div class="flex items-end justify-between">
			<h2 class="text-2xl font-bold mb-4 grow text-center">{{ threadTitle }}</h2>
			<PersonaCard v-if="threadMode === 'persona'" :personaId="selectedPersona" />
		</div>
		<RadioGroup v-model="threadMode" v-if="!uiMessages.values.length" class="my-2">
			<Label>Thread Mode</Label>
			<div class="flex items-center space-x-5">
				<TooltipProvider :delay-duration="100">
					<Tooltip>
						<TooltipTrigger>
							<Label class="cursor-pointer">
								<RadioGroupItem class="px-1" value="custom" />
								Custom
							</Label>
							<Label class="cursor-pointer">
								<RadioGroupItem class="px-1" value="persona" />
								Persona
							</Label>
						</TooltipTrigger>
						<TooltipContent>
							<h2 class="text-lg text-center font-bold">Warning</h2>
							<p>Changing this is destructive -- all messages except the first/system message will be lost.</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</RadioGroup>
		<PersonaSelect v-if="threadMode === 'persona' && !uiMessages.length" v-model="selectedPersona" class="my-2" />
		<Collapsible v-if="hasSysMessage && threadMode === 'custom'" class="my-2" v-model:open="sysIsOpen" :defaultOpen="false">
			<CollapsibleTrigger @click="handleSysMessageOpen">
				<Button type="button" size="sm">{{ sysIsOpen ? 'Hide' : 'Show' }} System Message</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<Card class="whitespace-pre-wrap">
					<!-- TODO add system presets (add to header) -->
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
					<Card v-for="m in uiMessages" :key="m.id" class="whitespace-pre-wrap" @contextmenu="currentRightClickedMessageId = m.id" :id="'message-' + m.id">
						<CardHeader class="p-3" v-if="threadMode === 'persona'">
							{{ m.role === 'user' ? 'User' : currentPersona?.name }}
						</CardHeader>
						<CardHeader class="p-3" v-else>
							{{ m.role === 'user' ? 'User' : 'AI' }}
						</CardHeader>
						<CardContent class="p-3 pl-6 pt-0">{{ m.content }}</CardContent>
					</Card>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<DialogTrigger asChild>
						<ContextMenuItem>
							<span @click="triggerEdit">Edit</span>
						</ContextMenuItem>
					</DialogTrigger>
					<ContextMenuItem @click="doDelete" v-if="didRightClickUser">Delete</ContextMenuItem>
					<ContextMenuSeparator />
					<!-- TODO confirm -->
					<ContextMenuItem v-if="threadMode === 'persona'" @click="updateSysFromPersona">Update System Message</ContextMenuItem>
					<ContextMenuItem @click="doClearThread">Delete All Messages</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{{ editingMessageTitle }}</DialogTitle>
				</DialogHeader>
				<DialogDescription>
					<Textarea v-model="editingMessage" placeholder="Message content..." />
					<p class="py-1 text-sm text-muted-foreground">
						<b>Warning</b>: Clicking outside to cancel is broken -- <u>use the X button above instead</u>.
						<br />
						(If the textarea is empty then click Close above and try again)</p
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
			<!-- TODO fix -->
			<!-- the reload method calls same api endpoint with same messaages -->
			<!-- <Button type="button" size="sm" @click="doReload"><RefreshCcwDot /> </Button> -->
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
