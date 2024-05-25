const isDev = process.env.NODE_ENV === 'development';

const other = {
	llamacppHealth: () => {
		if (isDev) {
			return 'http://localhost:8079/health';
		}
		return '/health';
	},
	openaiModels: () => {
		if (isDev) {
			return 'http://localhost:8079/api/openai-models';
		}
		return '/api/openai-models';
	},
};

const message = {
	getAll: (threadId: string) => `/api/message/all?threadId=${threadId}`,
	deleteAll: (threadId: string) => `/api/message/all?threadId=${threadId}`,
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
	delete: (messageId: string) => `/api/message/${messageId}`,
	update: (messageId: string) => `/api/message/${messageId}`,
};
const model = {
	getAvailableModels: (type: 'chat' | 'image') => `/api/model/${type}/all`,
};
const buddy = {
	getAll: () => '/api/persona/all',
	create: () => '/api/persona',
	get: (id: string) => `/api/persona/${id}`,
	update: (id: string) => `/api/persona/${id}`,
	delete: (id: string) => `/api/persona/${id}`,
	getProfilePic: (pic_name: string) => {
		const p = `/images/${pic_name}`;

		if (isDev) {
			return `http://localhost:8079${p}`;
		}
		return p;
	},
	createProfilePic: (personaId: string) =>
		`/api/persona/${personaId}/profile-pic`,
	getAllVersions: (personaId: string) => `/api/persona/${personaId}/version/all`,
	getCurrentVersion: (personaId: string) =>
		`/api/persona/${personaId}/version/current`,
	getVersion: (personaId: string, versionId: string) =>
		`/api/persona/${personaId}/version/${versionId}`,
};
const setting = {
	getAll: () => '/api/setting/all',
	getDefaults: () => '/api/setting/defaults',
	get: (keys: string[]) => `/api/setting?keys=${keys.join(',')}`,
	update: () => '/api/setting',
};
const thread = {
	getAll: () => '/api/thread/all',
	getAllByPersona: (personaId: string) =>
		`/api/thread/all?persona_id=${personaId}`,
	create: () => '/api/thread',
	get: (id: string) => `/api/thread/${id}`,
	update: (id: string) => `/api/thread/${id}`,
	delete: (id: string) => `/api/thread/${id}`,
	updateSystemMessage: (threadId: string) =>
		`/api/update-thread-from-persona?threadId=${threadId}`,
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
export default { other, message, model, buddy, setting, thread, tts, sd };
