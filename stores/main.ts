import { defineStore } from 'pinia';
export const useAppStore = defineStore('app', () => {
	const selectedPersonaId = ref<string>('');

	return {
		selectedPersonaId,
	};
});
