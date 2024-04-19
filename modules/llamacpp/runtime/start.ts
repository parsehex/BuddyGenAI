import path from 'path';
import fs from 'fs/promises';
import AppSettings from '@/server/AppSettings';
import { startServer } from '../server';

export default defineEventHandler(async () => {
	const modelDir = AppSettings.get('local_model_directory');
	if (!modelDir) {
		return createError('No model directory set');
	}

	const selectedModel = AppSettings.get('selected_model_chat');
	if (!selectedModel) {
		return createError('No chat model selected');
	}

	const modelPath = path.join(modelDir, 'chat', selectedModel);
	try {
		await fs.access(modelPath);
	} catch (e) {
		return createError('Chat model file not found');
	}

	await startServer(modelPath);

	return {
		message: 'Server started',
	};
});
