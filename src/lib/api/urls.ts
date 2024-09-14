import useLlamaCpp from '@/src/composables/useLlamaCpp';

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
	llamacppServerUrl: async () => {
		const lcpp = useLlamaCpp();
		if (!lcpp) return '';
		return await lcpp.getServerUrl();
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
