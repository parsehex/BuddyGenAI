// This is the dynamic renderer script for Electron.
// You can implement your custom renderer process configuration etc. here!
// --------------------------------------------
import * as path from 'path';
import fs from 'fs/promises';
import cors from 'cors';
import { app, BrowserWindow, utilityProcess } from 'electron';
import express, { static as serveStatic } from 'express';
import { spawn, fork } from 'child_process';
import { findDirectoryInPath } from './fs';
import { pathToFileURL } from 'url';
import llamaCppRouter from './routes/message';
import sdRouter from './routes/sd';
import { getServerPort } from './rand';

const isDev = process.env.NODE_ENV === 'development';

const dbLocations = {
	win32: '%APPDATA%/BuddyGenAI/images',
	linux: '~/.config/BuddyGenAI/images',
	darwin: '~/Library/Application Support/BuddyGenAI/images',
};

const platform = process.platform;
// @ts-ignore
const dir = dbLocations[platform];
let imgPath = '';
if (isDev) {
	imgPath = path.join('data', 'images');
} else {
	imgPath = path.join(dir);
	// resolve ~ and %APPDATA%
	if (platform === 'win32') {
		const appData = process.env.APPDATA;
		if (appData) {
			imgPath = imgPath.replace('%APPDATA%', appData);
		}
	} else if (platform === 'linux') {
		imgPath = imgPath.replace('~', process.env.HOME as string);
		console.log('l');
	} else if (platform === 'darwin') {
		imgPath = imgPath.replace('~', '/Users/' + process.env.USER);
	}
}

// Internals
// =========
const isProduction = process.env.NODE_ENV !== 'development';

// Dynamic Renderer
// ================
export default function (mainWindow: BrowserWindow) {
	console.log('isProduction', isProduction);

	const port = getServerPort();

	if (!isProduction) {
		const app = express();
		app.use(
			cors({
				origin: 'http://localhost:3000',
			})
		);
		app.use('/images', serveStatic(imgPath));
		app.use('/tts', serveStatic(imgPath.replace('images', 'tts')));
		app.use(llamaCppRouter);
		app.use(sdRouter);

		app.listen(port, 'localhost', () => {
			console.log('Dev Express Server Listening on', port);
			mainWindow.loadURL(`http://localhost:3000`);
		});
		return;
	}

	const app = express();
	app.use('/', serveStatic(path.join(__dirname, '../public')));
	app.use('/images', serveStatic(imgPath));
	app.use('/tts', serveStatic(imgPath.replace('images', 'tts')));

	app.use(llamaCppRouter);
	app.use(sdRouter);

	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, '../public', 'index.html')); // replace with the path to your SPA's entry point
	});

	app.listen(port, 'localhost', () => {
		console.log('Dynamic-Renderer Listening on', port);
		mainWindow.loadURL(`http://localhost:${port}`);
	});
}
