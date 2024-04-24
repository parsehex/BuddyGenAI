import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { app, BrowserWindow, session, dialog } from 'electron';
import singleInstance from './singleInstance';
import dynamicRenderer from './dynamicRenderer';
import titleBarActionsModule from './modules/titleBarActions';
// import updaterModule from '../updater';
import macMenuModule from './modules/macMenu';
import { ipcMain } from 'electron/main';
import macMenu from './modules/macMenu';
import { title } from 'process';
import db from './modules/db';
import { join } from 'path';
import llamaCppModule from './modules/llamacpp';

// Initilize
// =========
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
const isProduction = process.env.NODE_ENV !== 'development';
const platform: 'darwin' | 'win32' | 'linux' = process.platform as any;
const architucture: '64' | '32' = os.arch() === 'x64' ? '64' : '32';
const headerSize = 32;
const modules = [titleBarActionsModule, macMenuModule];

// Initialize app window
// =====================
async function createWindow() {
	console.log('System info', { isProduction, platform, architucture });
	// TODO better sizing, remember window size/shape/position
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 1024,
		height: 676,
		// minWidth: 1024,
		// minHeight: 676,
		maximizable: true,
		webPreferences: {
			// devTools: !isProduction,
			nodeIntegration: true,
			contextIsolation: false,
			preload: path.join(__dirname, 'preload.js'),
		},

		titleBarStyle: 'hiddenInset',
		// frame: platform === 'darwin',
		frame: true,
		titleBarOverlay: platform === 'darwin' && { height: headerSize },
		title: 'BuddyGen',
	});

	await db(mainWindow);
	await llamaCppModule(mainWindow);

	mainWindow.removeMenu();

	ipcMain.handle('pathJoin', async (_, path: string, ...paths: string[]) => {
		return join(path, ...paths);
	});
	ipcMain.handle('listDirectory', async (_, directory: string) => {
		try {
			const files = await fs.readdir(directory);
			return files;
		} catch (err) {
			return [];
		}
	});
	ipcMain.handle('mkdir', async (_, directory: string) => {
		try {
			await fs.mkdir(directory, { recursive: true });
			return true;
		} catch (err) {
			return false;
		}
	});

	ipcMain.handle('toggleDevTools:app', () => {
		mainWindow.webContents.toggleDevTools();
	});

	ipcMain.handle('pickDirectory:app', async () => {
		const result = await dialog.showOpenDialog({
			properties: ['openDirectory'],
		});
		return result.filePaths[0];
	});

	ipcMain.handle('verifyModelDirectory:app', async (_, directory: string) => {
		const chatDir = path.join(directory, 'chat');
		const imageDir = path.join(directory, 'image');
		try {
			const chatStat = await fs.stat(chatDir);
			const imageStat = await fs.stat(imageDir);
			if (chatStat.isDirectory() && imageStat.isDirectory()) {
				return true;
			}
		} catch (err) {
			return false;
		}
	});

	// Lock app to single instance
	if (singleInstance(app, mainWindow)) return;

	// Open the DevTools.
	!isProduction &&
		mainWindow.webContents.openDevTools({
			mode: 'bottom',
		});

	return mainWindow;
}

// App events
// ==========
app.whenReady().then(async () => {
	if (!isProduction) {
		try {
			await session.defaultSession.loadExtension(
				path.join(__dirname, '../..', '__extensions', 'vue-devtools')
			);
		} catch (err) {
			console.log('[Electron::loadExtensions] An error occurred: ', err);
		}
	}

	const mainWindow = await createWindow();
	if (!mainWindow) return;

	// Load renderer process
	dynamicRenderer(mainWindow);

	// Initialize modules
	console.log('-'.repeat(30) + '\n[+] Loading modules...');
	// modules.forEach((module) => {
	// 	try {
	// 		module(mainWindow);
	// 	} catch (err: any) {
	// 		console.log('[!] Module error: ', err.message || err);
	// 	}
	// });
	// allow for modules to be async
	// for (let i = 0; i < modules.length; i++) {
	// 	try {
	// 		await modules[i](mainWindow);
	// 	} catch (err: any) {
	// 		console.log('[!] Module error: ', err.message || err);
	// 	}
	// }
	macMenu(mainWindow);
	// updaterModule(mainWindow);
	titleBarActionsModule(mainWindow);

	console.log('[!] Loading modules: Done.' + '\r\n' + '-'.repeat(30));

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		// if (BrowserWindow.getAllWindows().length === 0) createWindow()
		mainWindow.show();
	});

	// await import('./ai/llamacpp')
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
