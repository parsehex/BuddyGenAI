<script setup lang="ts">
import { useChat, useCompletion } from 'ai/vue';
import urls from '@/lib/api/urls';
import { delay } from '@/lib/utils';
import GenericChatMessage from './GenericChatMessage.vue';
import { useToast } from './ui/toast';

const { toast } = useToast();
const { complete } = useCompletion({ api: urls.message.completion() });

let stage = 0;
let failed = false;

const systemMessages = [
	{
		instruct:
			'Assistant should introduce the user to the app and get their name.',
		verify: 'Input is a name',
		fail:
			'User did not provide their name when prompted. Assistant should continue to prompt the user to provide their name.',
	},
	{
		instruct:
			"Assistant should greet the user and tell them that they are going to make a buddy that they can talk to. Then, Assistant should ask for their buddy's name.",
		verify: 'Input is name-like',
		fail:
			"User did not provide their buddy's name when prompted. Assistant should continue to prompt the user to provide their buddy's name.",
	},
	{
		instruct: 'Assistant should ask the user what their buddy is like.',
		verify: '',
		fail:
			'User did not describe their buddy when prompted. Assistant should continue to prompt the user to describe their buddy.',
	},
];

function createSystemPrompt(
	s: number,
	t: 'instruct' | 'verify' | 'fail' = 'instruct',
	input?: string
) {
	const instructPreamble =
		'The following is a chat between user and assistant. Assistant is the introductory AI Assistant in the BuddyGenAI app.';
	const verifyPreamble = `The following is a description and an input. Assistant's task is to verify whether the input meets the description. Respond with a JSON object containing the keys "reasoning" with a string value and "valid" with a boolean value.`;
	const pair = systemMessages[s];

	if (t === 'instruct' || t === 'fail') {
		return instructPreamble + ' ' + pair[t].trim();
	} else {
		return `${verifyPreamble}

Valid Description: ${pair.verify.trim()}
Input: ${input}`;
	}
}

const validating = ref(false);

const {
	messages,
	input,
	handleSubmit,
	append,
	setMessages,
	reload,
	isLoading,
	stop,
} = useChat({
	api: urls.message.create(),
	body: {
		temperature: 0.25,
	},
	onFinish: async (response) => {
		const hasUserMessage = messages.value.some((m: any) => m.role === 'user');
		if (hasUserMessage) {
			stage++;
		}
		if (stage < systemMessages.length) {
			// set the system prompt for the next stage
			console.log(messages.value.slice());
			// const firstMessage = JSON.parse(JSON.stringify(messages.value.slice()[0]));
			// const nextPrompt = createSystemPrompt(stage);
			// firstMessage.content = nextPrompt;
			// const newMessages = [firstMessage, ...messages.value.slice(1)];
			// setMessages(newMessages);
		}
	},
});

// validate input with the llm
const doSubmit = async (e: any) => {
	if (!input.value) return;

	// TODO how can we pre-ingest the the prompt to improve latency?
	// (check llamafile /completion doc)
	validating.value = true;
	const verifyPrompt = createSystemPrompt(stage, 'verify', input.value);
	const response = await complete(verifyPrompt, {
		body: {
			temperature: 0.05,
		},
	});
	validating.value = false;

	if (!response) {
		console.log('prompt', verifyPrompt);
		console.log(response);
		toast({
			variant: 'destructive',
			title: 'Error validating message',
			description: 'Unexpected error occurred. Please try again.',
		});
		return;
	}

	const result = JSON.parse(response);
	if (!result.valid) {
		console.log('prompt', verifyPrompt);
		console.log(response);
		toast({
			variant: 'destructive',
			title: 'Invalid message',
			description: 'Please provide a valid name',
		});
		return;
	}

	const firstMessage = JSON.parse(JSON.stringify(messages.value.slice()[0]));
	const nextPrompt = createSystemPrompt(stage + 1);
	console.log('nextPrompt', nextPrompt);
	firstMessage.content = nextPrompt;
	const newMessages = [firstMessage, ...messages.value.slice(1)];
	setMessages(newMessages);

	await delay(50);

	// actually set the user's name

	console.log('response', response);

	console.log(messages.value.slice()[0].content);

	handleSubmit(e);
};

const uiMessages = computed(() => {
	// only non-system messages
	return messages.value.filter((m) => m.role !== 'system');
});

onMounted(async () => {
	await delay(250);
	append({
		id: '1',
		role: 'system',
		content: createSystemPrompt(stage),
	});
});
</script>

<template>
	<!-- simple chat interface -->
	<div class="flex flex-col h-full">
		<div class="flex-1 overflow-y-auto">
			<GenericChatMessage
				v-for="message in uiMessages"
				:key="message.id"
				:authorName="message.role === 'user' ? 'You' : 'AI Assistant'"
				:message="message"
			/>
		</div>
		<div class="flex items-center gap-2 mt-2">
			<Input
				v-model="input"
				placeholder="Type a message..."
				@keydown.enter="doSubmit"
			/>
			<Button
				@click="handleSubmit"
				class="bg-blue-500 text-white px-4 py-2 rounded-md"
				:disabled="validating"
			>
				Send
			</Button>
		</div>
	</div>
</template>
