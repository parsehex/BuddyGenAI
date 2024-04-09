import { defineStore } from 'pinia';
export const useAppStore = defineStore('app', () => {
	const selectedThreadId = ref<string>('');

	return {
		selectedThreadId,
	};
});
