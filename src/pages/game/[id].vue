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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useChatAI } from '@/composables/ai/useChatAI';
import { generateGmIntroPrompt, generateGmTurnPrompt, generateBuddyTurnPrompt } from '@/lib/prompt/game';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { useLogger } from '@/src/composables/useLogger';
import BuddyAvatar from '@/src/components/BuddyAvatar.vue';
import Spinner from '@/src/components/Spinner.vue';
import { attemptToFixJson, textToHslColor } from '@/src/lib/utils';
import { Input } from '@/src/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { RefreshCcwDot, Send } from 'lucide-vue-next';

const log = useLogger('pages/game');
const appStore = useAppStore();
const gameStore = useGameStore();
const route = useRoute();
const { chat } = useChatAI();

const reloadLastTurnAction = () => {
	if (!currentGame.value) return;
	const lastUserTurnContent = gameStore.reloadLastTurn(currentGame.value.id);
	if (lastUserTurnContent) {
		userActionInput.value = lastUserTurnContent;
		takeTurn();
	}
};

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

watch(currentGame, async (newGame) => {
	try {
		if (!generateFirstTurn) return; // potential access before init
	} catch (e) { }
	if (newGame && !newGame.gameStarted && !newGame.isLoading) {
		await generateFirstTurn(newGame);
	}
}, { immediate: true });

const selectedBuddy = computed<BuddyVersionMerged | undefined>(() => {
	if (!currentGame.value) return undefined;
	return appStore.buddies.find(buddy => buddy.id === currentGame.value?.selectedBuddyId);
});
const userName = computed(() => {
	return appStore.settings.user_name;
});
const userInitials = computed(() => {
	return userName.value[0];
});

const userActionInput = ref('');
const loadingStatus = ref('');
const showChoices = ref(true);

const lastGmChoices = computed<string[] | undefined>(() => {
	const lastGmEntry = currentGame.value?.gameLog.findLast((entry) => entry.type === 'gm');
	return lastGmEntry?.choices;
});

const selectChoice = (choice: string) => {
	userActionInput.value = choice;
	takeTurn();
};

function scrollToBottom() {
	nextTick(() => {
		const viewport = document.body.querySelector('div#scrollArea div[data-reka-scroll-area-viewport]') as HTMLDivElement | null;
		if (!viewport) return;
		viewport.scrollTo({
			top: viewport.scrollHeight,
			behavior: 'smooth',
		});
	})
}

const generateFirstTurn = async (game: Game) => {
	if (!selectedBuddy.value || !selectedBuddy.value.description || !game.premiseDescription) {
		log.error('generateFirstTurn: Missing selected buddy, description, or premise.');
		return;
	}

	game.isLoading = true;
	loadingStatus.value = 'Loading first turn...';
	gameStore.updateGame(game); // Update to show loading state

	game.gameLog.push({
		type: 'gm',
		content: `Game started with ${selectedBuddy.value.name} and premise: "${game.premiseDescription}"`,
	});

	const gmIntroPrompt = generateGmIntroPrompt(
		appStore.settings.user_name,
		selectedBuddy.value.name,
		selectedBuddy.value.description,
		game.premiseDescription
	);

	const gmResponse = await chat({
		messages: gmIntroPrompt,
		max_tokens: 500,
	});
	log.log({ _: { messages: gmIntroPrompt, premise: game.premiseDescription, gmResponse } }, 'Creating game')

	let gmNarrative = '';
	let gmChoices: string[] | undefined;
	if (gmResponse) {
		try {
			const parsedGmResponse = JSON.parse(attemptToFixJson(gmResponse));
			gmNarrative = parsedGmResponse.narrative || gmResponse;
			gmChoices = parsedGmResponse.choices || undefined;
		} catch (e) {
			log.error('Failed to parse GM response as JSON:', e, gmResponse);
			gmNarrative = gmResponse;
		}
		game.gameLog.push({ type: 'gm', content: gmNarrative, choices: gmChoices });
	} else {
		game.gameLog.push({ type: 'gm', content: '(Failed to generate response)' });
	}
	game.gameStarted = true;
	game.isLoading = false;
	loadingStatus.value = '';
	gameStore.updateGame(game); // Update the game in the store
	scrollToBottom();
};

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
	loadingStatus.value = `${selectedBuddy.value.name} is thinking...`;
	scrollToBottom();

	// Buddy turn
	const buddyTurnPrompt = generateBuddyTurnPrompt(
		appStore.settings.user_name,
		selectedBuddy.value.name,
		selectedBuddy.value.description,
		game.gameLog
	);

	const buddyResponse = await chat({
		messages: buddyTurnPrompt,
		max_tokens: 500,
	});
	log.log({ _: { messages: buddyTurnPrompt, action, buddyResponse } }, 'After user action - generate buddy turn')

	let buddyAction = '';
	if (buddyResponse) {
		buddyAction = buddyResponse.replace(selectedBuddy.value.name + ':', '').trim();
		game.gameLog.push({ type: 'buddy', content: buddyResponse });
	} else {
		game.gameLog.push({ type: 'buddy', content: '(Failed to generate response)' });
	}
	loadingStatus.value = 'Loading next turn...';
	scrollToBottom();

	// GM turn after buddy action
	const gmTurnPrompt = generateGmTurnPrompt(
		appStore.settings.user_name,
		selectedBuddy.value.name,
		selectedBuddy.value.description,
		game.gameLog
	);

	const gmResponse = await chat({
		messages: gmTurnPrompt,
		max_tokens: 500,
		json: true,
	});
	log.log({ _: { messages: gmTurnPrompt, buddyAction, gmResponse } }, 'Get next turn')

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

	game.isLoading = false;
	loadingStatus.value = '';
	gameStore.updateGame(game);
	scrollToBottom();
};

// TODO need to:
// ideas
// - allow text or microphone input to describe your action
//     what's a good max for either? 50 chars / 10s ?
// 50ch = _123456789_123456789_123456789_123456789_123456789
// TODO implement :max-seconds in RecordAudio.vue
//
// when generating, we'll want to check how many tokens we're using
// if we're using too many tokens, summarize some # of middle turns to compress


// after trying a new version, here are some thoughts:
// - we'll want to set a TTS voice for narration
// - use (& prompt for) json mode

// later note:
// we'll want to generate an image for game turns, but don't want to hold up gameplay for it, so
//   - I want to allow going to a next turn without the image being done generating
//   - this means we'll need a queue of images to generate
//   - we'll want UI that's friendly to this async style when considering how to view past history
//   - same for tts i guess

// new notes:
// - how about we change up the pacing:
//     instead of: user choice/action -> gm -> buddy action -> gm -> loop
//     do: user choice/action -> buddy action -> gm -> loop
//       buddy doesn't need to pick from choices + it can react to the same thing user did

// new take:
// what if the user and buddy can chat back and forth multiple times with each other (e.g. to decide on a plan) before the GM makes a turn
// i think we'd want to move to a model of having flags whether the user and the buddy have each chosen actions
//   gm doesn't run until both === true
// we wouldn't pass messages to the gm
// likely summarize blocks of consecutive or long messages to feed back as context (UI still shows full though)
</script>
<template>
	<div class="p-2">
		<Card v-if="!currentGame">
			<CardContent class="text-center text-gray-500 dark:text-gray-400"> Game not found. Please select a game from the
				sidebar or start a new one. </CardContent>
		</Card>
		<Card v-else-if="selectedBuddy" class="flex flex-col h-[calc(100vh-1rem)]">
			<CardHeader class="flex flex-row items-center space-x-4 pb-0">
				<BuddyAvatar :buddy="selectedBuddy" />
				<h2 class="text-xl font-semibold">{{ currentGame.name }}</h2>
			</CardHeader>
			<CardContent class="flex-1 overflow-hidden p-0">
				<ScrollArea class="h-full p-2 pb-0" id="scrollArea">
					<div v-for="(entry, index) in currentGame.gameLog" :key="index"
						:class="{ 'my-2': true, 'text-right': entry.type !== 'gm', 'text-left': entry.type === 'gm' }">
						<div class="inline-flex items-center p-3 rounded-lg max-w-[70%] break-words" :class="{
							'bg-blue-500 text-white': entry.type === 'user',
							'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100': entry.type === 'gm',
							'bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100': entry.type === 'buddy'
						}">
							<BuddyAvatar v-if="entry.type === 'buddy'" :buddy="selectedBuddy" />
							<Avatar v-if="entry.type === 'user'" class="text-md font-bold mr-2" :style="{
								backgroundColor: textToHslColor(userName, 60, 80),
							}">
								<AvatarImage v-if="appStore.settings.user_image" :src="appStore.settings.user_image" />
								<AvatarFallback v-else>{{ userInitials }}</AvatarFallback>
							</Avatar>
							<span :class="{ 'ml-2': entry.type !== 'gm' }" v-html="entry.content"></span>
						</div>
					</div>
				</ScrollArea>
			</CardContent>
			<CardFooter class="p-4 border-t relative">
				<div v-if="currentGame.isLoading"
					class="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm z-10">
					<Spinner />
					<span>{{ loadingStatus }}</span>
				</div>
				<div class="flex flex-col w-full space-y-2"
					:class="{ 'opacity-50 pointer-events-none': currentGame.isLoading }">
					<Collapsible v-if="lastGmChoices && lastGmChoices.length > 0" v-model:open="showChoices">
						<CollapsibleContent>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
								<Button v-for="(choice, index) in lastGmChoices" :key="index" @click="selectChoice(choice)"
									:disabled="currentGame.isLoading" class="w-full whitespace-break-spaces text-left justify-start"> {{
										String.fromCharCode(65 + index) }}. {{ choice }} </Button>
							</div>
						</CollapsibleContent>
						<CollapsibleTrigger as-child>
							<Button variant="outline" class="w-full h-8 text-sm"> {{ showChoices ? 'Hide' : 'Show' }} Choices
							</Button>
						</CollapsibleTrigger>
					</Collapsible>
					<div class="flex w-full items-center space-x-2">
						<Input id="user-action" v-model="userActionInput" placeholder="What do you do next?"
							@keyup.enter.prevent="takeTurn" :disabled="currentGame.isLoading" class="flex-1" />
						<div class="flex flex-col text-center justify-center">
							<Button @click="takeTurn" :disabled="currentGame.isLoading || !userActionInput.trim()">
								<Send />
							</Button>
							<Button @click="reloadLastTurnAction" :disabled="currentGame.isLoading" variant="outline">
								<RefreshCcwDot />
							</Button>
						</div>
					</div>
				</div>
			</CardFooter>
		</Card>
	</div>
</template>
