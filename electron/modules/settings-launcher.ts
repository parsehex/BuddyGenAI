import { BrowserWindow, ipcMain, app } from 'electron';
import log from 'electron-log/main';
import * as config from '../config';
import { ModelType } from '../providers/types';
import { getProviderModels } from '../providers/models';

export default function settingsLauncherModule(mainWindow: BrowserWindow) {
	log.log('[-] MODULE::settingsLauncher Running');

	ipcMain.handle('getSettings', async (_) => {
		return config.get();
	});

	ipcMain.handle(
		'setSettings',
		async (_, newSettings: Partial<typeof config.SettingsDefaults>) => {
			await config.update(newSettings);
			return config.get();
		}
	);

	ipcMain.handle('restartApp', async (_) => {
		app.relaunch();
		app.exit();
	});
}
