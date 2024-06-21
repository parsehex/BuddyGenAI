import { contextBridge, ipcRenderer } from 'electron';

process.once('loaded', () => {
	// call getFunctions
	ipcRenderer.invoke('getFunctions').then((functions: string[]) => {
		// expose functions, handler calls back to ipc
		functions.forEach((func) => {
			contextBridge.exposeInMainWorld(func, (...args: any[]) => {
				return ipcRenderer.invoke(func, ...args);
			});
		});
	});
});
