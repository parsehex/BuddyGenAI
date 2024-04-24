const isDev = process.env.NODE_ENV === 'development';

const message = {
	getAll: (threadId: string) => `/api/message/all?threadId=${threadId}`,
	deleteAll: (threadId: string) => `/api/message/all?threadId=${threadId}`,
	create: () => {
		if (isDev) {
			console.log('using dev endpoint');
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
const persona = {
	getAll: () => '/api/persona/all',
	create: () => '/api/persona',
	get: (id: string) => `/api/persona/${id}`,
	update: (id: string) => `/api/persona/${id}`,
	delete: (id: string) => `/api/persona/${id}`,
	getProfilePic: (pic_name: string) => {
		const cacheVal = Math.random() * 1000;
		const p = `/images/${pic_name}?cache=${cacheVal}`;

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
export default { message, model, persona, setting, thread };
