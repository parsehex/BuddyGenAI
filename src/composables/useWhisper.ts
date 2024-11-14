import type { WhisperOptions } from '@/lib/api/types-api';

export default function useWhisper() {
	const isServer =
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return;

	const runWhisper = async (options: WhisperOptions) => {
		// send input buffer to /api/stt/transcribe
		const { input, model } = options;
		const formData = new FormData();
		// buffer to blob
		const blob = new Blob([input], { type: 'audio/webm' });
		formData.append('file', blob, 'audio.webm');
		formData.append('model', model);

		const response = await fetch('http://localhost:8079/api/stt/transcribe', {
			method: 'POST',
			body: formData,
		});
		const data = await response.json();
		return data;
	};

	return {
		runWhisper,
	};
}
