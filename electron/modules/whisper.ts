import { execFile } from 'child_process';
import OpenAI from 'openai';
import { findBinaryPath } from '../fs';
import fs from 'fs-extra';
import { BrowserWindow, ipcMain } from 'electron';
import { startGenerating, stopGenerating, updateProgress } from '../sd-state';
import { AppSettings } from '../AppSettings';
import log from 'electron-log/main';
import stream from 'stream';
import ffmpegStatic from 'ffmpeg-static';

// @/lib/api/types-api
interface WhisperOptions {
	model: string;
	input: Buffer;
}

function runFfmpeg(input: string, output: string) {
	return new Promise((resolve, reject) => {
		if (!ffmpegStatic) {
			throw new Error('ffmpeg-static not found');
		}

		console.log('ffmpegStatic:', ffmpegStatic);
		const ffmpeg = execFile(
			ffmpegStatic,
			['-i', input, '-ac', '1', '-ar', '16000', output, '-y'],
			{ shell: false },
			(error, stdout, stderr) => {
				if (error) {
					log.error(`FFMPEG Error: ${error.message}`);
					reject(error);
				} else {
					console.log(stdout);
					console.log(stderr);
					console.log('resolved');
					resolve('');
				}
			}
		);

		ffmpeg.on('exit', (code, signal) => {
			if (code) log.info(`FFMPEG Process exited with code: ${code}`);
			if (signal) log.info(`FFMPEG Process killed with signal: ${signal}`);
			resolve('');
		});

		ffmpeg.on('error', (error) => {
			log.error(`FFMPEG Error: ${error.message}`);
			reject(error);
		});

		ffmpeg.stdout?.on('data', (data: any) => {
			const str = data.toString();
			console.log('ffmpeg stdout:', str);
		});
	});
}

interface TranscriptChunk {
	timestamps: {
		from: string;
		to: string;
	};
	offsets: {
		from: number;
		to: number;
	};
	text: string;
}

function combineTranscriptChunks(chunks: TranscriptChunk[]) {
	let transcript = '';
	for (const chunk of chunks) {
		transcript += chunk.text;
	}

	return transcript;
}

async function runWhisper(model: string, input: ArrayBuffer) {
	const whisperPath = await findBinaryPath('whisper.cpp', 'main');
	return new Promise(async (resolve, reject) => {
		// save input to a file
		const inputName = 'C:/Users/User/Code/GitHub/BuddyGenAI/input.webm';
		const outputName = 'C:/Users/User/Code/GitHub/BuddyGenAI/input.wav';
		await fs.writeFile(inputName, input);
		await runFfmpeg(inputName, outputName);

		const args = [
			'--model',
			model,
			'--output-json',
			'--output-file',
			'result',
			'--file',
			outputName,
		];

		log.info('Whisper Path:', whisperPath);
		log.info('Running Whisper:', args);
		const command = execFile(whisperPath, args, (error, stdout, stderr) => {
			if (error) {
				log.error(`Whisper Error: ${error.message}`);
				reject(error);
			} else {
				// console.log(stdout);
				console.log(stderr);

				const result = fs.readFileSync('result.json');
				const json = JSON.parse(result.toString());
				resolve(combineTranscriptChunks(json['transcription']));
			}
		});

		command.on('error', (error) => {
			log.error(`Whisper Error: ${error.message}`);
			reject(error);
		});

		command.on('exit', (code, signal) => {
			if (code) log.info(`Whisper Process exited with code: ${code}`);
			if (signal) log.info(`Whisper Process killed with signal: ${signal}`);

			const result = fs.readFileSync('result.json');
			const json = JSON.parse(result.toString());
			resolve(combineTranscriptChunks(json['transcription']));
		});

		// command.stdout?.on('data', (data: any) => {
		// 	const str = data.toString();
		// 	console.log('Whisper stdout:', str);
		// });

		process.on('exit', () => {
			command.kill();
			resolve(outputName);
		});
	});
}

export default function whisperModule(mainWindow: BrowserWindow) {
	log.log('[-] MODULE::Whisper Initializing');

	ipcMain.handle('whisper/run', async (_, options: WhisperOptions) => {
		log.log('[-] MODULE::Whisper Running');

		return await runWhisper(options.model, options.input);
	});
}
