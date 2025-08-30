import { useAppStore } from '@/src/stores/main';
import { AppSettings, type TTSProvider } from '../../api/AppSettings';
import type { TTSRequest } from './types';

let abortCtlr: AbortController | null = null;

export async function makeTTS(req: TTSRequest) {
	abortCtlr = new AbortController();
	const provider = AppSettings.get('selected_provider_tts') as TTSProvider;
	if (provider !== 'koboldcpp') throw new Error('Called wrong provider');

	const store = useAppStore();
	const host = store.settings.koboldcpp_host;
	const url = host + '/api/extra/tts';
	req = JSON.parse(JSON.stringify(req));

	const response = await fetch(url, {
		signal: abortCtlr.signal,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(req),
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const blob = await response.blob();
	const audioUrl = URL.createObjectURL(blob);
	return audioUrl;
}

export function stop() {
	if (!abortCtlr) return false;
	abortCtlr.abort();
	abortCtlr = null;
	return true;
}

export async function getVoices() {
	return [
		// koboldcpp speakers copied from https://github.com/LostRuins/koboldcpp/tree/concedo/examples/outetts/speakers
		// 'en_female_1',
		// 'en_female_2',
		// 'en_male_1',
		// 'en_male_2',
		// 'en_male_3',
		// 'en_male_4',

		// from https://github.com/LostRuins/koboldcpp/releases/tag/v1.98.1
		'af_alloy',
		'af_aoede',
		'af_bella',
		'af_heart',
		'af_jessica',
		'af_kore',
		'af_nicole',
		'af_nova',
		'af_river',
		'af_sarah',
		'af_sky',
		'am_adam',
		'am_echo',
		'am_eric',
		'am_fenrir',
		'am_liam',
		'am_michael',
		'am_onyx',
		'am_puck',
		'am_santa',
		'bf_alice',
		'bf_emma',
		'bf_isabella',
		'bf_lily',
		'bm_daniel',
		'bm_fable',
		'bm_george',
		'bm_lewis',
	];
}
