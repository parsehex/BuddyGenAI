import { isServerRunning, stopServer } from '../server';

export default defineEventHandler(async () => {
	if (!isServerRunning()) return { message: 'Server not running' };

	await stopServer();

	return { message: 'Server stopped' };
});
