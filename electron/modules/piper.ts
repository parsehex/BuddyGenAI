import { execFile } from 'child_process';
import OpenAI from 'openai';
import { findBinaryPath } from '../fs';
import fs from 'fs-extra';
import { BrowserWindow, ipcMain } from 'electron';
import { startGenerating, stopGenerating, updateProgress } from '../sd-state';
import { AppSettings } from '../AppSettings';
import log from 'electron-log/main';
import stream from 'stream';

// @/lib/api/types-api
interface PiperOptions {
	model: string;
	output: string;
	text: string;
}

async function runPiper(model: string, output: string, text: string) {
	const piperPath = await findBinaryPath('piper', 'piper');
	return new Promise((resolve, reject) => {
		// echo "Test" | .\piper.exe --model .\model.onnx --output_file ./out.wav
		const args = [
			'--model',
			model,
			'--output_file',
			output,
			'--sentence_silence',
			'0.3',
		];

		log.info('Piper Path:', piperPath);
		log.info('Running Piper:', args);
		const command = execFile(piperPath, args, (error, stdout, stderr) => {
			if (error) {
				log.error(`Piper Error: ${error.message}`);
				reject(error);
			} else {
				console.log(stdout);
				console.log(stderr);
			}
		});

		const input = text;

		var stdinStream = new stream.Readable();
		stdinStream.push(input); // Add data to the internal queue for users of the stream to consume
		stdinStream.push(null); // Signals the end of the stream (EOF)
		stdinStream.pipe(command.stdin as any);

		command.on('error', (error) => {
			log.error(`Piper Error: ${error.message}`);
			reject(error);
		});

		command.on('exit', (code, signal) => {
			if (code) log.info(`Piper Process exited with code: ${code}`);
			if (signal) log.info(`Piper Process killed with signal: ${signal}`);
			resolve(output);
		});

		command.stdout?.on('data', (data: any) => {
			const str = data.toString();
			console.log('Piper stdout:', str);
		});

		process.on('exit', () => {
			command.kill();
			resolve(output);
		});
	});
}

export default function piperModule(mainWindow: BrowserWindow) {
	log.log('[-] MODULE::Piper Initializing');

	ipcMain.handle('piper/run', async (_, options: PiperOptions) => {
		log.log('[-] MODULE::Piper Running');

		return await runPiper(options.model, options.output, options.text);
	});
}
