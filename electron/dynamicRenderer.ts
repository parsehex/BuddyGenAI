// This is the dynamic renderer script for Electron.
// You can implement your custom renderer process configuration etc. here!
// --------------------------------------------
import * as path from 'path';
import * as fs from 'fs-extra';
import cors from 'cors';
import { BrowserWindow } from 'electron';
import express, { static as serveStatic } from 'express';
import { getDataPath } from './fs';
import chatRouter from './routes/chat';
import imgRouter from './routes/img';
import ttsRouter from './routes/tts';
import whisperRouter from './routes/whisper';
import { getServerPort } from './rand';
import * as config from './config';

const imgPath = getDataPath('images');

// Internals
// =========
const isProduction = process.env.NODE_ENV !== 'development';

// TODO add menu item to open settings
// TODO add api key middleware + add ipc func to get key

// Dynamic Renderer
// ================
export default async function (mainWindow: BrowserWindow) {
	const port = getServerPort();

	const configExists = await config.exists();
	if (!configExists) {
		console.log('config does not exist, creating default');
	}
	await config.init();
	await config.load();

	if (!isProduction) {
		const app = express();
		app.use(
			cors({
				origin: 'http://localhost:3000',
			})
		);
		app.use('/images', serveStatic(imgPath));
		app.use('/tts', serveStatic(imgPath.replace('images', 'tts')));
		app.use(chatRouter);
		app.use(imgRouter);
		app.use(ttsRouter);
		app.use(whisperRouter);

		// if doesnt exist, serve settings.html on *
		// if (!configExists) {
		// 	// ls the public folder
		// 	const publicPath = path.resolve(__dirname, '../../public');
		// 	const files = await fs.readdir(publicPath);
		// 	console.log(files);
		// 	app.get('*', (req, res) => {
		// 		const page = req.url.split('/')[1];
		// 		// res.sendFile(path.resolve(__dirname, '../../public', 'settings.html'));
		// 		// / should serve settings.html
		// 		// anything else should serve the requested page

		// 		if (page === '') {
		// 			// index
		// 			res.sendFile(path.resolve(__dirname, '../../public', 'settings.html'));
		// 		} else {
		// 			// other paths
		// 			res.sendFile(path.resolve(__dirname, '../../public', page));
		// 		}
		// 	});
		// }

		app.listen(port, 'localhost', () => {
			console.log('Dev Express Server Listening on', port);

			// if doesnt exist, load settings page instead
			// mainWindow.loadURL(`http://localhost:3000`);

			if (!configExists) {
				mainWindow.loadURL(`http://localhost:3000/settings.html`);
			} else {
				mainWindow.loadURL(`http://localhost:3000`);
			}
		});
		return;
	}

	const app = express();
	app.use('/', serveStatic(path.join(__dirname, '../public')));
	app.use('/images', serveStatic(imgPath));
	app.use('/tts', serveStatic(imgPath.replace('images', 'tts')));

	app.use(chatRouter);
	app.use(imgRouter);
	app.use(ttsRouter);
	app.use(whisperRouter);

	app.get('*', (req, res) => {
		// if (!configExists) {
		// 	res.sendFile(path.resolve(__dirname, '../public', 'settings.html'));
		// } else {
		res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
		// }
	});

	app.listen(port, 'localhost', () => {
		console.log('Dynamic-Renderer Listening on', port);
		mainWindow.loadURL(`http://localhost:${port}`);
	});
}
