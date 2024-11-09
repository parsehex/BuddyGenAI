<script setup lang="ts">
import { ref, toRefs, computed, watch, onBeforeMount } from 'vue';
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
import { genderFromName, negPromptFromName } from '@/lib/prompt/sd';
import { makePicture } from '@/lib/ai/img';
import Message from './ChatMessage.vue';
import {
	imgDescriptionFromChat,
	imgPromptFromDescription,
	shouldSendImg,
} from '@/src/lib/prompt/img/chat';
import { titleFromMessages } from '@/src/lib/prompt/chat';
import { attemptToFixJson, delay, isDevMode, playAudio } from '@/src/lib/utils';
import { makeAndReadTTS, makeTTS } from '@/src/lib/ai/tts';
import { cleanTextForTTS } from '@/src/lib/ai/utils';
import useWhisper from '@/src/composables/useWhisper';
import ThreadImages from './ThreadImages.vue';
import useElectron from '@/src/composables/useElectron';
import useChat from '@/src/composables/useChat';
import { complete } from '@/src/lib/ai/complete';

const { toast } = useToast();
const { updateBuddies, updateThreads } = useAppStore();
const store = useAppStore();
const { buddies, threads } = storeToRefs(store);
const { pathJoin } = useElectron();

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

// TODO if first time, generate first message to user
// TODO figure out solution to stream completion response

// await initialMessages.value;

// console.log('initial messages', await initialMessages.value);

const userName = AppSettings.get('user_name') as string;

// what does useChat do (that we use it for)?
// - handles messages array
//   - updates the `content` of the latest message to stream completion response
// - manages the `isLoading` state
// - handles reloading

const { messages, input, handleSubmit, setMessages, reload, isLoading, stop } =
	useChat({
		initialMessages: await initialMessages.value,
		body: apiPartialBody.value,
		onFinish: async () => {
			// so what all happens here?
			// - do auto read if enabled
			// - conditionally send an image (if enabled and not deemed explicit)
			// - reload if we're reloading
			// - save the messages
			// - generate a title if we're at 3 messages (first message pair)

			if (!pathJoin) throw new Error('pathJoin not available');

			// TODO keep isloading on until we finish everything here

			const lastMessage = messages.value[messages.value.length - 1];

			// TODO idea here is to allow the user to specify a note that is extracted + added as a new
			//   system message that further instructs the ai buddy
			let addedInstruction = '';
			const noteRegex = /^\[Note: (.*)\]/;
			const noteMatch = lastMessage.content.match(noteRegex);
			if (noteMatch) {
				addedInstruction = noteMatch[1];
				lastMessage.content = lastMessage.content.replace(noteRegex, '').trim();
			}

			const ttsModel = store.getTTSModelPath(currentBuddy.value?.id || '');
			let ttsToSave = (await makeAndReadTTS(lastMessage.content, ttsModel)) || '';
			if (ttsToSave) {
				// @ts-ignore
				lastMessage.tts = ttsToSave;
				const newMessages = [...messages.value].map((m) => m);
				newMessages[messages.value.length - 1] = lastMessage;
				setMessages(newMessages);
			}

			// begin image sending
			const assistantName =
				threadMode.value === 'persona'
					? currentBuddy.value?.name || ''
					: 'Assistant';
			const user = userName;

			const chatImageEnabled = store.settings.chat_image_enabled;
			const isChatImageEnabled =
				// @ts-ignore
				chatImageEnabled === '1.0' || chatImageEnabled === 1;
			let cmdObj = {} as any;
			let cmd = '';
			if (isChatImageEnabled) {
				cmd = (await complete(shouldSendImg(userName, assistantName), {
					body: {
						max_tokens: 512,
						temperature: 0.01,
						messages: messages.value
							.slice()
							.map(
								(m) =>
									({
										role: m.role === 'user' ? user : assistantName,
										content: m.content,
									} as ChatMessage)
							)
							.slice(-6),
					},
				})) as string;

				console.log('cmd', cmd.length, cmd);
				cmd = attemptToFixJson(cmd);

				let isValidJSON = false;
				try {
					JSON.parse(cmd);
					isValidJSON = true;
				} catch (e) {
					isValidJSON = false;
				}
				if (isValidJSON) {
					cmdObj = JSON.parse(cmd);
				}
			}

			let imgToSave = '';
			// let explicit = !isValidJSON && cmd?.includes('explicit');

			if (isChatImageEnabled && cmdObj.do_send) {
				let buddyAppearance = '';
				let gender = '';
				const genderPrompt = genderFromName(
					currentBuddy.value?.name || '',
					currentBuddy.value?.profile_pic_prompt || ''
				);
				const completion = await complete(genderPrompt);
				if (completion) {
					gender = completion.toLowerCase();
					buddyAppearance += gender + ', ';
				}

				if (currentBuddy.value?.profile_pic_prompt) {
					buddyAppearance += currentBuddy.value.profile_pic_prompt;
				}
				const imgDescPrompt = imgDescriptionFromChat(
					userName,
					currentBuddy.value?.name || 'AI Assistant',
					buddyAppearance
				);
				console.log('imgDescPrompt', imgDescPrompt);
				const img = await complete(imgDescPrompt, {
					body: {
						max_tokens: 100,
						temperature: 0.1,
						messages: messages.value.slice(-6),
					},
				});
				console.log('img description', img);
				if (img) {
					// explicit = img?.includes('explicit');
					try {
						const o = JSON.parse(img);
						cmdObj.description = o.description;
					} catch (e) {
						console.log('error parsing img description', e);
						cmdObj.description = img;
					}
				}

				if (cmdObj.description && cmdObj.do_send) {
					// if (cmdObj.description && cmdObj.do_send && !explicit) {
					const lastMessage = JSON.parse(
						JSON.stringify(messages.value[messages.value.length - 1])
					);
					lastMessage.image = 'loading';
					const newMessages = [...messages.value].map((m) =>
						JSON.parse(JSON.stringify(m))
					);
					newMessages[messages.value.length - 1] = lastMessage;
					setMessages(newMessages);

					let p = (await complete(imgPromptFromDescription(cmdObj.description), {
						body: { max_tokens: 125, temperature: 0.1 },
					})) as string;
					console.log('img prompt', p);
					if (p) {
						p = attemptToFixJson(p);
						p = JSON.parse(p);

						let outputSubDir =
							threadMode.value === 'persona'
								? currentBuddy.value?.id || ''
								: 'AI-Assistant';
						// save to thread subdirectory
						if (threadId.value) {
							outputSubDir = await pathJoin(outputSubDir, threadId.value);
						}
						const filename = `${Date.now()}.png`;

						const quality = store.settings.chat_image_quality;

						await makePicture({
							absModelPath: store.getImageModelPath(),
							outputSubDir,
							outputFilename: filename,
							posPrompt: p,
							negPrompt: negPromptFromName(currentBuddy.value?.name || '', gender),
							size: 768,
							quality: quality as any,
						});

						const imgPath = urls.buddy.getProfilePic(outputSubDir + '/' + filename);
						imgToSave = imgPath;
					}
				}
			}
			// if (explicit) {
			// 	toast({
			// 		variant: 'destructive',
			// 		description:
			// 			'The requested image was considered explicit. Please try again.',
			// 	});
			// }

			// if we're reloading, only update the last message with the assistant's response
			if (reloadingId.value) {
				await handleReloading(ttsToSave, imgToSave);
				return;
			}

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
					// console.log('saving', msg);
					// @ts-ignore
					await api.message.createOne(threadId.value, msg, msg.image, msg.tts);
				}
				msgsToSave.length = 0;
			}

			console.timeEnd('message');

			await condWriteThreadTitle();
			await refreshMessages();
			scrollToBottom();
		},
		onError: (e) => {
			console.log(e);
			toast({ variant: 'destructive', description: e.message });
		},
	});

const handleReloading = async (ttsToSave: string, imgToSave: string) => {
	// TODO NOTE Begin part of workaround https://github.com/parsehex/BuddyGenAI/issues/2
	const reloadingMsg = messages.value.find((m) => m.id === reloadingId.value);
	if (reloadingMsg?.role === 'user') {
		// shouldn't normally happen but add the assistant's response to the thread
		const lastMessage = messages.value[messages.value.length - 1];
		await api.message.createOne(threadId.value, {
			role: 'assistant',
			content: lastMessage.content.trim(),
		});
		await refreshMessages();
		reloadingId.value = '';
		return;
	}
	// TODO NOTE End part of workaround

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
	await condWriteThreadTitle();
};

/** Conditionally genertate chat thread title after sending first message. */
const condWriteThreadTitle = async () => {
	if (messages.value.length !== 3) return; // 3 incl. system message

	// TODO sometimes the output is like { "description": "something" } which might be cut off
	// TODO use fix JSON function (is it generic? pass in options to fix?)
	//   an option like "pickFirstString" shouold work here, where an object is expected to just have one value
	//   or a separate function specifically for one-value objects (could have a "expectedKey" option)

	console.time('completion');
	const [msg1, msg2, msg3] = messages.value;
	isLoading.value = true;
	let value = await complete(titleFromMessages(msg1, msg2, msg3), {
		body: { max_tokens: 20, temperature: 0.01 },
	});
	console.debug('Thread title completion', value);

	if (value) {
		// TODO improve this (llm response parsing)
		if (value.startsWith('Title: ')) {
			value = value.slice(7);
		}
		value = value.trim();
		if (value[0] === '"' && value[value.length - 1] === '"') {
			value = value.slice(1, -1);
		}
		console.debug('Thread title parsed value', value);
		await api.thread.updateOne(threadId.value, { name: value });
		await updateThreads();
		console.timeEnd('completion');
	}

	isLoading.value = false;
};

watch(
	() => threadId.value,
	async () => {
		const thread = await api.thread.getOne(threadId.value);
		threadMode.value = thread.mode;
		if (thread.mode === 'persona' && thread.persona_id) {
			selectedBuddy.value = thread.persona_id;
		}

		const initMsgs = await initialMessages.value;
		if (initMsgs.length) {
			setMessages(initMsgs);
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

const threadImages = computed(() =>
	// @ts-ignore
	messages.value.filter((m) => m.image && m.role === 'assistant')
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
		// won't happen yeah? Send is disabled if isLoading
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
	// console.log('thread', t);
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

	const whisperModelPath = store.getWhisperModelPath();
	const whisperEnabled = whisperModelPath && whisperModelPath !== '0';
	if (!whisperEnabled) {
		toast({
			variant: 'destructive',
			title: 'Speech-to-Text is disabled',
			description: 'Please set a Speech-to-Text model in the settings',
		});
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
						model: whisperModelPath,
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
			<ThreadImages
				v-if="threadImages.length > 0"
				:images="threadImages.map((m: any) => ({ url: m.image }))"
			/>
			<BuddyCard
				v-if="threadMode === 'persona' && selectedBuddy && currentBuddy"
				:buddy="currentBuddy"
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
					Instructions {{ sysIsOpen ? '▲' : '▼' }}
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
					:current-buddy="currentBuddy"
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
				<Button type="button" size="sm" @click="doSubmit" :disabled="!canSend">
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
			class="mt-4 text-sm font-semibold text-gray-400 dark:text-gray-600 select-none"
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
