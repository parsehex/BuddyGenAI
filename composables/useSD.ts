export default function useSD() {
	const isServer =
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return;

	const electron = window.require('electron');

	// TODO getProgress

	const runSD = async (
		model: string,
		pos: string,
		output: string,
		neg?: string
	) => {
		return await electron.ipcRenderer.invoke('SD/run', model, pos, output, neg);
	};

	return {
		runSD,
	};
}
