import { isServerRunning } from '../server';

export default defineEventHandler(async () => {
	const isRunning = await isServerRunning();

	return {
		isRunning,
	};
});
