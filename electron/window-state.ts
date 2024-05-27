import { app, type BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { findResourcesPath, getDataPath } from './fs';
import { debounce } from './utils';

interface WindowState {
	width: number;
	height: number;
	x: number;
	y: number;
	maximized?: boolean;
}

const defaultState: WindowState = {
	width: 1024,
	height: 710,
	x: 0,
	y: 0,
	maximized: false,
};

let state: WindowState;

export function loadWindowState(): WindowState {
	try {
		const dataDir = getDataPath();
		return JSON.parse(
			fs.readFileSync(path.join(dataDir, 'window-state.json'), 'utf-8')
		);
	} catch (e) {
		return defaultState;
	}
}

const saveState = debounce(async function () {
	const dataDir = await findResourcesPath();
	fs.writeFileSync(
		path.join(dataDir, 'window-state.json'),
		JSON.stringify(state)
	);
	console.log('Saved window state');
}, 1000);

export default function rememberWindowState(mainWindow: BrowserWindow) {
	state = loadWindowState();
	mainWindow.setBounds(state);

	['resize', 'move', 'maximize', 'unmaximize'].forEach((event) => {
		mainWindow.on(event as any, () => {
			if (event === 'resize' || event === 'move') {
				const bounds = mainWindow.getBounds();
				state.width = bounds.width;
				state.height = bounds.height;
				state.x = bounds.x;
				state.y = bounds.y;
			} else if (event === 'maximize') {
				state.maximized = true;
			} else if (event === 'unmaximize') {
				state.maximized = false;
			}
			saveState();
		});
	});
}
