import { useAppStore } from '@/src/stores/main';

const other = {
	koboldUrl: (subPath?: string) => {
		const store = useAppStore();
		let p = store.settings.koboldcpp_host || '';
		if (!p) return '';
		if (subPath) {
			subPath = subPath.trim();
			if (subPath[0] !== '/') subPath = '/' + subPath;
			p += subPath;
		}
		return p;
	},
	/** Returns different endpoints depending on settings. */
	llamacppServerUrl: async () => {
		const store = useAppStore();
		switch (store.settings.selected_provider_chat) {
			case 'openrouter':
				return 'https://openrouter.ai/api/v1/chat/completions';
			case 'koboldcpp':
				return store.settings.koboldcpp_host + '/v1/chat/completions';
			case '0':
			default:
				return '';
		}
	},
	chatModelsOpenaiUrl: async () => {
		const store = useAppStore();
		switch (store.settings.selected_provider_chat) {
			case 'openrouter':
				return 'https://openrouter.ai/api/v1/models';
			case 'koboldcpp':
				return store.settings.koboldcpp_host + '/v1/models';
			case '0':
			default:
				return '';
		}
	},
};

export default { other };
