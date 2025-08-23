import { useAppStore } from '@/src/stores/main';
import { AppSettings, type STTProvider } from '../../api/AppSettings';
import type { STTRequest } from './types';

let abortCtlr: AbortController | null = null;

export async function transcribe(req: STTRequest) {
	abortCtlr = new AbortController();
	const provider = AppSettings.get('selected_provider_stt') as STTProvider;
	if (provider !== 'koboldcpp') throw new Error('Called wrong provider');

	const store = useAppStore();
	const host = store.settings.koboldcpp_host;
	const url = host + '/api/extra/transcribe';
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

	const data = await response.json();
	return data.text;
}

export function stop() {
	if (!abortCtlr) return false;
	abortCtlr.abort();
	abortCtlr = null;
	return true;
}
