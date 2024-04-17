import z from 'zod';
import path from 'path';
import fs from 'fs/promises';
import AppSettings from '~/server/AppSettings';

const urlSchema = z.object({
	type: z.literal('chat').or(z.literal('image')),
});

export default defineLazyEventHandler(async () => {
	return defineEventHandler(async (event) => {
		const { type } = await getValidatedRouterParams(event, (params) => urlSchema.parse(params));

		const directory = AppSettings.get('local_model_directory');
		const subDir = path.join(directory, type);
		await fs.mkdir(subDir, { recursive: true });

		const files = await fs.readdir(subDir);

		const ext = type === 'chat' ? '.gguf' : '.safetensors';
		const filteredFiles = files.filter((file) => file.endsWith(ext));
		return filteredFiles;
	});
});
