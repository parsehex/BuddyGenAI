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
import { getLlamaCppPort, getLlamaCppApiKey } from '../rand';

const apiKey = getLlamaCppApiKey();
const openai = new OpenAI({
	apiKey: apiKey
});

const port = getLlamaCppPort();
	const url = `http://localhost:${port}/v1`;

	openai.baseURL = url;

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

		const ffmpeg = execFile(
			ffmpegStatic,
			['-i', input, '-ac', '1', '-ar', '16000', output, '-y'],
			{ shell: false },
			(error, stdout, stderr) => {
				if (error) {
					log.error(`FFMPEG Error: ${error.message}`);
					reject(error);
				} else {
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

		// ffmpeg.stdout?.on('data', (data: any) => {
		// 	const str = data.toString();
		// 	console.log('ffmpeg stdout:', str);
		// });
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
	const platform: 'darwin' | 'win32' | 'linux' = process.platform as any;
	// if platform is linux, call kobold api instead

	if (platform === 'linux') {
		const inputName = 'C:/Users/User/Code/GitHub/BuddyGenAI/input.webm';
		const outputName = 'C:/Users/User/Code/GitHub/BuddyGenAI/input.wav';
		await fs.writeFile(inputName, input);
		await runFfmpeg(inputName, outputName);

		const transcription = await openai.audio.transcriptions.create({
			file: fs.createReadStream(outputName),
			model: "whisper-1",
			response_format: "text",
		});

		return transcription.text;
	}

	const useGpu = (await AppSettings.get('gpu_enabled_whisper')) as 0 | 1;
	// @ts-ignore
	const useGpuBool = useGpu === 1 || useGpu === '1.0';
	const whisperPath = await findBinaryPath('whisper.cpp', 'main', useGpuBool);

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
		const command = execFile(whisperPath, args);
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
