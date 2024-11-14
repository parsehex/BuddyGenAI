export default function useSettingsLauncher() {
	const isServer =
		// @ts-ignore
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return;

	const electron = window.require('electron');

	// getSettings
	// setSettings

	// getProviders?
	//   idk if this would be useful
	// will need to be able to get available models for a provider tho
	// still not sure if the settings launcher is gonna need to get avail
	//   providers tho

	const getSettings = async () => {
		return await electron.ipcRenderer.invoke('getSettings');
	};

	const setSettings = async (newSettings: any) => {
		return await electron.ipcRenderer.invoke('setSettings', newSettings);
	};

	const getModels = async (provider: string) => {
		return await electron.ipcRenderer.invoke('getModels', provider);
	};

	const restartApp = async () => {
		return await electron.ipcRenderer.invoke('restartApp');
	};

	return {
		getSettings,
		setSettings,
		getModels,
		restartApp,
	};
}
