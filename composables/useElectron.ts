export default function useElectron() {
	const isServer =
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return { isElectron };

	// Initialize electron
	const electron = window.require('electron');

	// Window title bar actions
	// ========================
	const titleBarActions = {
		minimize: () => electron.ipcRenderer.invoke('titlebar:action', 'minimize'),
		toggleMaximize: () =>
			electron.ipcRenderer.invoke('titlebar:action', 'toggleMaximize'),
		isMaximized: () => electron.ipcRenderer.invoke('isMaximized:app', null),
		close: () => electron.ipcRenderer.invoke('close:app', null),
	};

	// Window title bar stats
	// ======================
	const windowStats = ref({
		isMaximized: false,
		isFullscreen: false,
	});

	electron.ipcRenderer.on('window:maximizeChanged', (_event, value) => {
		windowStats.value.isMaximized = value;
	});
	electron.ipcRenderer.on('window:fullscreenChanged', (_event, value) => {
		windowStats.value.isFullscreen = value;
	});

	const copyToClipboard = (text: string) => {
		electron.clipboard.writeText(text);
	};

	const toggleDevTools = () => {
		electron.ipcRenderer.invoke('toggleDevTools:app', null);
	};

	const pickDirectory = async () => {
		const result = await electron.ipcRenderer.invoke('pickDirectory:app', null);
		return result;
	};

	const verifyModelDirectory = async (directory: string) => {
		const result = await electron.ipcRenderer.invoke(
			'verifyModelDirectory:app',
			directory
		);
		return result;
	};

	const dbRun = async (query: string, params: any[] = []) => {
		const result = await electron.ipcRenderer.invoke('db:run', query, params);
		if (result.error) {
			console.error(result.error);
		}
		return result;
	};
	const dbGet = async (query: string, params: any[] = []) => {
		const result = await electron.ipcRenderer.invoke('db:get', query, params);
		if (result.error) {
			console.error(result.error);
		}
		return result;
	};
	const dbAll = async (query: string, params: any[] = []) => {
		const result = await electron.ipcRenderer.invoke('db:all', query, params);
		if (result.error) {
			console.error(result.error);
		}
		return result;
	};

	const pathJoin = async (path: string, ...paths: string[]): Promise<string> => {
		const result = await electron.ipcRenderer.invoke('pathJoin', path, ...paths);
		return result;
	};
	const listDirectory = async (directory: string): Promise<string[]> => {
		const result = await electron.ipcRenderer.invoke('listDirectory', directory);
		return result;
	};
	const mkdir = async (directory: string): Promise<boolean> => {
		const result = await electron.ipcRenderer.invoke('mkdir', directory);
		return result;
	};

	// Initialize ipcRenderer
	return {
		copyToClipboard,
		isElectron,
		titleBarActions,
		windowStats,
		toggleDevTools,
		pickDirectory,
		verifyModelDirectory,
		pathJoin,
		listDirectory,
		mkdir,
		dbRun,
		dbGet,
		dbAll,
	};
}
