<script setup lang="ts">
import { useChat } from 'ai/vue';
import { RefreshCw } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ChatMessage, ChatThread, PersonaVersionMerged } from '~/server/database/types';
import Message from './ChatMessage.vue';
import { useToast } from '@/components/ui/toast';
import uF from '@/lib/api/useFetch';
import $f from '@/lib/api/$fetch';
import urls from '~/lib/api/urls';
import { apiMsgsToOpenai } from '~/lib/api/utils';

const { toast } = useToast();

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
	api: urls.message.create(),
	body: apiPartialBody.value,
	onFinish: async () => {
		await updateMessages();
	},
	onError: (e) => {
		console.log(e);
		toast({ variant: 'destructive', description: e.message });
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
	const newThread = await $f.thread.get(threadId.value);
	thread.value = newThread;
	threadTitle.value = newThread.name;
	return newThread;
}
async function updateMessages() {
	const newMessages = await $f.message.getAll(threadId.value);
	setMessages(apiMsgsToOpenai(newMessages));
	return newMessages;
}
async function updatePersonas() {
	const newPersonas = await $f.persona.getAll();
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
	await $f.message.update({
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
	await $f.message.removeAll(threadId.value);

	await $f.thread.update({
		id: threadId.value,
		mode: newMode,
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

	await $f.thread.update({
		id: threadId.value,
		persona_mode_use_current: newValue,
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

	await $f.thread.update({
		id: threadId.value,
		persona_id: selectedPersona.value,
	});

	await updateMessages();
	await updatePersonas();
};
const currentPersona = computed(() => personas.value.find((p) => p.id === selectedPersona.value));
watch(selectedPersona, handlePersonaChange);

onBeforeMount(async () => {
	await updatePersonas();

	let t: ChatThread | undefined;
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
	selectedPersona.value = t?.persona_id || '';

	await updateMessages();
});

const updateSysFromPersona = async () => {
	if (!threadId) return;
	await $f.thread.updateSystemMessage(threadId.value);

	await updateMessages();
};

// disjointed note:
// TODO should save the keywords (extraPrompt) that we generate desc with
</script>

<template>
	<div class="flex flex-col w-full pb-32 mx-auto stretch" v-if="threadId !== ''">
		<h2 class="fixed text-2xl font-bold grow self-center bg-white shadow-sm p-1 rounded-md z-10"> {{ threadTitle }}</h2>
		<div class="flex items-center justify-between mt-10">
			<div class="my-2 w-full inline-flex items-center justify-start">
				<RadioGroup v-model="threadMode" v-if="!uiMessages.length && !currentPersona" class="mx-4">
					<p>Chat Mode</p>
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
										Buddy
									</Label>
								</TooltipTrigger>
								<TooltipContent v-if="!personas.length">
									<!-- TODO add a Persona Creator/Wizard + link in this tooltip -->
									<p>
										No buddies available :(
										<br />
										<Button type="button" @click="navigateTo('/persona/add')">Create one</Button>
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</RadioGroup>
				<div v-if="uiMessages.length" class="flex items-center space-x-2">
					<Label v-if="threadMode === 'persona' && personas.length" class="mx-4 cursor-pointer flex items-center">
						<Switch class="mr-1" :checked="personaModeUseCurrent" @update:checked="handlePersonaModeUseCurrentChange" />
						Keep Buddy in sync
					</Label>
					<Button
						type="button"
						size="xs"
						title="Update system message from current Buddy version"
						v-if="threadMode === 'persona' && !personaModeUseCurrent"
						@click="updateSysFromPersona"
					>
						<RefreshCw />
					</Button>
				</div>
				<PersonaSelect v-if="threadMode === 'persona' && !uiMessages.length" v-model="selectedPersona" class="my-2" />
			</div>
			<PersonaCard v-if="threadMode === 'persona' && selectedPersona" :personaId="selectedPersona" />
		</div>
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
		<div class="flex flex-col gap-1 mt-1">
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
		</div>

		<form class="w-full fixed bottom-0 flex gap-1.5 items-center justify-center p-2 bg-white shadow-xl">
			<Textarea class="p-2 border border-gray-300 rounded shadow-xl" tabindex="1" v-model="input" placeholder="Say something..." @keydown.ctrl.enter="doSubmit" />
			<Button type="button" size="sm" @click="doSubmit">{{ isLoading ? 'Stop' : 'Send' }}</Button>
			<!-- TODO fix - the reload method calls same api endpoint with same messaages -->
			<!-- <Button type="button" size="sm" @click="doReload"><RefreshCcwDot /> </Button> -->
		</form>
	</div>
</template>

<style lang="scss" scoped>
h2,
div,
form,
div > form > input {
	max-width: 40rem;
}
</style>
