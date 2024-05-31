import useElectron from '@/composables/useElectron';
import usePiper from '@/composables/usePiper';
import { cleanTextForTTS, verifyFilePath } from './utils';
import { useAppStore } from '@/src/stores/main';
import { playAudio } from '../utils';
import urls from '../api/urls';

const store = useAppStore();

interface MakeTTSOptions {
	absModelPath: string; // should be called voice path
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

/**
 * Higher-level function that uses makeTTS and plays the audio, returning the URL of the audio
 */
export async function makeAndReadTTS(text: string, ttsModel: string) {
	const autoRead = store.settings.auto_read_chat;

	// 0 is the value i that chose to signify disabling tts or stt
	// values from the db are getting cast to strings + sqlite uses 0 or 1 for booleans
	// @ts-ignore
	const autoReadEnabled = autoRead && autoRead !== '0.0' && autoRead !== 0;
	const ttsEnabled = ttsModel && ttsModel !== '0';

	if (!autoReadEnabled || !ttsEnabled) {
		console.log('TTS not enabled');
		return;
	}

	const filename = `${Date.now()}.wav`;
	text = cleanTextForTTS(text);
	await makeTTS({
		absModelPath: ttsModel,
		outputFilename: filename,
		text,
	});

	const url = urls.tts.get(filename);
	playAudio(url);

	return url;
}
