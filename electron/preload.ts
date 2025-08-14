// This is the preload script for Electron.
// It runs in the renderer process before the page is loaded.
// --------------------------------------------

import { contextBridge } from 'electron';

process.once('loaded', () => {
	contextBridge.exposeInMainWorld('env', {
		VITE_APP_BUILD_TARGET: process.env.VITE_APP_BUILD_TARGET,
	});
});
