import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { liveQuery } from 'dexie';
import { useObservable } from '@vueuse/rxjs';
import { db, type Game, type GameLogEntry } from '@/lib/db/schema';
import { clone } from '../lib/utils';

export { type Game, type GameLogEntry };

export const useGameStore = defineStore('game', () => {
	const games = useObservable<Game[]>(
		// @ts-ignore
		liveQuery(async () => await db.game.toArray())
	);
	const activeGameId = ref<string | null>(null);

	// Runtime state for the active game
	const runtimeGame = ref<Game | undefined>(undefined);
	const runtimeGameLog = ref<GameLogEntry[]>([]);
	const userActionInput = ref('');
	const isLoading = ref(false);
	const choices = ref<string[] | undefined>(undefined);

	const createGame = async (
		name: string,
		selectedBuddyId: string,
		premiseDescription: string
	): Promise<Game> => {
		const newGame: Game = {
			id: uuidv4(),
			created: new Date(),
			name,
			selected_buddy_id: selectedBuddyId,
			premise_description: premiseDescription,
			game_started: false,
		};
		await db.game.add(newGame);
		games.value?.push(newGame);
		return newGame;
	};

	const findGameById = async (id: string) => {
		const game = await db.game.get(id);
		if (game) {
			runtimeGame.value = game;
			runtimeGameLog.value = await db.game_log_entry
				.where('game_id')
				.equals(id)
				.sortBy('entry_index');
		} else {
			runtimeGame.value = undefined;
			runtimeGameLog.value = [];
		}
		return runtimeGame.value;
	};

	const updateGame = async (updatedGame: Game) => {
		updatedGame = clone(updatedGame);
		await db.game.put(updatedGame);
		const index = games.value?.findIndex((game) => game.id === updatedGame.id);
		if (games.value && index && index > -1) {
			games.value[index] = updatedGame;
		}
		if (runtimeGame.value?.id === updatedGame.id) {
			runtimeGame.value = updatedGame;
		}
	};

	const addGameLogEntry = async (
		entry: Omit<GameLogEntry, 'id' | 'created' | 'entry_index' | 'game_id'>
	) => {
		if (!runtimeGame.value) return;

		const newEntry: GameLogEntry = {
			id: uuidv4(),
			game_id: runtimeGame.value.id,
			entry_index: runtimeGameLog.value.length,
			created: new Date(),
			...entry,
		};
		await db.game_log_entry.add(newEntry);
		runtimeGameLog.value.push(newEntry);
	};

	const updateGameLogEntry = async (
		index: number,
		newContent: string,
		newTts?: string
	) => {
		if (!runtimeGame.value || index >= runtimeGameLog.value.length) return;

		const entryToUpdate = clone(runtimeGameLog.value[index]) as any;
		entryToUpdate.content = newContent;
		if (newTts) {
			const response = await fetch(newTts);
			const audioBlob = await response.blob();
			entryToUpdate.tts = audioBlob;
		}
		await db.game_log_entry.put(entryToUpdate);
	};

	const reloadLastTurn = async (gameId: string): Promise<string | undefined> => {
		const game = await db.game.get(gameId);
		if (!game) {
			console.warn(`Game with ID ${gameId} not found.`);
			return undefined;
		}

		let lastUserTurnIndex = -1;
		for (let i = runtimeGameLog.value.length - 1; i >= 0; i--) {
			if (runtimeGameLog.value[i].type === 'user') {
				lastUserTurnIndex = i;
				break;
			}
		}

		if (lastUserTurnIndex !== -1) {
			const lastUserTurnContent = runtimeGameLog.value[lastUserTurnIndex].content;
			const entriesToRemove = runtimeGameLog.value.slice(lastUserTurnIndex);
			await db.game_log_entry.bulkDelete(entriesToRemove.map((e) => e.id));
			runtimeGameLog.value.splice(lastUserTurnIndex);
			return lastUserTurnContent;
		}
		return undefined;
	};

	return {
		games,
		activeGameId,
		runtimeGame,
		runtimeGameLog,
		userActionInput,
		isLoading,
		choices,
		createGame,
		findGameById,
		updateGame,
		addGameLogEntry,
		updateGameLogEntry,
		reloadLastTurn,
	};
});
