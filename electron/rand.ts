let serverPort: number;
let llamacppPort: number;
let llamacppApiKey: string;

const isDev = process.env.NODE_ENV === 'development';

const DevPort = 8079;
const devApiKey = '';

function generateRandomString(loops: number) {
	let result = '';
	for (let i = 0; i < loops; i++) {
		result += Math.random().toString(36).substring(2);
	}
	return result;
}

function randomizePort(type: 'llamacpp' | 'server' = 'server') {
	if (isDev && type === 'server') {
		serverPort = DevPort;
		return;
	}
	if (type === 'llamacpp') {
		llamacppPort = Math.floor(Math.random() * 10000) + 8000;
	} else {
		serverPort = Math.floor(Math.random() * 10000) + 8000;
	}
}
function randomizeApiKey() {
	if (isDev) {
		llamacppApiKey = devApiKey;
		return;
	}
	llamacppApiKey = generateRandomString(3);
}

export function getServerPort() {
	if (!serverPort) {
		randomizePort('server');
	}

	return serverPort;
}
export function getLlamaCppPort() {
	if (!llamacppPort) {
		randomizePort('llamacpp');
	}

	return llamacppPort;
}
export function getLlamaCppApiKey() {
	if (!llamacppApiKey) {
		randomizeApiKey();
	}

	return llamacppApiKey;
}
