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
		verify: 'User should provide their name.',
		fail:
			'User did not provide their name when prompted. Assistant should continue to prompt the user to provide their name.',
	},
];

function createSystemPrompt(
	s: number,
	t: 'instruct' | 'verify' | 'fail' = 'instruct',
	input?: string
) {
	const instructPreamble =
		'The following is a chat between user and assistant. Assistant is the introductory AI Assistant in the BuddyGenAI app.';
	const verifyPreamble = `The following is a description of a user's message and the message itself. The assistant's task is to verify whether the provided message meets the description. Respond with a JSON object containing the key "valid" and a boolean value.`;
	const pair = systemMessages[s];

	if (t === 'instruct' || t === 'fail') {
		return instructPreamble + ' ' + pair[t].trim();
	} else {
		return `${verifyPreamble}
Description: ${pair.verify.trim()}

Input: ${input}`;
	}
}

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
		// update the first/system message depending on the stage
		// const isFirstRound = messages.value.length === 3;
		// if (isFirstRound) {
		// 	const lastMessage = messages.value[messages.value.length - 2]; // should be user
		// }
	},
});

const doSubmit = async (e: any) => {
	// validate input
	if (!input.value) return;

	const verifyPrompt = createSystemPrompt(stage, 'verify', input.value);
	const response = await complete(verifyPrompt);

	if (!response) {
		toast({
			variant: 'destructive',
			title: 'Error validating message',
			description: 'Unexpected error occurred. Please try again.',
		});
		return;
	}

	const result = JSON.parse(response);
	if (!result.valid) {
		toast({
			variant: 'destructive',
			title: 'Invalid message',
			description: 'Please provide a valid name',
		});
		return;
	}

	console.log('response', response);

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
			>
				Send
			</Button>
		</div>
	</div>
</template>
