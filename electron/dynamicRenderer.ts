// This is the dynamic renderer script for Electron.
// You can implement your custom renderer process configuration etc. here!
// --------------------------------------------
import * as path from 'path';
import fs from 'fs/promises';
import { app, BrowserWindow, utilityProcess } from 'electron';
import express, { static as serveStatic } from 'express';
import { spawn, fork } from 'child_process';
import { findDirectoryInPath } from './fs';
import { pathToFileURL } from 'url';

// Internals
// =========
const isProduction = process.env.NODE_ENV !== 'development';

// Dynamic Renderer
// ================
export default function (mainWindow: BrowserWindow) {
	if (!isProduction) return mainWindow.loadURL('http://localhost:3000/');
	console.log('isProduction', isProduction);
	const app = express();
	app.use('/', serveStatic(path.join(__dirname, '../public')));

	const listener = app.listen(8079, 'localhost', () => {
		const port = (listener.address() as any).port;
		console.log('Dynamic-Renderer Listening on', port);
		mainWindow.loadURL(`http://localhost:${port}`);
	});
}
