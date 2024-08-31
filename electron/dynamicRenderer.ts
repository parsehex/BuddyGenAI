// This is the dynamic renderer script for Electron.
// You can implement your custom renderer process configuration etc. here!
// --------------------------------------------
import * as path from 'path';
import cors from 'cors';
import { BrowserWindow } from 'electron';
import express, { static as serveStatic } from 'express';
import { getDataPath } from './fs';
import llamaCppRouter from './routes/message';
import sdRouter from './routes/sd';
import { getServerPort } from './rand';

const imgPath = getDataPath('images');

// Internals
// =========
const isProduction = process.env.NODE_ENV !== 'development';

// Dynamic Renderer
// ================
export default function (mainWindow: BrowserWindow) {
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
