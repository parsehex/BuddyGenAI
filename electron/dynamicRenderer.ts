// This is the dynamic renderer script for Electron.
// You can implement your custom renderer process configuration etc. here!
// --------------------------------------------
import * as path from 'path';
import { app, BrowserWindow } from 'electron';
import express, { static as serveStatic } from 'express';
import { spawn, fork } from 'child_process';
import { findDirectoryInPath } from './fs';

// Internals
// =========
const isProduction = process.env.NODE_ENV !== 'development';

// Dynamic Renderer
// ================
export default function (mainWindow: BrowserWindow) {
	if (!isProduction) return mainWindow.loadURL('http://localhost:3000/');
	const app = express();
	app.use('/', serveStatic(path.join(__dirname, '../public')));

	(async () => {
		const parentDir = await findDirectoryInPath('resources', __dirname);
		console.log('parentDir', parentDir);

		if (!parentDir) {
			throw new Error('Could not find resources directory');
		}

		const serverPath = path.resolve(parentDir, '.output/server', 'index.mjs');
		console.log('serverPath', serverPath);

		// use spawn to run the server in a separate process
		const server = fork(serverPath, [], {
			stdio: 'pipe',
		});
		server.stdout?.on('data', (data) => {
			console.log(data.toString());

			setTimeout(() => {
				mainWindow.loadURL('http://localhost:3000/');
			}, 150);
		});

		app.on('window-all-closed', async () => {
			const r = await fetch('http://localhost:3000/api/llama.cpp/stop', {
				method: 'POST',
			});
			console.log('stop', r);
			console.log(server.kill('SIGKILL'));
		});
	})();
}
