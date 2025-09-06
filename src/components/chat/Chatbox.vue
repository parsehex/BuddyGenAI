<script setup lang="ts">
import { ref, toRefs, computed, watch, onBeforeMount } from 'vue';
import { storeToRefs } from 'pinia';
import { RefreshCcwDot, Send, Square } from 'lucide-vue-next';
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
import type { ChatThread, ChatMessage, BuddyVersionMerged } from '@/lib/api/types-db';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/main';
import router from '@/lib/router';
import Message from './ChatMessage.vue';
import { titleFromMessages } from '@/src/lib/prompt/chat';
import { attemptToFixJson, clone, delay, popError } from '@/src/lib/utils';
import useElectron from '@/src/composables/useElectron';
import useChat from '@/src/composables/useChat';
import { MODEL_NAME } from '@/lib/constants';
import { complete } from '@/src/lib/ai/complete';
import useMobile from '@/src/composables/useMobile';
import { v4 } from 'uuid';
import { insert } from '@/src/lib/sql';
import { isFeatureAvailable } from '@/lib/ai/support';
import RecordAudio from './RecordAudio.vue';
import ChatDisclaimer from './ChatDisclaimer.vue';
import ChatHeader from './ChatHeader.vue';
import { useTTSAI } from '@/src/composables/ai/useTTSAI';
import { useImgAI } from '@/src/composables/ai/useImgAI';
import { genderFromName, negPromptFromName } from '@/lib/prompt/sd';
import {
	imgDescriptionFromChat,
	imgPromptFromDescription,
} from '@/src/lib/prompt/img/chat';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';

const { toast } = useToast();
const { updateBuddies, updateThreads } = useAppStore();
const store = useAppStore();
const ttsAI = useTTSAI();
const imgAI = useImgAI();
const device = useMobile();
const { buddies, threads } = storeToRefs(store);
const { pathJoin, dbRun } = useElectron();

// https://github.com/parsehex/buddyGenAI/issues/2
// there is a bug where if you unfocus the window while ai is responding,
// the message won't finish loading and it leads to the thread being in a broken state
// TODO fix this
// in the meantime, this is a workaround
window.addEventListener('focus', async () => {
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
	model: MODEL_NAME,
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
onBeforeMount(async () => {
	setTimeout(() => {
		scrollToBottom();
	}, 250);
});

interface Message {
	role: 'user' | 'assistant';
	content: string;
}
const msgsToSave = [] as Message[];

const reloadingId = ref('');
const isRecording = ref(false);

const thread = ref({} as ChatThread);
try {
	await updateThread();
} catch (e) {
	await router.push('/');
}
const selectedBuddyId = ref(thread.value?.persona_id || '');
const currentBuddy = computed(() =>
	buddies.value.find((p) => p.id === selectedBuddyId.value) as BuddyVersionMerged
);
const aiName = currentBuddy.value?.name || 'Assistant';

async function updateThread() {
	const newThread = await api.thread.getOne(threadId.value);
	thread.value = newThread;
	return newThread;
}

// TODO if first time, generate first message to user

const userName = computed(() => store.settings.user_name);

const { messages, input, handleSubmit, setMessages, reload, isLoading, stop } =
	useChat({
		aiName,
		initialMessages: await initialMessages.value,
		body: apiPartialBody.value,
		// partialJsonKey: 'message',
		onFinish: async (msgs, response) => {
			// so what all happens here?
			// - conditionally send an image (if enabled and not deemed explicit)
			// - reload if we're reloading
			// - save the messages
			// - generate a title if we're at 3 messages (first message pair)

			if (!pathJoin) throw new Error('pathJoin not available');

			// TODO keep isloading on until we finish everything here

			const lastMessage = messages.value[messages.value.length - 1];

			// TODO (half-baked) idea here is to allow the user to specify a note that is extracted + added as a new
			//   system message that further instructs the ai buddy
			let addedInstruction = '';
			const noteRegex = /^\[Note: (.*)\]/;
			const noteMatch = lastMessage.content.match(noteRegex);
			if (noteMatch) {
				addedInstruction = noteMatch[1];
				lastMessage.content = lastMessage.content.replace(noteRegex, '').trim();
			}

			const ttsVoice = ttsAI.getSelectedVoice(currentBuddy.value?.id || '');
			let ttsDataToSave = (await ttsAI.makeAndReadTTS(lastMessage.content, ttsVoice)) || '';
			if (ttsDataToSave) {
				const id = v4();
				const sqlAudioAdd = insert('audio', { id, data: ttsDataToSave });
				await dbRun(sqlAudioAdd[0], sqlAudioAdd[1]);
				// @ts-ignore
				lastMessage.tts = id;
				const newMessages = [...messages.value].map((m) => m);
				newMessages[messages.value.length - 1] = lastMessage;
				setMessages(newMessages);
			}

			// if we're reloading, only update the last message with the assistant's response
			if (reloadingId.value) {
				await handleReloading(ttsDataToSave, '');
				return;
			}

			if (lastMessage.role === 'assistant') {
				const msg = {
					role: 'assistant',
					content: lastMessage.content.trim(),
					image: '',
					tts: ttsDataToSave,
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
	// TODO NOTE Begin part of workaround https://github.com/parsehex/buddyGenAI/issues/2
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

const extractTitle = (val: string) => {
	if (!val) return '';
	try {
		let data = JSON.parse(val);
		if (Array.isArray(data)) {
			if (typeof data[0] === 'string') return data[0];
			else data = data[0];
		}
		val = data.title;
	} catch (e) { }
	// cleanup val some
	if (val.startsWith('Title: ')) val = val.slice(7);
	val = val.trim();
	if (val[0] === '"' && val[val.length - 1] === '"') {
		val = val.slice(1, -1);
	}
	return val;
};

/** Conditionally genertate chat thread title after sending first message. */
const condWriteThreadTitle = async () => {
	if (messages.value.length > 3) return; // 3 incl. system message

	const [msg1, msg2, msg3] = messages.value;
	let value = await complete(titleFromMessages(msg1, msg2, msg3), {
		body: { max_tokens: 20, temperature: 0.01 },
	}, true);
	value = extractTitle(value);
	if (value) {
		await api.thread.updateOne(threadId.value, { name: value });
		await updateThreads();
	}
};

watch(
	() => threadId.value,
	async () => {
		const thread = await api.thread.getOne(threadId.value);
		threadMode.value = thread.mode;
		if (thread.mode === 'persona' && thread.persona_id) {
			selectedBuddyId.value = thread.persona_id;
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

// sync system message when user description changes
watch(
	() => [store.settings.user_description, store.settings.user_description_assistant, store.settings.user_description_buddies],
	() => {
		refreshMessages();
	}
);

const threadImages = computed(() =>
	messages.value.filter((m) => m.role === 'assistant' && m.image && m.image !== 'loading')
);

const uiMessages = computed(() =>
	messages.value.filter((m) => m.role !== 'system')
);

async function refreshMessages() {
	const newMessages = await api.message.getAll(threadId.value);
	setMessages(newMessages);
	return newMessages;
}
async function refreshBuddies() {
	const newBuddies = await updateBuddies();
	if (
		threadMode.value === 'persona' &&
		!selectedBuddyId.value &&
		newBuddies?.length === 1
	) {
		selectedBuddyId.value = newBuddies[0].id;
	}
	return newBuddies || [];
}

const doSubmitOrStop = async (e?: Event) => {
	const isKeyPressed = e instanceof KeyboardEvent;
	if (isKeyPressed && e?.shiftKey) return;
	if (!canSend) return;
	if (isLoading.value && e && !isKeyPressed) { // clicked stop button
		e.preventDefault();
		stop();
		return;
	}
	if (!e && !store.settings.auto_send_stt) return; // transcription auto-send
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
	if (!hasSysMessage.value) {
		await api.message.createOne(threadId.value, {
			// @ts-ignore
			role: 'system',
			content: newSysMessage.value,
			thred_index: 0,
		});
		await refreshMessages();
		return;
	}
	newSysMessage.value = sysMessage.value.content;
};
const updateSysMessage = async () => {
	if (!hasSysMessage.value) {
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
const threadMode = ref('custom' as 'custom' | 'persona');

const buddyModeUseCurrent = ref(false);

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
		persona_id: selectedBuddyId.value,
	});

	await refreshMessages();
	await refreshBuddies();
};

watch(selectedBuddyId, handleBuddyChange);

await refreshBuddies();

refreshed.value = true;
threadMode.value = thread.value?.mode || 'custom';

if (threadMode.value === 'persona' && thread.value?.persona_mode_use_current) {
	buddyModeUseCurrent.value = true;
}

refreshed.value = true;
selectedBuddyId.value = thread.value?.persona_id || '';
await refreshMessages();

const canSend = computed(() => {
	if (!isFeatureAvailable('chat')) return false;
	if (isRecording.value) return false;
	return !!input.value;
});

const canReload = computed(() => {
	if (!isFeatureAvailable('chat')) return false;
	return uiMessages.value.length >= 2 && !isLoading.value && !isRecording.value;
});

// note/idea:
// for Assistant threads, have option for the AI to be like an assistant for this app
//   - can contextually link to areas in the app
//   - allow updating settings
//     would it be lazy? sure, but i think it would be cool & possibly helpful
//     maybe we could figure out nice UI to just pull this out as a component (called something like AppAssistantChat)
//   this idea is akin to the Setup Chat idea i started on before

const handleGenerateImage = async (messageId: string) => {
	const messageToUpdate = messages.value.find((m) => m.id === messageId);
	if (!messageToUpdate) return;

	// Set loading state for the image
	messageToUpdate.image = 'loading';
	setMessages([...messages.value]); // Update messages to show loading state

	try {
		const assistantName =
			threadMode.value === 'persona'
				? currentBuddy.value?.name || ''
				: 'Assistant';
		const user = store.settings.user_name;

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
			user,
			assistantName,
			buddyAppearance
		);
		console.log('imgDescPrompt', imgDescPrompt);
		const imgDescription = await complete(imgDescPrompt, {
			body: {
				max_tokens: 100,
				temperature: 0.1,
				messages: messages.value.slice(-6),
			},
		}, true);
		console.log('img description', imgDescription);

		let cmdObjDescription = imgDescription;
		if (imgDescription) {
			try {
				let o = JSON.parse(imgDescription);
				if (Array.isArray(o)) o = o[0];
				cmdObjDescription = o.description;
			} catch (e) {
				console.log('error parsing img description', e);
				cmdObjDescription = imgDescription;
			}
		}

		if (!cmdObjDescription) {
			popError('Failed to generate image description.');
			messageToUpdate.image = ''; // Clear loading state
			setMessages([...messages.value]);
			return;
		}

		let p = (await complete(imgPromptFromDescription(cmdObjDescription), {
			body: { max_tokens: 125, temperature: 0.1 },
		})) as string;
		console.log('img prompt', p);

		if (!p) {
			popError('Failed to generate image prompt.');
			messageToUpdate.image = ''; // Clear loading state
			setMessages([...messages.value]);
			return;
		}

		const imgId = v4();
		const filename = imgId;
		const chosen_quality = store.settings.chat_image_quality;
		let steps = 16;
		if (chosen_quality === 'medium') steps = 24;
		else if (chosen_quality === 'high') steps = 32;

		const imgData = await imgAI.makeImage({
			posPrompt: p,
			negPrompt: negPromptFromName(currentBuddy.value?.name || '', gender),
			size: 768,
			steps
		});

		if (!imgData) {
			popError('Failed to generate image.');
			messageToUpdate.image = ''; // Clear loading state
			setMessages([...messages.value]);
			return;
		}

		const sqlImgAdd = insert('images', { id: filename, data: imgData });
		await dbRun(sqlImgAdd[0], sqlImgAdd[1]);

		await api.message.updateOne(messageToUpdate.id, undefined, filename, undefined);
		await refreshMessages(); // Refresh messages to update the UI with the new image
	} catch (error: any) {
		console.error('Error generating image:', error);
		popError(error.message || 'An unknown error occurred during image generation.');
		const originalMessage = messages.value.find((m) => m.id === messageId);
		if (originalMessage) {
			originalMessage.image = ''; // Clear loading state on error
			setMessages([...messages.value]);
		}
	}
};
</script>
<template>
	<div class="flex flex-col px-4 mx-auto stretch w-full h-screen" v-if="threadId !== ''">
		<ChatHeader v-if="!device.isMobile.value" :thread-title="threadTitle" :thread-mode="threadMode"
			:thread-buddy="currentBuddy" :thread-images="threadImages.map((m: any) => ({ url: m.image }))" />
		<ResizablePanelGroup direction="vertical" auto-save-id="chat">
			<ResizablePanel>
				<ScrollArea style="height: 100%" id="messages-scroll">
					<ChatHeader v-if="device.isMobile.value" :thread-title="threadTitle" :thread-mode="threadMode"
						:thread-buddy="currentBuddy" :thread-images="threadImages.map((m: any) => ({ url: m.image }))" />
					<Collapsible v-if="threadMode === 'custom'" class="my-2" v-model:open="sysIsOpen" :defaultOpen="false">
						<CollapsibleTrigger @click="handleSysMessageOpen">
							<Button type="button" variant="ghost" size="sm"> Instructions {{ sysIsOpen ? '▲' : '▼' }} </Button>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<Card class="whitespace-pre-wrap">
								<CardHeader class="p-4">Custom Instructions</CardHeader>
								<CardContent class="p-4 py-0"><Textarea v-model="newSysMessage" /></CardContent>
								<!-- TODO add system presets-->
								<CardFooter class="p-4">
									<Button type="button" @click="updateSysMessage">Update</Button>
								</CardFooter>
							</Card>
						</CollapsibleContent>
					</Collapsible>
					<div class="flex flex-col gap-1 my-1" id="chatbox">
						<Message v-for="(m, i) in uiMessages" :key="m.id" :thread-id="threadId" :thread-mode="threadMode"
							:current-buddy="currentBuddy" :message="m" @edit="refreshMessages" @delete="refreshMessages"
							@clearThread="refreshMessages" :is-loading="isLoading && i === uiMessages.length - 1"
							@generateImage="handleGenerateImage" />
					</div>
				</ScrollArea>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel :min-size="25" :max-size="60" class="min-h-[120px]">
				<form class="w-full h-[75%] flex gap-1.5 items-center justify-center mt-1">
					<RecordAudio @start="isRecording = true" @stop="(text: string) => {
						if (text) input = text;
						doSubmitOrStop();
					}" @error="isRecording = false" />
					<Textarea
						class="p-2 rounded shadow-sm text-lg resize-none flex-1 h-full min-h-0 border border-gray-300 dark:border-gray-700"
						tabindex="1" v-model="input" placeholder="Say something..." @keydown.enter="doSubmitOrStop" autofocus />
					<div class="flex flex-col items-center gap-1">
						<Button type="button" size="sm" @click="doSubmitOrStop" :disabled="!canSend || isLoading"
							:variant="isLoading ? 'destructive' : 'default'">
							<Send v-if="!isLoading" />
							<Square v-else />
						</Button>
						<Button v-if="messages.length" type="button" class="w-full" size="sm" :disabled="!canReload || isLoading"
							@click="doReload" title="Re-submit your last message to get a new response">
							<RefreshCcwDot />
						</Button>
					</div>
				</form>
				<ChatDisclaimer v-if="uiMessages.length > 2 || (uiMessages.length > 1 && !isLoading)" />
			</ResizablePanel>
		</ResizablePanelGroup>
	</div>
</template>
