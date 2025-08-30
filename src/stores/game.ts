import { defineStore } from 'pinia';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export interface Game {
	id: string;
	name: string;
	selectedBuddyId: string;
	premiseDescription: string;
	gameLog: GameLogEntry[];
	gameStarted: boolean;
	userActionInput: string;
	isLoading: boolean;
	choices?: string[];
}

export interface GameLogEntry {
	type: 'user' | 'buddy' | 'gm';
	content: string;
	choices?: string[];
}

export const useGameStore = defineStore('game', () => {
	const games = ref<Game[]>([]);
	const activeGameId = ref<string | null>(null);

	const createGame = (
		name: string,
		selectedBuddyId: string,
		premiseDescription: string
	): Game => {
		const newGame: Game = {
			id: uuidv4(),
			name,
			selectedBuddyId,
			premiseDescription,
			gameLog: [],
			gameStarted: false,
			userActionInput: '',
			isLoading: false,
		};
		games.value.push(newGame);
		return newGame;
	};

	const findGameById = (id: string) => {
		return games.value.find((game) => game.id === id);
	};

	const updateGame = (updatedGame: Game) => {
		const index = games.value.findIndex((game) => game.id === updatedGame.id);
		if (index !== -1) {
			games.value[index] = updatedGame;
		}
	};

	// TODO canReload
	const reloadLastTurn = (gameId: string): string | undefined => {
		const game = games.value.find((g) => g.id === gameId);
		if (!game) {
			console.warn(`Game with ID ${gameId} not found.`);
			return undefined;
		}

		let lastUserTurnIndex = -1;
		for (let i = game.gameLog.length - 1; i >= 0; i--) {
			if (game.gameLog[i].type === 'user') {
				lastUserTurnIndex = i;
				break;
			}
		}

		if (lastUserTurnIndex !== -1) {
			const lastUserTurnContent = game.gameLog[lastUserTurnIndex].content;
			game.gameLog.splice(lastUserTurnIndex); // Remove from last user turn onwards
			return lastUserTurnContent;
		}
		return undefined;
	};

	return {
		games,
		activeGameId,
		createGame,
		findGameById,
		updateGame,
		reloadLastTurn,
	};
});
