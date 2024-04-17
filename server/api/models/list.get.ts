import z from 'zod';
import AppSettings, { AppSettingsDefaults } from '~/server/AppSettings';
import path from 'path';
import fs from 'fs/promises';

const querySchema = z.object({
	type: z.literal('chat').or(z.literal('image')),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const { type } = await getValidatedQuery(event, (query) => querySchema.parse(query));
		const directory = AppSettings.get('local_model_directory');
		const subDir = path.join(directory, type);
		await fs.mkdir(subDir, { recursive: true });

		const files = await fs.readdir(subDir);

		const ext = type === 'chat' ? '.gguf' : '.safetensors';
		const filteredFiles = files.filter((file) => file.endsWith(ext));
		return filteredFiles;
	});
});
