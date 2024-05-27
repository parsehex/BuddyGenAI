import useElectron from '@/composables/useElectron';
import useSD from '@/composables/useSD';
import { verifyFilePath } from './utils';

interface MakePictureOptions {
	absModelPath: string;
	/** e.g. buddy id */
	outputSubDir: string;
	outputFilename?: string;
	posPrompt: string;
	negPrompt: string;
	size?: 512 | 768;
	quality?: 'low' | 'medium' | 'high';
}

const Steps = {
	low: 16,
	medium: 24,
	high: 32,
};

export async function makePicture(options: MakePictureOptions) {
	const electron = useElectron();
	if (!electron.getDataPath) throw new Error('Electron not found');

	const { pathJoin, mkdir, fsUnlink, getDataPath } = electron;

	const sd = useSD();
	if (!sd) throw new Error('useSD not found');

	const {
		absModelPath,
		outputSubDir,
		posPrompt,
		negPrompt,
		size = 512,
		quality = 'medium',
	} = options;

	const modelExists = await verifyFilePath(absModelPath);
	if (!modelExists) throw new Error('Model not found');

	const dataPath = await getDataPath('images/' + outputSubDir);
	await mkdir(dataPath);

	// overwrite existing file
	const filename = options.outputFilename || `${Date.now()}.png`;
	const outputPath = await pathJoin(dataPath, filename);
	const outputExists = await verifyFilePath(outputPath);
	if (outputExists) await fsUnlink(outputPath);

	await sd.runSD({
		model: absModelPath,
		pos: posPrompt,
		output: outputPath,
		neg: negPrompt,
		size,
		steps: Steps[quality],
	});
}
