import useElectron from '@/composables/useElectron';
import usePiper from '@/composables/usePiper';
import { verifyFilePath } from './utils';

interface MakeTTSOptions {
	absModelPath: string;
	outputFilename?: string;
	text: string;
}

export async function makeTTS(options: MakeTTSOptions) {
	const electron = useElectron();
	if (!electron.getDataPath) throw new Error('Electron not found');

	const { pathJoin, mkdir, fsUnlink, getDataPath } = electron;

	const piper = usePiper();
	if (!piper) throw new Error('usePiper not found');

	const { absModelPath, text } = options;

	const modelExists = await verifyFilePath(absModelPath);
	if (!modelExists) throw new Error('Model not found');

	const dataPath = await getDataPath('tts/');
	await mkdir(dataPath);

	// overwrite existing file
	const filename = options.outputFilename || `${Date.now()}.wav`;
	const outputPath = await pathJoin(dataPath, filename);
	const outputExists = await verifyFilePath(outputPath);
	if (outputExists) await fsUnlink(outputPath);

	await piper.runPiper({
		model: absModelPath,
		output: outputPath,
		text,
	});
}

export function cleanTextForTTS(text: string) {
	// Remove phrases enclosed in asterisks
	let cleanedText = text.replace(/\*[^*]*\*/g, '');

	// replace ... with . . .
	cleanedText = cleanedText.replace(/\.{3}/g, '. . .');

	// remove urls
	cleanedText = cleanedText.replace(/https?:\/\/[^\s]+/g, '');

	return cleanedText;
}
