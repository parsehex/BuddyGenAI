import { useAppStore } from '@/src/stores/main';
import { playAudio } from '../utils';
import { isFeatureAvailable } from './support';

interface MakeTTSOptions {
	text: string;
	speakerName?: string;

	// unused:
	absModelPath: string; // should be called voice path
	outputFilename?: string;
}

const speakerCache: Record<string, string> = {};

export async function makeTTS(options: MakeTTSOptions) {
	const store = useAppStore();
	const { text } = options;

	const host = store.settings.koboldcpp_host;
	if (!host) throw new Error('No host defined for koboldcpp');

	const payload = { input: text } as any;
	if (options.speakerName && getVoices().includes(options.speakerName)) {
		let json = '';
		const cachedVal = speakerCache[options.speakerName];
		if (cachedVal) {
			json = cachedVal;
		} else {
			try {
				const res = await fetch(`/tts-speakers/${options.speakerName}.json`);
				json = await res.json();
				speakerCache[options.speakerName] = json;
			} catch (e) {}
		}
		if (json) payload.speaker_json = JSON.stringify(json);
	}

	const response = await fetch(`${host}/api/extra/tts`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
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
export async function makeAndReadTTS(text: string, speakerName: string) {
	const store = useAppStore();
	const autoRead = store.settings.auto_read_chat;

	if (!autoRead) {
		console.log('TTS not enabled');
		return;
	}

	const data = await makeTTS({
		absModelPath: '',
		text,
		speakerName,
	});

	playAudio(data);

	return data;
}

export function getVoices() {
	if (!isFeatureAvailable('tts')) return [];

	return [
		// koboldcpp speakers copied from https://github.com/LostRuins/koboldcpp/tree/concedo/examples/outetts/speakers
		'en_female_1',
		'en_female_2',
		'en_male_1',
		'en_male_2',
		'en_male_3',
		'en_male_4',
	];
}

export function getSelectedVoice(buddyId?: string) {
	if (!isFeatureAvailable('tts')) return '';
	const store = useAppStore();
	if (buddyId) {
		const buddy = store.buddies.find((b) => b.id === buddyId);
		if (buddy && buddy.tts_voice) {
			return buddy.tts_voice;
		}
	}
	return store.settings.selected_model_tts;
}
