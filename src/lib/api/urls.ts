import useLlamaCpp from '@/src/composables/useLlamaCpp';
import { useAppStore } from '@/src/stores/main';

const isDev = process.env.NODE_ENV === 'development';

const other = {
	llamacppHealth: () => {
		if (isDev) {
			return 'http://localhost:8079/health';
		}
		return '/health';
	},
	llamacppBaseUrl: async () => {
		const lcpp = useLlamaCpp();
		if (!lcpp) return '';
		return await lcpp.getBaseUrl();
	},
	koboldUrl: (subPath?: string) => {
		const store = useAppStore();
		let p = store.settings.koboldcpp_host;
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
				return '';
		}
	},
};

const message = {
	create: () => {
		if (isDev) {
			return 'http://localhost:8079/api/message';
		}
		return '/api/message';
	},
	completion: () => {
		if (isDev) {
			return 'http://localhost:8079/api/completion';
		}
		return '/api/completion';
	},
};
const buddy = {
	getProfilePic: (pic_name: string) => {
		const p = `/images/${pic_name}`;

		if (isDev) {
			return `http://localhost:8079${p}`;
		}
		return p;
	},
};
const tts = {
	get: (name: string) => {
		const tts = `/tts/${name}`;

		if (isDev) {
			return `http://localhost:8079${tts}`;
		}
		return tts;
	},
};
const sd = {
	progress: () => {
		const sd = `/api/sd/progress`;

		if (isDev) {
			return `http://localhost:8079${sd}`;
		}
		return sd;
	},
};
export default { other, message, buddy, tts, sd };
