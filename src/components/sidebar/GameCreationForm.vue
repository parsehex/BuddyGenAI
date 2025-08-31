<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '@/stores/main';
import { useGameStore } from '@/stores/game';
import BuddySelect from '@/components/BuddySelect.vue';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useRouter } from 'vue-router/auto';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { useLogger } from '@/src/composables/useLogger';

const log = useLogger('sidebar/GameCreationForm');
const appStore = useAppStore();
const gameStore = useGameStore();
const router = useRouter();

const selectedBuddyId = ref('');
const premiseDescription = ref('');

const truncatedPremise = computed(() => {
	const maxLength = 50;
	if (premiseDescription.value.length > maxLength) {
		return premiseDescription.value.substring(0, maxLength) + '...';
	}
	return premiseDescription.value;
});

const selectedBuddy = computed<BuddyVersionMerged | undefined>(() => {
	return appStore.buddies.find(buddy => buddy.id === selectedBuddyId.value);
});

const startGame = async () => {
	if (!selectedBuddy.value || !premiseDescription.value) {
		alert('Please select a buddy and provide a premise description.');
		return;
	}

	const newGame = await gameStore.createGame(
		`${selectedBuddy.value.name} / ${truncatedPremise.value}`,
		selectedBuddyId.value,
		premiseDescription.value
	);

	gameStore.activeGameId = newGame.id;
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
		<Button @click="startGame">
			<span>Start Game</span>
		</Button>
	</div>
</template>
