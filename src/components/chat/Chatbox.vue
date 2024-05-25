<script setup lang="ts">
import { ref, toRefs, computed, watch, onBeforeMount } from 'vue';
import { useChat, useCompletion } from 'ai/vue';
import { storeToRefs } from 'pinia';
import { RefreshCw, RefreshCcwDot, Mic, MicOff } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/components/ui/toast';
import BuddyCard from '@/components/BuddyCard.vue';
import type {
	ChatThread,
	MergedChatThread,
	BuddyVersionMerged,
	ChatMessage,
} from '@/lib/api/types-db';
import { api } from '@/lib/api';
import urls from '@/lib/api/urls';
import { apiMsgsToOpenai } from '@/lib/api/utils';
import { useAppStore } from '@/stores/main';
import router from '@/lib/router';
import { AppSettings } from '@/lib/api/AppSettings';
import { negPromptFromName } from '@/lib/prompt/sd';
import { makePicture } from '@/lib/ai/img';
import Message from './ChatMessage.vue';
import {
	imgDescriptionFromChat,
	imgPromptFromDescription,
	shouldSendImg,
} from '@/src/lib/prompt/img/chat';
import { titleFromMessages } from '@/src/lib/prompt/chat';
import { isDevMode, playAudio } from '@/src/lib/utils';
import usePiper from '@/src/composables/usePiper';
import { cleanTextForTTS, makeTTS } from '@/src/lib/ai/tts';
import useWhisper from '@/src/composables/useWhisper';

const { toast } = useToast();
const { updateBuddies, updateThreads } = useAppStore();
const store = useAppStore();
const { buddies, threads } = storeToRefs(store);
const { complete } = useCompletion({ api: urls.message.completion() });

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// https://github.com/parsehex/BuddyGenAI/issues/2
// there is a bug where if you unfocus the window while buddy is responding,
// the message won't finish loading and it leads to the thread being in a broken state
// TODO fix this
// in the meantime, this is a workaround
window.addEventListener('focus', async () => {
	if (isDevMode() && messages.value.length === 0) {
		window.location.reload();
	}

	if (isLoading.value) {
		const lastMessage = messages.value[messages.value.length - 1];
		if (lastMessage.role !== 'assistant') {
			window.location.reload();
		}

		const content1 = lastMessage.content;
		await delay(500);
		const content2 = messages.value[messages.value.length - 1].content;

		if (content1 === content2) {
			window.location.reload();
		}
	}
});

const props = defineProps<{
	threadId: string;
	initialMessages: Promise<ChatMessage[]> | ChatMessage[];
}>();
const { threadId, initialMessages } = toRefs(props);

const sysIsOpen = ref(false);
const hasSysMessage = computed(() =>
	messages.value.some((m) => m.role === 'system')
);
const sysMessage = computed(() => messages.value[0]);
const newSysMessage = ref('');

const threadTitle = computed(() => {
	const thread = threads.value.find((t) => t.id === threadId.value);
	return thread?.name || '';
});

const apiPartialBody = ref({
	threadId: threadId.value,
	temperature: 0.75,
	seed: -1,
});

const scrollToBottom = () => {
	const lastMessage = document.querySelector('div#chatbox > span:last-child');
	if (lastMessage) {
		lastMessage.scrollIntoView();
	}

	document.body.scrollTop = 0;
};

interface Message {
	role: 'user' | 'assistant';
	content: string;
}
const msgsToSave = [] as Message[];

const reloadingId = ref('');

console.log('hey, we have a new id', threadId.value);

// TODO if first time, generate first message to user
// TODO figure out solution to stream completion response

// await initialMessages.value;

console.log('initial messages', await initialMessages.value);

const userName = AppSettings.get('user_name') as string;

const { messages, input, handleSubmit, setMessages, reload, isLoading, stop } =
	useChat({
		initialMessages: await initialMessages.value,
		sendExtraMessageFields: true,
		api: urls.message.create(),
		body: apiPartialBody.value,
		onFinish: async () => {
			let ttsToSave = '';
			const autoRead = store.settings.auto_read_chat;
			console.log('autoRead', autoRead);
			// @ts-ignore
			if (autoRead === 1 || autoRead === '1.0') {
				const lastMessage = messages.value[messages.value.length - 1];
				const filename = `${Date.now()}.wav`;
				const text = cleanTextForTTS(lastMessage.content);
				console.log('tts text', text);
				await makeTTS({
					absModelPath: store.getTTSModelPath(),
					outputFilename: filename,
					text,
				});

				// @ts-ignore
				lastMessage.tts = urls.tts.get(filename);
				ttsToSave = urls.tts.get(filename);
				const newMessages = [...messages.value].map((m) => m);
				newMessages[messages.value.length - 1] = lastMessage;
				setMessages(newMessages);

				playAudio(urls.tts.get(filename));
			}

			const assistant =
				threadMode.value === 'persona'
					? currentBuddy.value?.name || ''
					: 'Assistant';
			const user = userName;

			let cmd = (await complete(shouldSendImg(userName, assistant), {
				body: {
					max_tokens: 512,
					temperature: 0.05,
					messages: messages.value.slice().map((m) => ({
						role: m.role === 'user' ? user : assistant,
						content: m.content,
					})),
				},
			})) as string;
			cmd = cmd.trim();

			// check for missing end bracket
			if (cmd && cmd[0] === '{' && cmd[cmd.length - 1] !== '}') {
				cmd += '}';
			}
			let imgToSave = '';
			console.log('cmd', cmd.length, cmd);
			let isValidJSON = false;
			try {
				JSON.parse(cmd);
				isValidJSON = true;
			} catch (e) {
				isValidJSON = false;
			}
			let cmdObj = {} as any;
			if (isValidJSON) {
				cmdObj = JSON.parse(cmd);
			}
			let explicit = cmd?.includes('explicit') && !isValidJSON;
			if (cmdObj.send_image && !explicit) {
				if (!cmdObj.description) {
					const img = await complete(
						imgDescriptionFromChat(userName, currentBuddy.value?.name || ''),
						{
							body: { max_tokens: 100, temperature: 0.1, messages: messages.value },
						}
					);
					console.log('img', img);
					if (img) {
						explicit = img?.includes('explicit');
						cmdObj.description = img;
					}
				}

				if (cmdObj.description && !explicit) {
					// update the message's image to be and empty string
					// const lastMessage = messages.value[messages.value.length - 1];
					const lastMessage = JSON.parse(
						JSON.stringify(messages.value[messages.value.length - 1])
					);
					lastMessage.image = 'loading';
					const newMessages = [...messages.value].map((m) =>
						JSON.parse(JSON.stringify(m))
					);
					newMessages[messages.value.length - 1] = lastMessage;
					console.log('newMessages', newMessages);
					setMessages(newMessages);

					let p = (await complete(imgPromptFromDescription(cmdObj.description), {
						body: { max_tokens: 50, temperature: 0.1 },
					})) as string;
					console.log('p', p);
					if (p) p = JSON.parse(p);

					const outputSubDir =
						threadMode.value === 'persona'
							? currentBuddy.value?.id || ''
							: 'AI-Assistant';
					const filename = `${Date.now()}.png`;

					await makePicture({
						absModelPath: store.getImageModelPath(),
						outputSubDir,
						outputFilename: filename,
						posPrompt: p,
						negPrompt: negPromptFromName(currentBuddy.value?.name || ''),
						size: 768,
					});

					const imgPath = urls.buddy.getProfilePic(outputSubDir + '/' + filename);
					imgToSave = imgPath;
				}
			}
			if (explicit) {
				toast({
					variant: 'destructive',
					description:
						'The requested image was considered explicit. Please try again.',
				});
			}

			// if we're reloading, only update the last message with the assistant's response
			if (reloadingId.value) {
				// TODO NOTE below is part of workaround https://github.com/parsehex/BuddyGenAI/issues/2
				const reloadingMsg = messages.value.find((m) => m.id === reloadingId.value);
				if (reloadingMsg?.role === 'user') {
					// add the assistant's response to the last user message
					const lastMessage = messages.value[messages.value.length - 1];
					await api.message.createOne(threadId.value, {
						role: 'assistant',
						content: lastMessage.content.trim(),
					});
					await refreshMessages();
					reloadingId.value = '';
					return;
				}

				let lastMessage = messages.value[messages.value.length - 1];
				lastMessage = { ...lastMessage, content: lastMessage.content.trim() };
				await api.message.updateOne(
					reloadingId.value,
					lastMessage.content.trim(),
					imgToSave,
					ttsToSave
				);
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
					content: lastMessage.content.trim(),
					image: imgToSave,
					tts: ttsToSave,
				};
				msgsToSave.push(msg as any);
			} else {
				console.log('last msg was user message?', lastMessage.content);
			}

			if (msgsToSave.length) {
				for (const msg of msgsToSave) {
					console.log('saving', msg);
					// @ts-ignore
					await api.message.createOne(threadId.value, msg, msg.image, msg.tts);
				}
				msgsToSave.length = 0;
			}

			console.timeEnd('message');

			// TODO break out into a function
			if (messages.value.length === 3) {
				// 3 incl. system message
				console.log('generating title');
				console.time('completion');
				const [msg1, msg2, msg3] = messages.value;
				isLoading.value = true;
				let value = await complete(titleFromMessages(msg1, msg2, msg3), {
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
				isLoading.value = false;
			}

			const m = await refreshMessages();

			scrollToBottom();
		},
		onError: (e) => {
			console.log(e);
			toast({ variant: 'destructive', description: e.message });
		},
	});
watch(
	() => threadId.value,
	async () => {
		const thread = await api.thread.getOne(threadId.value);
		threadMode.value = thread.mode;
		if (thread.mode === 'persona' && thread.persona_id) {
			console.log('thread has persona', thread.persona_id);
			selectedBuddy.value = thread.persona_id;
		}

		const initMsgs = await initialMessages.value;
		if (initMsgs.length) {
			setMessages(apiMsgsToOpenai(initMsgs));
		} else {
			await refreshMessages();
		}
	}
);

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
	const newMessages = apiMsgsToOpenai(await api.message.getAll(threadId.value));
	setMessages(newMessages);
	return newMessages;
}
async function refreshBuddies() {
	const newBuddies = await updateBuddies();
	if (
		threadMode.value === 'persona' &&
		!selectedBuddy.value &&
		newBuddies?.length === 1
	) {
		selectedBuddy.value = newBuddies[0].id;
	}
	return newBuddies || [];
}

const doSubmit = async (e: Event) => {
	if ((e as KeyboardEvent).shiftKey) return;
	if (!canSend || input.value === '' || isLoading.value) return;
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
	console.log(
		'sysIsOpen',
		sysIsOpen.value,
		hasSysMessage.value,
		sysMessage.value
	);
	if (!sysMessage.value) return;
	newSysMessage.value = sysMessage.value.content;
};
const updateSysMessage = async () => {
	if (!sysMessage.value) {
		await api.message.createOne(threadId.value, {
			// @ts-ignore
			role: 'system',
			content: newSysMessage.value,
			thred_index: 0,
		});
		await refreshMessages();
		return;
	}
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
		}, 10);
		return;
	}
	await api.message.removeAll(threadId.value);
	await api.thread.updateOne(threadId.value, { mode: newMode });

	await updateThread();
	await refreshBuddies();
	await refreshMessages();
};
watch(threadMode, handleThreadModeChange);

const buddyModeUseCurrent = ref(false);

const selectedBuddy = ref(thread.value?.persona_id || '');
const handleBuddyChange = async () => {
	// TODO add a confirmation dialog if there are messages already
	if (!threadId) return;
	if (refreshed.value) {
		setTimeout(() => {
			refreshed.value = false;
		}, 10);
		return;
	}

	await api.thread.updateOne(threadId.value, {
		persona_id: selectedBuddy.value,
	});

	await refreshMessages();
	await refreshBuddies();
};
const currentBuddy = computed(() =>
	buddies.value.find((p) => p.id === selectedBuddy.value)
);
watch(selectedBuddy, handleBuddyChange);

await refreshBuddies();

let t: ChatThread | undefined;
try {
	t = await updateThread();
	console.log('thread', t);
} catch (e) {
	await router.push('/');
}
refreshed.value = true;
threadMode.value = t?.mode || 'custom';

if (threadMode.value === 'persona' && t?.persona_mode_use_current) {
	buddyModeUseCurrent.value = true;
}

refreshed.value = true;
selectedBuddy.value = t?.persona_id || '';
await refreshMessages();
onBeforeMount(async () => {
	setTimeout(() => {
		scrollToBottom();
	}, 250);
});

const updateSysFromBuddy = async () => {
	if (!threadId) return;
	await api.thread.updateSystemMessage(threadId.value);

	await refreshMessages();
};

const canSend = computed(() => {
	if (!store.isExternalProvider) {
		if (!store.chatServerRunning) {
			return false;
		}
	}
	if (!store.settings.selected_model_chat) {
		return false;
	}
	return input.value !== '' && !isLoading.value;
});

const canReload = computed(() => {
	if (!store.isExternalProvider) {
		if (!store.chatServerRunning) {
			return false;
		}
	}
	if (!store.settings.selected_model_chat) {
		return false;
	}
	return messages.value.length >= 2 && !isLoading.value;
});

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: BlobPart[] = [];
const recording = ref(false);
const loadingTranscript = ref(false);
const startRecording = async () => {
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		console.log('getUserMedia not supported on your browser!');
		return;
	}

	if (recording.value) {
		console.log('already recording');
		recording.value = false;
		mediaRecorder?.stop();

		return;
	}

	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		mediaRecorder = new MediaRecorder(stream);
		audioChunks = [];

		mediaRecorder.addEventListener('dataavailable', (event) => {
			console.log('dataavailable', event.data);
			audioChunks.push(event.data);

			if (!recording.value) {
				const audioBlob = new Blob(audioChunks);

				const reader = new FileReader();
				reader.onloadend = async function () {
					// @ts-ignore
					const buf = Buffer.from(reader.result);

					const whisper = useWhisper();

					if (!whisper?.runWhisper) {
						throw new Error('Whisper not available');
					}
					loadingTranscript.value = true;
					const result = await whisper.runWhisper({
						model: store.getWhisperModelPath(),
						input: buf,
					});
					console.log('whisper result', result);

					loadingTranscript.value = false;
					if (typeof result === 'string') {
						input.value = result.trim();

						const autoSend = store.settings.auto_send_stt;
						// @ts-ignore
						if (autoSend === '1.0' || autoSend === 1) {
							doSubmit(new Event('submit'));
						}
					}
				};
				reader.readAsArrayBuffer(audioBlob);
			}
		});

		mediaRecorder.start();
		recording.value = true;
	} catch (err) {
		console.log('The following error occurred: ' + err);
	}
};

// disjointed note:
// TODO should save the keywords (extraPrompt) that we generate desc with
</script>

<template>
	<div
		class="flex flex-col px-4 pb-4 mx-auto stretch w-full h-screen"
		v-if="threadId !== ''"
	>
		<div
			class="flex items-center justify-between py-4 border-b-2 border-gray-100 dark:border-gray-700"
		>
			<h2 class="text-2xl font-bold">
				{{ threadTitle }}
			</h2>
			<BuddyCard
				v-if="threadMode === 'persona' && selectedBuddy && currentBuddy"
				:persona="currentBuddy"
			/>
		</div>
		<Collapsible
			v-if="threadMode === 'custom'"
			class="my-2"
			v-model:open="sysIsOpen"
			:defaultOpen="false"
		>
			<CollapsibleTrigger @click="handleSysMessageOpen">
				<Button type="button" variant="ghost" size="sm">
					{{ sysIsOpen ? 'Hide' : 'Show' }} Custom Instructions
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
		<ScrollArea style="height: 100%" id="messages-scroll">
			<div class="flex flex-col gap-1 my-1" id="chatbox">
				<Message
					v-for="m in uiMessages"
					:key="m.id"
					:thread-id="threadId"
					:thread-mode="threadMode"
					:current-persona="currentBuddy"
					:message="m"
					@edit="refreshMessages"
					@delete="refreshMessages"
					@clearThread="refreshMessages"
				/>
			</div>
		</ScrollArea>

		<form class="w-full flex gap-1.5 items-center justify-center mt-1">
			<Button
				type="button"
				size="sm"
				@click="startRecording"
				title="Start recording audio"
				:variant="recording ? 'destructive' : 'default'"
				:class="loadingTranscript ? 'opacity-75 cursor-not-allowed' : ''"
				:disaled="loadingTranscript"
			>
				<Mic v-if="!recording" />
				<MicOff v-else />
			</Button>
			<Textarea
				class="p-2 rounded shadow-sm text-lg max-h-52 border border-gray-300 dark:border-gray-700"
				tabindex="1"
				v-model="input"
				placeholder="Say something..."
				@keydown.enter="doSubmit"
				autofocus
			/>
			<div class="flex flex-col items-center gap-1">
				<Button
					type="button"
					size="sm"
					@click="doSubmit"
					class="info"
					:disabled="!canSend"
				>
					<!-- TODO implement stop -->
					<!-- TODO switch to send icon and stop icon -->
					Send
				</Button>
				<Button
					v-if="messages.length"
					type="button"
					class="w-full"
					size="sm"
					:disabled="!canReload"
					@click="doReload"
					title="Re-submit your last message to get a new response"
				>
					<RefreshCcwDot />
				</Button>
			</div>
		</form>
		<p
			class="mt-4 text-sm text-gray-400 select-none"
			v-if="uiMessages.length > 2 || (uiMessages.length > 1 && !isLoading)"
		>
			<u><i>Reminder</i></u>
			Buddies in this app are AI -- they make mistakes sometimes and they're not
			real people.
		</p>
	</div>
</template>

<style lang="scss" scoped>
//
</style>