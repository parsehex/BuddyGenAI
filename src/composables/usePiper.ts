import type { PiperOptions } from '@/lib/api/types-api';

// TODO route endpoint to get tts
//   - run-piper
//   - run-openai

export default function usePiper() {
	const isServer =
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return;

	const runPiper = async (options: PiperOptions) => {
		const res = await fetch('http://localhost:8079/api/tts/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(options),
		});
		const data = await res.json();
		return data.output;
	};

	return {
		runPiper,
	};
}
