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
import { genderFromName, negPromptFromName } from '@/lib/prompt/sd';
import Message from './ChatMessage.vue';
import {
	imgDescriptionFromChat,
	imgPromptFromDescription,
	shouldSendImg,
} from '@/src/lib/prompt/img/chat';
import { titleFromMessages } from '@/src/lib/prompt/chat';
import { attemptToFixJson, clone, delay } from '@/src/lib/utils';
import useElectron from '@/src/composables/useElectron';
import useChat from '@/src/composables/useChat';
import { MODEL_NAME } from '@/lib/constants';
import { complete } from '@/src/lib/ai/complete';
import useMobile from '@/src/composables/useMobile';
import { v4 } from 'uuid';
import { insert } from '@/src/lib/sql';
import { isFeatureAvailable } from '@/lib/ai/support';
import { useImgAI } from '@/src/composables/ai/useImgAI';
import RecordAudio from './RecordAudio.vue';
import ChatDisclaimer from './ChatDisclaimer.vue';
import ChatHeader from './ChatHeader.vue';
import { useTTSAI } from '@/src/composables/ai/useTTSAI';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';

const { toast } = useToast();
const { updateBuddies, updateThreads } = useAppStore();
const store = useAppStore();
const imgAI = useImgAI();
const ttsAI = useTTSAI();
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

// TODO if first time, generate first message to user

const userName = computed(() => store.settings.user_name);

const { messages, input, handleSubmit, setMessages, reload, isLoading, stop } =
	useChat({
		initialMessages: await initialMessages.value,
		body: apiPartialBody.value,
		onFinish: async () => {
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

			// begin image sending
			const assistantName =
				threadMode.value === 'persona'
					? currentBuddy.value?.name || ''
					: 'Assistant';
			const user = userName.value;

			const chatImageEnabled = store.settings.chat_image_enabled;
			let cmdObj = {} as any;
			let cmd = '';
			// if chat images are enabled, decided whether to send one
			if (chatImageEnabled) {
				cmd = (await complete(shouldSendImg(user, assistantName), {
					body: {
						max_tokens: 512,
						temperature: 0.01,
						messages: messages.value
							.slice()
							.map(
								(m) =>
								({
									role: m.role,
									content: m.content,
								} as ChatMessage)
							)
							.slice(-6),
					},
				}, true)) as string;

				try {
					cmdObj = JSON.parse(cmd);
					if (Array.isArray(cmdObj)) cmdObj = cmdObj[0];
				} catch (e) { }
				console.log('cmd', cmdObj);
			}

			let imgToSave = '';

			if (chatImageEnabled && cmdObj.do_send) {
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
				}, true);
				console.log('img description', img);
				if (img) {
					try {
						let o = JSON.parse(img);
						if (Array.isArray(o)) o = o[0];
						cmdObj.description = o.description;
					} catch (e) {
						console.log('error parsing img description', e);
						cmdObj.description = img;
					}
				}

				if (cmdObj.description && cmdObj.do_send) {
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
					}, true)) as string;
					console.log('img prompt', p);
					if (p) {
						p = JSON.parse(p);
						if (Array.isArray(p)) p = p[0];
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

						const sqlImgAdd = insert('images', { id: filename, data: imgData });
						await dbRun(sqlImgAdd[0], sqlImgAdd[1]);
						imgToSave = filename;
					}
				}
			}

			// if we're reloading, only update the last message with the assistant's response
			if (reloadingId.value) {
				await handleReloading(ttsDataToSave, imgToSave);
				return;
			}

			if (lastMessage.role === 'assistant') {
				const msg = {
					role: 'assistant',
					content: lastMessage.content.trim(),
					image: imgToSave,
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

/** Conditionally genertate chat thread title after sending first message. */
const condWriteThreadTitle = async () => {
	if (messages.value.length > 3) return; // 3 incl. system message

	// TODO sometimes the output is like { "description": "something" } which might be cut off
	// TODO use fix JSON function (is it generic? pass in options to fix?)
	//   an option like "pickFirstString" shouold work here, where an object is expected to just have one value
	//   or a separate function specifically for one-value objects (could have a "expectedKey" option)

	const [msg1, msg2, msg3] = messages.value;
	let value = await complete(titleFromMessages(msg1, msg2, msg3), {
		body: { max_tokens: 20, temperature: 0.01 },
	}, true);
	value = attemptToFixJson(value);

	if (value) {
		try {
			const data = JSON.parse(value);
			value = data.title;
		} catch (e) { }
		if (value.startsWith('Title: ')) value = value.slice(7);
		value = value.trim();
		if (value[0] === '"' && value[value.length - 1] === '"') {
			value = value.slice(1, -1);
		}
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
const thread = ref({} as ChatThread);
const threadMode = ref('custom' as 'custom' | 'persona');

const buddyModeUseCurrent = ref(false);

const selectedBuddyId = ref(thread.value?.persona_id || '');
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
const currentBuddy = computed(() =>
	buddies.value.find((p) => p.id === selectedBuddyId.value) as BuddyVersionMerged
);
watch(selectedBuddyId, handleBuddyChange);

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
selectedBuddyId.value = t?.persona_id || '';
await refreshMessages();

const canSend = computed(() => {
	if (!isFeatureAvailable('chat')) return false;
	return !!input.value && !!isRecording.value;
});

const canReload = computed(() => {
	if (!isFeatureAvailable('chat')) return false;
	return messages.value.length >= 2 && !isLoading.value && !isRecording.value;
});

// note/idea:
// for Assistant threads, have option for the AI to be like an assistant for this app
//   - can contextually link to areas in the app
//   - allow updating settings
//     would it be lazy? sure, but i think it would be cool & possibly helpful
//     maybe we could figure out nice UI to just pull this out as a component (called something like AppAssistantChat)
//   this idea is akin to the Setup Chat idea i started on before
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
							@clearThread="refreshMessages" :is-loading="isLoading && i === uiMessages.length - 1" />
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
						<Button type="button" size="sm" @click="doSubmitOrStop" :disabled="!canSend && !isLoading"
							:variant="isLoading ? 'destructive' : 'default'">
							<Send v-if="!isLoading" />
							<Square v-else />
						</Button>
						<Button v-if="messages.length" type="button" class="w-full" size="sm" :disabled="!canReload"
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
