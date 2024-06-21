import fs from 'fs-extra';
import { AppSettings } from '@/AppSettings';

export async function getAllModels(
	type: 'chat' | 'image' | 'tts' | 'whisper'
): Promise<string[]> {
	const isExternal =
		(await AppSettings.get('selected_provider_chat')) === 'external';

	if (isExternal) {
		if (type === 'chat') {
			return ['gpt-3.5-turbo', 'gpt-4-turbo'];
		} else {
			return ['dall-e-2', 'dall-e-3'];
		}
	}

	const directory = (await AppSettings.get('local_model_directory')) as string;
	if (!directory) {
		console.log('No directory');
		return [];
	}

	const files = await fs.readdir(directory);

	// chat models: .gguf
	// image: .safetensors
	// tts: .onnx
	// whisper: .bin

	const ext =
		type === 'chat'
			? '.gguf'
			: type === 'image'
			? '.safetensors'
			: type === 'tts'
			? '.onnx'
			: '.bin';
	const filteredFiles = files.filter((file) => file.endsWith(ext));
	return filteredFiles;
}
