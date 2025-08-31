<script setup lang="ts">
import { ref, onBeforeMount, watch } from 'vue';
import { useRoute } from 'vue-router/auto';
import router from '@/lib/router';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/stores/game';
import { api } from '@/lib/api';

const route = useRoute();
const gameStore = useGameStore();

const isGameSelected = (gameId: string) =>
	route.path.includes(`/game`) && (route.params as any).id === gameId;

const editingGameName = ref('');
const rightClickedId = ref('');

onBeforeMount(async () => {
	// Games are automatically updated via liveQuery in the store
});

const renameClicked = (gameId: string) => {
	const game = gameStore.games?.find(
		(game) => game.id === gameId
	);
	if (!game) {
		console.error(`Couldn't find game with id ${gameId} to rename`);
		editingGameName.value = '';
		return;
	}
	editingGameName.value = game.name;
};

const handleRename = async () => {
	if (!editingGameName.value || !rightClickedId.value) return;

	const gameToUpdate = gameStore.games?.find(g => g.id === rightClickedId.value);
	if (gameToUpdate) {
		const updatedGame = { ...gameToUpdate, name: editingGameName.value };
		await gameStore.updateGame(updatedGame);
	}
	editingGameName.value = '';
};

const shouldRedirect = (deletedGameId: string) => {
	return (route.params as any).id === deletedGameId;
};

const doDeleteGame = async (gameId: string) => {
	console.log('deleting game', gameId);
	await gameStore.removeGame(gameId);

	const newGames = gameStore.getGames();
	if (shouldRedirect(gameId)) {
		const newGame = newGames[0];
		if (newGame) {
			router.push(`/game/${newGame.id}`);
		} else {
			router.push(`/`);
		}
	}
};

watch(route, async () => {
	// Games are automatically updated via liveQuery in the store
});

const goToGame = async (gameId: string) => {
	await router.push(`/game/${gameId}`);
};
</script>
<template>
	<ul class="mt-1">
		<Dialog>
			<ContextMenu>
				<ContextMenuTrigger>
					<li v-for="game in gameStore.games" :key="game.id" :class="[
						'cursor-pointer',
						'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
						'rounded',
						'border-b-2',
						isGameSelected(game.id)
							? 'font-bold bg-gray-200 dark:bg-gray-800'
							: '',
					]" @contextmenu="rightClickedId = game.id">
						<div @click="goToGame(game.id)" class="p-2"> {{ game.name }} </div>
					</li>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<DialogTrigger asChild>
						<ContextMenuItem @click="renameClicked(rightClickedId)"> Rename </ContextMenuItem>
					</DialogTrigger>
					<ContextMenuItem @click="doDeleteGame(rightClickedId)"> Delete </ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Name</DialogTitle>
				</DialogHeader>
				<DialogDescription>
					<Input v-model="editingGameName" placeholder="Game name" />
				</DialogDescription>
				<DialogFooter>
					<DialogClose as-child>
						<Button @click="handleRename" type="button">Confirm</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</ul>
</template>
