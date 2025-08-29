<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '@/stores/main';
import { useGameStore } from '@/stores/game';
import BuddySelect from '@/components/BuddySelect.vue';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useRouter } from 'vue-router/auto';
import { useChatAI } from '@/composables/ai/useChatAI';
import { generateGmIntroPrompt } from '@/lib/prompt/game';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { useLogger } from '@/src/composables/useLogger';
import { attemptToFixJson } from '@/src/lib/utils';

const log = useLogger('sidebar/GameCreationForm');
const appStore = useAppStore();
const gameStore = useGameStore();
const router = useRouter();
const { chat } = useChatAI();

const selectedBuddyId = ref('');
const premiseDescription = ref('');
const isLoading = ref(false);

const selectedBuddy = computed<BuddyVersionMerged | undefined>(() => {
	return appStore.buddies.find(buddy => buddy.id === selectedBuddyId.value);
});

const startGame = async () => {
	if (!selectedBuddy.value || !premiseDescription.value) {
		alert('Please select a buddy and provide a premise description.');
		return;
	}

	isLoading.value = true;

	const newGame = gameStore.createGame(
		`Game with ${selectedBuddy.value.name}`,
		selectedBuddyId.value,
		premiseDescription.value
	);

	gameStore.activeGameId = newGame.id;

	if (!selectedBuddy.value || !selectedBuddy.value.description) return;
	newGame.gameLog.push({
		type: 'gm',
		content: `Game started with ${selectedBuddy.value.name} and premise: "${premiseDescription.value}"`,
	});

	const gmIntroPrompt = generateGmIntroPrompt(
		appStore.settings.user_name,
		selectedBuddy.value.name,
		selectedBuddy.value.description,
		premiseDescription.value
	);

	log.log({ _: { messages: gmIntroPrompt, premise: premiseDescription.value } }, 'Creating game')
	const gmResponse = await chat({
		messages: gmIntroPrompt,
		max_tokens: 500,
	});

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
		newGame.gameLog.push({ type: 'gm', content: gmNarrative, choices: gmChoices });
	} else {
		newGame.gameLog.push({ type: 'gm', content: '(Failed to generate response)' });
	}
	newGame.gameStarted = true;
	gameStore.updateGame(newGame); // Update the game in the store

	isLoading.value = false;
	router.push(`/game/${newGame.id}`);
};
</script>
<template>
	<div class="p-4 space-y-4">
		<h2 class="text-xl font-semibold">Start a New Game</h2>
		<div>
			<label for="buddy-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a
				Buddy</label>
			<BuddySelect id="buddy-select" @select="(id: string) => selectedBuddyId = id" :include-ai="false"
				:label="false" />
		</div>
		<div>
			<label for="premise-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Premise
				Description</label>
			<Textarea id="premise-description" v-model="premiseDescription"
				placeholder="Describe the game's starting scenario..." />
		</div>
		<Button @click="startGame" :disabled="isLoading">
			<span v-if="isLoading">Starting Game...</span>
			<span v-else>Start Game</span>
		</Button>
	</div>
</template>
