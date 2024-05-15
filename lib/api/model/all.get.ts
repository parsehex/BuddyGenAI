import { AppSettings } from '@/lib/api/AppSettings';
import urls from '../urls';
import axios from 'axios';

const { dbGet, pathJoin, listDirectory, mkdir } = useElectron();

export default async function getAll(
	type: 'chat' | 'image'
): Promise<string[]> {
	if (!dbGet) throw new Error('dbGet not available');

	const isExternal = AppSettings.get('selected_provider_chat') === 'external';

	if (isExternal) {
		if (type === 'chat') {
			return ['gpt-3.5-turbo', 'gpt-4-turbo'];
		} else {
			return ['dall-e-2', 'dall-e-3'];
		}
	}

	const directory = AppSettings.get('local_model_directory') as string;
	if (!directory) {
		console.log('No directory');
		return [];
	}
	const subDir = await pathJoin(directory, type);
	await mkdir(subDir);

	const files = await listDirectory(directory);

	const ext = type === 'chat' ? '.gguf' : '.safetensors';
	const filteredFiles = files.filter((file) => file.endsWith(ext));
	return filteredFiles;
}
