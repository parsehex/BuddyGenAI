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
	const { text } = options;

	const host = store.settings.koboldcpp_host;
	if (!host) throw new Error('No host defined for koboldcpp');
	const response = await fetch(`${host}/api/extra/tts`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ input: text }),
	});

	if (!response.ok) {
		throw new Error('Failed to generate TTS');
	}

	const blob = await response.blob();
	const audioUrl = URL.createObjectURL(blob);
	return audioUrl;
}

/**
 * Higher-level function that uses makeTTS and plays the audio, returning the URL of the audio
 */
export async function makeAndReadTTS(text: string, ttsModel: string) {
	const autoRead = store.settings.auto_read_chat;

	// 0 is the value i that chose to signify disabling tts or stt
	// values from the db are getting cast to strings + sqlite uses 0 or 1 for booleans
	// @ts-ignore
	const autoReadEnabled = autoRead && autoRead !== '0.0' && autoRead !== '0' && autoRead !== 0;

	if (!autoReadEnabled) {
		console.log('TTS not enabled');
		return;
	}

	const data = await makeTTS({
		absModelPath: '',
		text,
	});

	playAudio(data);

	return data;
}
