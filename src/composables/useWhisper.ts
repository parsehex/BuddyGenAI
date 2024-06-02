import type { WhisperOptions } from '@/lib/api/types-api';

export default function useWhisper() {
	const isServer =
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return;

	const electron = window.require('electron');

	const runWhisper = async (options: WhisperOptions) => {
		console.time('runWhisper');
		const res = await electron.ipcRenderer.invoke('whisper/run', options);
		console.timeEnd('runWhisper');
		return res;
	};

	return {
		runWhisper,
	};
}
