import AppSettings from '../../AppSettings';

const { dbGet, pathJoin, listDirectory, mkdir } = useElectron();

export default async function getAll(
	type: 'chat' | 'image'
): Promise<string[]> {
	if (!dbGet) throw new Error('dbGet not available');

	const directory = AppSettings.get('local_model_directory');
	if (!directory) {
		console.log('No directory');
		return [];
	}
	const subDir = await pathJoin(directory, type);
	await mkdir(subDir);

	const files = await listDirectory(subDir);

	const ext = type === 'chat' ? '.gguf' : '.safetensors';
	const filteredFiles = files.filter((file) => file.endsWith(ext));
	return filteredFiles;
}
