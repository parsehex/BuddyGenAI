<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router/auto';
import { useAppStore } from '@/stores/main';
import { useGameStore, type Game } from '@/stores/game';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatAI } from '@/composables/ai/useChatAI';
import { generateGmTurnPrompt, generateBuddyTurnPrompt } from '@/lib/prompt/game';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { useLogger } from '@/src/composables/useLogger';
import BuddyAvatar from '@/src/components/BuddyAvatar.vue';
import { attemptToFixJson } from '@/src/lib/utils';

const log = useLogger('pages/game');
const appStore = useAppStore();
const gameStore = useGameStore();
const route = useRoute();
const { chat } = useChatAI();

const gameId = computed(() => (route.params as any).id as string);
const currentGame = ref<Game | undefined>(undefined);

watch(gameId, (newGameId) => {
	if (newGameId) {
		currentGame.value = gameStore.findGameById(newGameId);
		if (currentGame.value) {
			gameStore.activeGameId = newGameId;
		}
	} else {
		currentGame.value = undefined;
		gameStore.activeGameId = null;
	}
}, { immediate: true });

const userActionInput = ref('');


const lastGmChoices = computed<string[] | undefined>(() => {
	const lastGmEntry = currentGame.value?.gameLog.findLast((entry) => entry.type === 'gm');
	return lastGmEntry?.choices;
});

const selectChoice = (choice: string) => {
	userActionInput.value = choice;
	takeTurn();
};

const selectedBuddy = computed<BuddyVersionMerged | undefined>(() => {
	if (!currentGame.value) return undefined;
	return appStore.buddies.find(buddy => buddy.id === currentGame.value?.selectedBuddyId);
});

function scrollToBottom() {
	nextTick(() => {
		const viewport = document.body.querySelector('div#scrollArea div[data-reka-scroll-area-viewport]') as HTMLDivElement | null;
		console.log(viewport);
		if (!viewport) return;
		const top = viewport.scrollHeight
		viewport.scrollTo({
			top,
			behavior: 'smooth'
		});
	})
}

const takeTurn = async () => {
	if (!currentGame.value || !selectedBuddy.value || !selectedBuddy.value.description) {
		log.error('takeTurn: No current game or selected buddy description.');
		return;
	}
	if (!userActionInput.value.trim()) return;

	const game = currentGame.value;
	const action = userActionInput.value;

	game.gameLog.push({ type: 'user', content: action });
	userActionInput.value = '';
	game.isLoading = true;
	scrollToBottom();

	// GM turn after user action
	const gmTurnPrompt = generateGmTurnPrompt(
		appStore.settings.user_name,
		selectedBuddy.value.name,
		selectedBuddy.value.description,
		game.gameLog,
		action
	);

	const gmResponse = await chat({
		messages: gmTurnPrompt,
		max_tokens: 500,
		json: true,
	});
	log.log({ _: { messages: gmTurnPrompt, action, gmResponse } }, 'After user action - generate buddy turn')

	let gmNarrative = '';
	let gmChoices: string[] | undefined;
	if (gmResponse) {
		try {
			const parsedGmResponse = JSON.parse(attemptToFixJson(gmResponse));
			gmNarrative = parsedGmResponse.narrative || gmResponse;
			gmChoices = parsedGmResponse.choices || undefined;
		} catch (e) {
			log.error('Failed to parse GM response as JSON:', e);
			gmNarrative = gmResponse;
		}
		game.gameLog.push({ type: 'gm', content: gmNarrative, choices: gmChoices });
	} else {
		game.gameLog.push({ type: 'gm', content: '(Failed to generate response)' });
	}
	scrollToBottom();

	// Buddy turn
	const buddyTurnPrompt = generateBuddyTurnPrompt(
		appStore.settings.user_name,
		selectedBuddy.value.name,
		selectedBuddy.value.description,
		game.gameLog,
		gmNarrative
	);

	const buddyResponse = await chat({
		messages: buddyTurnPrompt,
		max_tokens: 500,
	});
	log.log({ _: { messages: buddyTurnPrompt, gmNarrative, buddyResponse } }, 'Get buddy response')

	let buddyAction = '';
	if (buddyResponse) {
		buddyAction = buddyResponse;
		game.gameLog.push({ type: 'buddy', content: buddyResponse });
	} else {
		game.gameLog.push({ type: 'buddy', content: '(Failed to generate response)' });
	}
	scrollToBottom();

	// GM turn after buddy action
	const gmTurnPromptAfterBuddy = generateGmTurnPrompt(
		appStore.settings.user_name,
		selectedBuddy.value.name,
		selectedBuddy.value.description,
		game.gameLog,
		buddyAction
	);

	const gmResponseAfterBuddy = await chat({
		messages: gmTurnPromptAfterBuddy,
		max_tokens: 500,
		json: true,
	});
	log.log({ _: { messages: gmTurnPromptAfterBuddy, buddyAction } }, 'Get next turn')

	let gmChoicesAfterBuddy: string[] | undefined;
	if (gmResponseAfterBuddy) {
		let gmNarrativeAfterBuddy = '';
		try {
			const parsedGmResponse = JSON.parse(attemptToFixJson(gmResponseAfterBuddy));
			gmNarrativeAfterBuddy = parsedGmResponse.narrative || gmResponseAfterBuddy;
			gmChoicesAfterBuddy = parsedGmResponse.choices || undefined;
		} catch (e) {
			log.error('Failed to parse GM response after buddy as JSON:', e);
			gmNarrativeAfterBuddy = gmResponseAfterBuddy;
		}
		game.gameLog.push({ type: 'gm', content: gmNarrativeAfterBuddy, choices: gmChoicesAfterBuddy });
	} else {
		game.gameLog.push({ type: 'gm', content: '(Failed to generate response after buddy)' });
	}

	game.isLoading = false;
	gameStore.updateGame(game);
	scrollToBottom();
};

// TODO need to:
// - setup sidebar (games list) component
//   - component is basically what we have on this page - the game stuff
//   - can see active game & make new one
// - the game page might as well be this page (rename/move to make use of id param)
//   selectedBuddy will definitely be defined in this design
// ideas
// - allow text or microphone input to describe your action
//     what's a good max for either? 50 chars / 10s ?
// 50ch = _123456789_123456789_123456789_123456789_123456789
// TODO implement :max-seconds in RecordAudio.vue
//
//
// game plays like a text adventure that you can play with an llm
// with some modifications to fit it for our model
//   system message has instructions how the response should be made
//     1) when generating a turn, we make a narrative description + choices
//     2) when getting buddy's turn, we instruct to roleplay as the buddy and react to a turn + make a choice / custom action -> use result to run #1
//
// when generating, we'll want to check how many tokens we're using
// if we're using too many tokens, summarize some # of middle turns to compress


// after trying a new version, here are some thoughts:
// - for the lines "{name} action: {x}" I feel like we should do what we can to make the line look more natural
// - we'll want to set a TTS voice for narration
// - should show buddy avatar somewhere
// - rather than getting these full-inline responses, use & prompt for json mode
// - obviously need to break out and show choices as buttons
// - i'd like to start using useLogger for this too

// later note:
// we'll want to generate an image for game turns, but don't want to hold up gameplay for it, so
//   - I want to allow going to a next turn without the image being done generating
//   - this means we'll need a queue of images to generate
//   - we'll want UI that's friendly to this async style when considering how to view past history
</script>
<template>
	<div class="p-2">
		<Card v-if="!currentGame">
			<CardContent class="text-center text-gray-500 dark:text-gray-400"> Game not found. Please select a game from the
				sidebar or start a new one. </CardContent>
		</Card>
		<Card v-else-if="!currentGame.gameStarted" class="space-y-4 p-4">
			<CardHeader>
				<h2 class="text-xl font-semibold">Game Not Started</h2>
			</CardHeader>
			<CardContent>
				<p>This game has not been started yet. Please start it from the sidebar.</p>
			</CardContent>
		</Card>
		<Card v-else-if="selectedBuddy" class="flex flex-col h-[calc(100vh-1rem)]">
			<CardHeader class="flex flex-row items-center space-x-4 pb-0">
				<BuddyAvatar :buddy="selectedBuddy" />
				<h2 class="text-xl font-semibold">{{ currentGame.name }}</h2>
			</CardHeader>
			<CardContent class="flex-1 overflow-hidden p-0">
				<ScrollArea class="h-full p-4" id="scrollArea">
					<div v-for="(entry, index) in currentGame.gameLog" :key="index"
						:class="{ 'my-2': true, 'text-right': entry.type === 'user', 'text-left': entry.type !== 'user' }">
						<div class="inline-block p-3 rounded-lg max-w-[70%] break-words" :class="{
							'bg-blue-500 text-white': entry.type === 'user',
							'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100': entry.type === 'gm',
							'bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100': entry.type === 'buddy'
						}">
							<span v-if="entry.type === 'user'" class="font-semibold">{{ appStore.settings.user_name }}: </span>
							<span v-else-if="entry.type === 'buddy'" class="font-semibold">{{ selectedBuddy?.name }}: </span>
							<span v-html="entry.content"></span>
						</div>
					</div>
				</ScrollArea>
			</CardContent>
			<CardFooter class="p-4 border-t">
				<div class="flex flex-col w-full space-y-2">
					<div v-if="lastGmChoices && lastGmChoices.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-2">
						<Button v-for="(choice, index) in lastGmChoices" :key="index" @click="selectChoice(choice)"
							:disabled="currentGame.isLoading" class="w-full justify-start"> {{ String.fromCharCode(65 + index) }}. {{
								choice }} </Button>
					</div>
					<div class="flex w-full items-center space-x-2">
						<Textarea id="user-action" v-model="userActionInput" placeholder="What do you do next?"
							@keyup.enter.prevent="takeTurn" :disabled="currentGame.isLoading" class="flex-1" />
						<Button @click="takeTurn" :disabled="currentGame.isLoading || !userActionInput.trim()">
							<span v-if="currentGame.isLoading">Loading...</span>
							<span v-else>Go</span>
						</Button>
					</div>
				</div>
			</CardFooter>
		</Card>
	</div>
</template>
