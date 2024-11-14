import useElectron from '@/composables/useElectron';
import appConfig from '@/src/composables/useConfig';

const { dbGet, listDirectory } = useElectron();

export default async function getAll(
	type: 'chat' | 'image' | 'tts' | 'whisper'
): Promise<string[]> {
	if (!dbGet) throw new Error('dbGet not available');

	const isExternal = appConfig?.isExternal(type);

	if (isExternal) {
		if (type === 'chat') {
			return ['gpt-3.5-turbo', 'gpt-4-turbo'];
		} else {
			return ['dall-e-2', 'dall-e-3'];
		}
	}

	const directory = appConfig?.modelPath(type);
	if (!directory) {
		console.log('No directory');
		return [];
	}

	// TODO get models from api
	const files = await listDirectory(directory);

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
