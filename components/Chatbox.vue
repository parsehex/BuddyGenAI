<script setup lang="ts">
import { useChat, useCompletion } from 'ai/vue';
import { RefreshCw, RefreshCcwDot } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
	ChatThread,
	MergedChatThread,
	PersonaVersionMerged,
} from '@/lib/api/types-db';
import Message from './ChatMessage.vue';
import { useToast } from '@/components/ui/toast';
import api from '@/lib/api/db';
import urls from '@/lib/api/urls';
import { apiMsgsToOpenai } from '@/lib/api/utils';
import { useAppStore } from '@/stores/main';

const { toast } = useToast();
const { updatePersonas, updateThreads } = useAppStore();
const personas = useAppStore().personas as PersonaVersionMerged[];
const threads = useAppStore().threads as MergedChatThread[];
const { complete } = useCompletion({ api: urls.message.completion() });

const props = defineProps<{
	threadId: string;
}>();
const { threadId } = toRefs(props);

const sysIsOpen = ref(false);
const hasSysMessage = computed(() =>
	messages.value.some((m) => m.role === 'system')
);
const sysMessage = computed(() =>
	messages.value.find((m) => m.role === 'system')
);
const newSysMessage = ref('');

const threadTitle = computed(() => {
	const thread = threads.find((t) => t.id === threadId.value);
	return thread?.name || '';
});

const apiPartialBody = ref({
	threadId: threadId.value,
	temperature: 0.95,
	seed: -1,
});

const scrollToBottom = () => {
	const lastMessage = document.querySelector('.chat-message:last-child');
	if (lastMessage) {
		lastMessage.scrollIntoView();
	}
};

interface Message {
	role: 'user' | 'assistant';
	content: string;
}
const msgsToSave = [] as Message[];

const reloadingId = ref('');

const { messages, input, handleSubmit, setMessages, reload, isLoading, stop } =
	useChat({
		api: urls.message.create(),
		body: apiPartialBody.value,
		onFinish: async () => {
			// if we're reloading, only update the last message with the assistant's response
			if (reloadingId.value) {
				let lastMessage = messages.value[messages.value.length - 1];
				lastMessage = { ...lastMessage, content: lastMessage.content };
				await api.message.updateOne(reloadingId.value, lastMessage.content);
				await refreshMessages();
				reloadingId.value = '';

				// TODO regen title if first msg, like below
				return;
			}

			console.log('onFinish', messages.value.length);

			const lastMessage = messages.value[messages.value.length - 1];
			if (lastMessage.role === 'assistant') {
				const msg = {
					role: 'assistant',
					content: lastMessage.content,
				};
				msgsToSave.push(msg as any);
			} else {
				console.log('last msg was user message?', lastMessage.content);
			}

			if (msgsToSave.length) {
				for (const msg of msgsToSave) {
					console.log('saving', msg);
					await api.message.createOne(threadId.value, msg);
				}
				msgsToSave.length = 0;
			}

			console.timeEnd('message');

			// TODO break out into a function
			if (messages.value.length === 3) {
				// 3 incl. system message
				console.log('generating title');
				console.time('completion');
				const msg1 = messages.value[0];
				const msg2 = messages.value[1];
				const msg3 = messages.value[2];
				const prompt = `Your task is to write a generic title in 5 words or less for the following chat.\n\nContext: ${msg1.content}\n\n${msg2.role}: ${msg2.content}\n\n${msg3.role}: ${msg3.content}`;
				let value = await complete(prompt, {
					body: { max_tokens: 20, temperature: 0.01 },
				});
				if (value) {
					// TODO improve this (llm response parsing)
					if (value.startsWith('Title: ')) {
						value = value.slice(7);
					}
					value = value.trim();
					if (value[0] === '"' && value[value.length - 1] === '"') {
						value = value.slice(1, -1);
					}
					await api.thread.updateOne(threadId.value, { name: value });
					await updateThreads();
					console.timeEnd('completion');
				}
			}

			const m = await refreshMessages();
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

const uiMessages = computed(() =>
	messages.value.filter((m) => m.role !== 'system')
);

async function updateThread() {
	const newThread = await api.thread.getOne(threadId.value);
	thread.value = newThread;
	return newThread;
}
async function refreshMessages() {
	const newMessages = await api.message.getAll(threadId.value);
	setMessages(apiMsgsToOpenai(newMessages));
	return newMessages;
}
async function refreshPersonas() {
	const newPersonas = await updatePersonas();
	if (
		threadMode.value === 'persona' &&
		!selectedPersona.value &&
		newPersonas?.length === 1
	) {
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
	console.time('message');
	const msg = {
		role: 'user',
		content: input.value,
	};
	msgsToSave.push(msg as any);
	handleSubmit(e);
	setTimeout(scrollToBottom, 5);
};
const doReload = async () => {
	if (isLoading.value) {
		return;
	}
	reloadingId.value = messages.value[messages.value.length - 1].id;
	reload();
};

const handleSysMessageOpen = async () => {
	if (!sysMessage.value) return;
	newSysMessage.value = sysMessage.value.content;
};
const updateSysMessage = async () => {
	if (!sysMessage.value) return;
	await api.message.updateOne(sysMessage.value.id, newSysMessage.value);
	const newMessages = await refreshMessages();
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
	await api.message.removeAll(threadId.value);
	await api.thread.updateOne(threadId.value, { mode: newMode });

	await updateThread();
	await refreshPersonas();
	await refreshMessages();
};
watch(threadMode, handleThreadModeChange);

const personaModeUseCurrent = ref(false);
const handlePersonaModeUseCurrentChange = async () => {
	if (!threadId) return;
	const newValue = !personaModeUseCurrent.value;
	personaModeUseCurrent.value = newValue;

	await api.thread.updateOne(threadId.value, {
		persona_mode_use_current: newValue,
	});

	await refreshMessages();
};

const selectedPersona = ref(thread.value?.persona_id || '');
const handlePersonaChange = async () => {
	// TODO add a confirmation dialog if there are messages already
	if (!threadId) return;
	if (refreshed.value) {
		setTimeout(() => {
			refreshed.value = false;
		}, 10);
		return;
	}

	await api.thread.updateOne(threadId.value, {
		persona_id: selectedPersona.value,
	});

	await refreshMessages();
	await refreshPersonas();
};
const currentPersona = computed(() =>
	personas.find((p) => p.id === selectedPersona.value)
);
watch(selectedPersona, handlePersonaChange);

onBeforeMount(async () => {
	await refreshPersonas();

	let t: ChatThread | undefined;
	try {
		t = await updateThread();
		console.log('t', t);
	} catch (e) {
		await navigateTo('/');
		return;
	}

	refreshed.value = true;
	threadMode.value = t?.mode || 'custom';

	if (threadMode.value === 'persona' && t?.persona_mode_use_current) {
		personaModeUseCurrent.value = true;
	}

	refreshed.value = true;
	selectedPersona.value = t?.persona_id || '';

	await refreshMessages();
});

const updateSysFromPersona = async () => {
	if (!threadId) return;
	await api.thread.updateSystemMessage(threadId.value);

	await refreshMessages();
};

// disjointed note:
// TODO should save the keywords (extraPrompt) that we generate desc with
</script>

<template>
	<div class="flex flex-col w-full pb-32 mx-auto stretch" v-if="threadId !== ''">
		<h2
			class="fixed text-2xl font-bold grow self-center bg-white shadow-sm p-1 rounded-md z-10"
		>
			{{ threadTitle }}
		</h2>
		<div class="flex items-center justify-between mt-10">
			<div class="my-2 w-full inline-flex items-center justify-start">
				<RadioGroup
					v-model="threadMode"
					v-if="!uiMessages.length && !currentPersona"
					class="mx-4"
				>
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
										<RadioGroupItem
											class="px-1"
											value="persona"
											:disabled="!personas.length"
										/>
										Buddy
									</Label>
								</TooltipTrigger>
								<TooltipContent v-if="!personas.length">
									<!-- TODO add a Persona Creator/Wizard + link in this tooltip -->
									<p>
										No buddies available :(
										<br />
										<Button type="button" @click="navigateTo('/persona/add')">
											Create one
										</Button>
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</RadioGroup>
				<div v-if="uiMessages.length" class="flex items-center space-x-2">
					<Label
						v-if="threadMode === 'persona' && personas.length"
						class="mx-4 cursor-pointer flex items-center"
					>
						<Switch
							class="mr-1"
							:checked="personaModeUseCurrent"
							@update:checked="handlePersonaModeUseCurrentChange"
						/>
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
				<PersonaSelect
					v-if="threadMode === 'persona' && !uiMessages.length"
					v-model="selectedPersona"
					class="my-2"
				/>
			</div>
			<PersonaCard
				v-if="threadMode === 'persona' && selectedPersona && currentPersona"
				:persona="currentPersona"
			/>
		</div>
		<Collapsible
			v-if="hasSysMessage && threadMode === 'custom'"
			class="my-2"
			v-model:open="sysIsOpen"
			:defaultOpen="false"
		>
			<CollapsibleTrigger @click="handleSysMessageOpen">
				<Button type="button" size="sm">
					{{ sysIsOpen ? 'Hide' : 'Show' }} System Message
				</Button>
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
				@edit="refreshMessages"
				@delete="refreshMessages"
				@clearThread="refreshMessages"
			/>
		</div>

		<form
			class="w-full fixed bottom-0 flex gap-1.5 items-center justify-center p-2 bg-white shadow-xl"
		>
			<Textarea
				class="p-2 border border-gray-300 rounded shadow-xl"
				tabindex="1"
				v-model="input"
				placeholder="Say something..."
				@keydown.ctrl.enter="doSubmit"
			/>
			<Button type="button" size="sm" @click="doSubmit">
				<!-- TODO implement stop -->
				<!-- TODO switch to send icon and stop icon -->
				{{ isLoading ? 'Stop' : 'Send' }}
			</Button>
			<Button type="button" size="sm" @click="doReload"><RefreshCcwDot /></Button>
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
