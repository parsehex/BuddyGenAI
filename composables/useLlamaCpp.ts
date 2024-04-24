export default function useLlamaCpp() {
	const isServer =
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return;

	const electron = window.require('electron');

	const startServer = async (modelPath: string) => {
		console.log('Starting server', modelPath);
		await electron.ipcRenderer.invoke('llamacpp/start', modelPath);
	};

	const stopServer = async () => {
		await electron.ipcRenderer.invoke('llamacpp/stop');
	};

	const isServerRunning = async () => {
		return await electron.ipcRenderer.invoke('llamacpp/status');
	};

	return {
		startServer,
		stopServer,
		isServerRunning,
	};
}
