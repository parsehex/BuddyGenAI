<script setup lang="ts">
import { useChat } from 'ai/vue';
import { RefreshCw } from 'lucide-vue-next';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getThread } from '@/lib/api/thread';
import { updateMessage, apiMsgsToOpenai } from '@/lib/api/message';
import type { ChatMessage, ChatThread, PersonaVersionMerged } from '~/server/database/types';
import Message from './ChatMessage.vue';

const props = defineProps<{
	threadId: string;
}>();
const { threadId } = toRefs(props);

const sysIsOpen = ref(false);
const hasSysMessage = computed(() => messages.value.some((m) => m.role === 'system'));
const sysMessage = computed(() => messages.value.find((m) => m.role === 'system'));
const newSysMessage = ref('');

const threadTitle = ref('');

const apiPartialBody = ref({ threadId: threadId.value });

const scrollToBottom = () => {
	const lastMessage = document.querySelector('.chat-message:last-child');
	if (lastMessage) {
		lastMessage.scrollIntoView();
	}
};

const personas = ref([] as PersonaVersionMerged[]);
const { messages, input, handleSubmit, setMessages, reload, isLoading, stop } = useChat({
	api: '/api/message',
	body: apiPartialBody.value,
	onFinish: async () => {
		await updateMessages();
	},
});
watch(
	() => messages.value.length,
	() => {
		scrollToBottom();
	}
);

const uiMessages = computed(() => messages.value.filter((m) => m.role !== 'system'));

async function updateThread() {
	const newThread = await $fetch(`/api/thread?id=${threadId.value}`);
	thread.value = newThread;
	threadTitle.value = newThread.name;
	return newThread;
}
async function updateMessages() {
	const newMessages = await $fetch(`/api/messages?threadId=${threadId.value}`);
	setMessages(apiMsgsToOpenai(newMessages));
	return newMessages;
}
async function updatePersonas() {
	const newPersonas = await $fetch(`/api/personas`);
	personas.value = newPersonas;
	if (threadMode.value === 'persona' && !selectedPersona.value && newPersonas.length === 1) {
		selectedPersona.value = newPersonas[0].id;
	}
	return newPersonas;
}

const doSubmit = async (e: Event) => {
	if (input.value === '') return;
	if (isLoading.value) {
		e.preventDefault();
		stop();
		console.log('prevented submit & stopped');
		return;
	}
	handleSubmit(e);
	setTimeout(scrollToBottom, 5);
};
const doReload = async () => {
	if (isLoading.value) {
		return;
	}
	reload();
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
	const newMessages = await updateMessages();
	const newSys = newMessages.find((m) => m.role === 'system');
	if (newSys) newSysMessage.value = newSys.content;
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
	await $fetch(`/api/messages?threadId=${threadId.value}`, {
		method: 'DELETE',
	});

	await $fetch('/api/thread', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			id: threadId.value,
			mode: newMode,
		}),
	});

	await updateThread();
	await updatePersonas();
	await updateMessages();
};
watch(threadMode, handleThreadModeChange);

const personaModeUseCurrent = ref(false);
const handlePersonaModeUseCurrentChange = async () => {
	if (!threadId) return;
	const newValue = !personaModeUseCurrent.value;
	personaModeUseCurrent.value = newValue;
	await $fetch('/api/thread', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			id: threadId.value,
			persona_mode_use_current: newValue,
		}),
	});

	await updateMessages();
};

const selectedPersona = ref('');
const handlePersonaChange = async () => {
	// TODO add a confirmation dialog if there are messages already
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

	await updateMessages();
	await updatePersonas();
};
const currentPersona = computed(() => personas.value.find((p) => p.id === selectedPersona.value));
watch(selectedPersona, handlePersonaChange);

onBeforeMount(async () => {
	await updatePersonas();

	let t: any;
	try {
		t = await updateThread();
	} catch (e) {
		navigateTo('/');
	}

	refreshed.value = true;
	threadMode.value = thread.value.mode;

	if (threadMode.value === 'persona' && thread.value.persona_mode_use_current) {
		personaModeUseCurrent.value = true;
	}

	refreshed.value = true;
	selectedPersona.value = t.persona_id || '';

	await updateMessages();
});

const updateSysFromPersona = async () => {
	if (!threadId) return;
	await $fetch(`/api/update-thread-from-persona?threadId=${threadId.value}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	await updateMessages();
};
</script>

<template>
	<div class="flex flex-col w-full pt-4 pb-24 mx-auto stretch" v-if="threadId !== ''">
		<div class="flex items-end justify-between">
			<h2 class="text-2xl font-bold mb-4 grow text-center">{{ threadTitle }}</h2>
			<PersonaCard v-if="threadMode === 'persona' && selectedPersona" :personaId="selectedPersona" />
		</div>
		<RadioGroup v-model="threadMode" v-if="!uiMessages.values.length" class="my-2">
			<TooltipProvider :delay-duration="100">
				<Tooltip>
					<TooltipTrigger>
						<Label>Thread Mode</Label>
						<!-- TODO organize for one -->
						<!-- TODO when there are messages already and user changes the mode, confirm that doing so will delete all messages before continuing -->
					</TooltipTrigger>
					<TooltipContent>
						<h2 class="text-lg text-center font-bold">Warning</h2>
						<p>Changing this is destructive -- all messages except the first/system message will be lost.</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<div class="flex items-center space-x-5 justify-center">
				<Label class="cursor-pointer">
					<RadioGroupItem class="px-1" value="custom" />
					Custom
				</Label>
				<TooltipProvider :delay-duration="100">
					<Tooltip>
						<TooltipTrigger>
							<Label :class="{ 'cursor-pointer': personas.length }">
								<RadioGroupItem class="px-1" value="persona" :disabled="!personas.length" />
								Persona
							</Label>
						</TooltipTrigger>
						<TooltipContent v-if="!personas.length">
							<!-- TODO add a Persona Creator/Wizard + link in this tooltip -->
							<p>
								No personas available.
								<br />
								<Button type="button" @click="navigateTo('/persona/add')">Create one</Button>
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<Label v-if="threadMode === 'persona' && personas.length" class="cursor-pointer flex items-center">
					<Switch class="mr-1" :checked="personaModeUseCurrent" @update:checked="handlePersonaModeUseCurrentChange" />
					Keep in sync
				</Label>
				<Button
					type="button"
					size="xs"
					itle="Update system message from current Persona version"
					v-if="threadMode === 'persona' && !personaModeUseCurrent"
					@click="updateSysFromPersona"
				>
					<RefreshCw />
				</Button>
			</div>
		</RadioGroup>
		<PersonaSelect v-if="threadMode === 'persona' && !uiMessages.length" v-model="selectedPersona" class="my-2" />
		<Collapsible v-if="hasSysMessage && threadMode === 'custom'" class="my-2" v-model:open="sysIsOpen" :defaultOpen="false">
			<CollapsibleTrigger @click="handleSysMessageOpen">
				<Button type="button" size="sm">{{ sysIsOpen ? 'Hide' : 'Show' }} System Message</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<Card class="whitespace-pre-wrap">
					<CardHeader>Custom Instructions</CardHeader>
					<CardContent><Textarea v-model="newSysMessage" /></CardContent>
					<!-- TODO add system presets-->
					<CardFooter>
						<Button type="button" @click="updateSysMessage">Update</Button>
					</CardFooter>
				</Card>
			</CollapsibleContent>
		</Collapsible>

		<Message
			v-for="m in uiMessages"
			:key="m.id"
			:thread-id="threadId"
			:thread-mode="threadMode"
			:current-persona="currentPersona"
			:message="m"
			@edit="updateMessages"
			@delete="updateMessages"
			@clearThread="updateMessages"
		/>

		<form class="w-full fixed bottom-0 flex gap-1.5">
			<Input class="p-2 mb-8 border border-gray-300 rounded shadow-xl" tabindex="1" v-model="input" placeholder="Say something..." @keydown.enter="doSubmit" />
			<Button type="button" size="sm" @click="doSubmit">{{ isLoading ? 'Stop' : 'Send' }}</Button>
			<!-- TODO fix - the reload method calls same api endpoint with same messaages -->
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
