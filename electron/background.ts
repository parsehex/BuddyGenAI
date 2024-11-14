import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { app, BrowserWindow, session, dialog, shell } from 'electron';
import singleInstance from './singleInstance';
import dynamicRenderer from './dynamicRenderer';
// import updaterModule from '../updater';
import { ipcMain } from 'electron/main';
import appMenu from './modules/appMenu';
import db from './modules/db';
import { basename, dirname, join, resolve } from 'path';
import llamaCppModule from './modules/llamacpp';
import { fileURLToPath } from 'url';
import sdModule from './modules/sd';
import { getDataPath } from './fs';
// @ts-ignore
import log from 'electron-log/main';
import piperModule from './modules/piper';
import whisperModule from './modules/whisper';
import rememberWindowState, { loadWindowState } from './window-state';
import { getLlamaCppPort } from './rand';
import * as config from './config';
import settingsLauncherModule from './modules/settings-launcher';

log.initialize();
log.errorHandler.startCatching();

const cacheObj = {} as Record<string, any>;

// Initilize
// =========
const isProduction = process.env.NODE_ENV !== 'development';
const platform: 'darwin' | 'win32' | 'linux' = process.platform as any;
const architucture: '64' | '32' = os.arch() === 'x64' ? '64' : '32';
const headerSize = 32;

// Initialize app window
// =====================
async function createWindow() {
	log.log('System info', { isProduction, platform, architucture });

	const initialWindowState = loadWindowState();

	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: initialWindowState.width,
		height: initialWindowState.height,
		x: initialWindowState.x,
		y: initialWindowState.y,
		minWidth: 950,
		maximizable: true,
		webPreferences: {
			// devTools: !isProduction,
			nodeIntegration: true,
			contextIsolation: false,
			preload: path.join(__dirname, 'preload.js'),
		},

		frame: platform === 'darwin',
		titleBarOverlay: platform === 'darwin' && { height: headerSize },
		title: 'BuddyGenAI',
	});
	cacheObj.mainWindow = mainWindow;

	if (initialWindowState.maximized) {
		mainWindow.maximize();
	}

	rememberWindowState(mainWindow);

	await db(mainWindow);
	await llamaCppModule(mainWindow);
	await sdModule(mainWindow);
	await piperModule(mainWindow);
	await whisperModule(mainWindow);
	await settingsLauncherModule(mainWindow);

	// mainWindow.removeMenu();
	// TODO add native electron menu

	// TODO: move to modules, add composables (useFS, etc)
	ipcMain.handle('pathJoin', async (_, path: string, ...paths: string[]) => {
		return join(path, ...paths);
	});
	ipcMain.handle('pathResolve', async (_, path: string, ...paths: string[]) => {
		return resolve(path, ...paths);
	});
	ipcMain.handle('pathDirname', async (_, path: string) => {
		return dirname(path);
	});
	ipcMain.handle('pathBasename', async (_, path: string) => {
		return basename(path);
	});
	ipcMain.handle('fsAccess', async (_, path: string) => {
		try {
			await fs.access(path);
			return true;
		} catch (err) {
			return false;
		}
	});
	ipcMain.handle('fsUnlink', async (_, path: string) => {
		try {
			await fs.unlink(path);
			return true;
		} catch (err) {
			return false;
		}
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
	ipcMain.handle('fileURLToPath', async (_, url: string) => {
		return fileURLToPath(url);
	});
	ipcMain.handle('openExternalLink', async (_, url: string) => {
		shell.openExternal(url);
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

	ipcMain.handle('pickFile:app', async (_, fileType: string) => {
		let extensions = ['safetensors', 'gguf', 'onnx', 'bin'];
		let name = 'Model files';
		if (fileType === 'chat') {
			extensions = ['gguf'];
			name = 'Chat model files';
		} else if (fileType === 'image') {
			extensions = ['safetensors'];
			name = 'Image model files';
		} else if (fileType === 'tts') {
			extensions = ['onnx'];
			name = 'TTS voice files';
		} else if (fileType === 'stt') {
			extensions = ['bin'];
			name = 'STT model files';
		}
		const result = await dialog.showOpenDialog({
			properties: ['openFile', 'multiSelections'],
			filters: [{ name, extensions }],
		});

		if (fileType === 'tts') {
			const onnxFiles = result.filePaths;
			const configFiles = [];
			for (const onnxFile of onnxFiles) {
				const jsonFile = onnxFile + '.json';
				try {
					await fs.access(jsonFile);
					configFiles.push(jsonFile);
				} catch (err) {
					log.error('json file not found for onnx file', onnxFile);
				}
			}
			return [...onnxFiles, ...configFiles];
		}

		return result.filePaths;
	});

	ipcMain.handle('pickPackFile:app', async () => {
		const result = await dialog.showOpenDialog({
			properties: ['openFile'],
			filters: [{ name: 'Model Pack files (.zip)', extensions: ['zip'] }],
		});

		// TODO get files in zip to verify and return

		return result.filePaths;
	});

	ipcMain.handle('importPack:app', async (_, src: string) => {
		// inspect the zip to contain correct files
		// extract the zip to the models directory
		// delete the zip
	});

	ipcMain.handle(
		'moveFile:app',
		async (_, source: string, destination: string) => {
			try {
				await fs.rename(source, destination);
				return true;
			} catch (err) {
				return false;
			}
		}
	);

	ipcMain.handle(
		'linkFile:app',
		async (_, source: string, destination: string) => {
			try {
				await fs.symlink(source, destination);
				return true;
			} catch (err) {
				return false;
			}
		}
	);

	ipcMain.handle('verifyModelDirectory:app', async (_) => {
		try {
			const modelsPath = getDataPath('Models');
			await fs.mkdir(modelsPath, { recursive: true });
			return modelsPath;
		} catch (err) {
			return '';
		}
	});

	ipcMain.handle('openModelDirectory:app', async () => {
		const modelsPath = getDataPath('Models');
		await shell.openPath(modelsPath);
	});

	ipcMain.handle('getDataPath', async (_, path: string) => {
		return getDataPath(path);
	});

	ipcMain.handle('closeApp', async (_) => {
		app.quit();
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
			log.error('[Electron::loadExtensions] An error occurred: ', err);
		}
	}

	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': ["script-src 'self'"],
			},
		});
	});

	const mainWindow = await createWindow();
	if (!mainWindow) return;

	// Load renderer process
	// TODO in here is where the settings launcher would go
	// ui should be able to open launcher too
	//   which would close main window and open settings window
	dynamicRenderer(mainWindow);

	// Initialize modules
	// log.debug('-'.repeat(30) + '\n[+] Loading modules...');
	// modules.forEach((module) => {
	// 	try {
	// 		module(mainWindow);
	// 	} catch (err: any) {
	// 		log.error('[!] Module error: ', err.message || err);
	// 	}
	// });
	// allow for modules to be async
	// for (let i = 0; i < modules.length; i++) {
	// 	try {
	// 		await modules[i](mainWindow);
	// 	} catch (err: any) {
	// 		log.error('[!] Module error: ', err.message || err);
	// 	}
	// }
	appMenu(mainWindow);
	// updaterModule(mainWindow);

	// log.debug('[!] Loading modules: Done.' + '\r\n' + '-'.repeat(30));

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		// if (BrowserWindow.getAllWindows().length === 0) createWindow()
		mainWindow.show();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
