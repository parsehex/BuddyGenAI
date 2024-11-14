import { execFile, type ChildProcess } from 'child_process';
import { findBinaryPath, getDataPath } from '../fs';
import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { updateModel } from '../routes/chat';
import log from 'electron-log/main';
import * as config from '../config';
import { getLlamaCppApiKey, getLlamaCppPort, getServerPort } from '../rand';
import { chatTemplateMap, contextLengthMap } from '../LCPP-const';

const commandObj = {
	cmd: null as ChildProcess | null,
};

let lastModel = '';
let pid = 0;
let hasResolved = false;

// TODO i think error 3221225781 means dll not found
// error 35504 is bad args?

let isReady = false;

async function verifyModel(modelPath: string) {
	modelPath = path.normalize(modelPath);
	try {
		await fs.access(modelPath);
		return true;
	} catch (e) {
		log.error('Model file not found:', modelPath);
		return false;
	}
}

function startKobold(
	chatModelPath: string,
	sdModel: string,
	whisperModel = '',
	nGpuLayers = 99
) {
	return new Promise<void>(async (resolve, reject) => {
		const port = getLlamaCppPort();
		const apiKey = getLlamaCppApiKey();
		log.log('using port:', port, 'and api key:', apiKey);

		const sdModelPath = getDataPath('Models/' + sdModel);
		const whisperModelPath = getDataPath('Models/' + whisperModel);

		console.log(chatModelPath, sdModel, whisperModel);

		if ((await verifyModel(chatModelPath)) === false) return reject();
		if ((await verifyModel(sdModelPath)) === false) return reject();
		if (
			whisperModel &&
			whisperModel !== '0' &&
			(await verifyModel(whisperModelPath)) === false
		)
			return reject();

		const koboldcppPath = await findBinaryPath('koboldcpp', 'koboldcpp', true);
		const args = [
			'--port',
			port + '',
			'--model',
			chatModelPath,
			'--gpulayers',
			'-1',
			'--sdmodel',
			sdModelPath,
			'--usevulkan',
		];

		//
		console.log(whisperModel);
		if (whisperModel && whisperModel !== '0') {
			args.push('--whispermodel', whisperModelPath);
		}

		// TODO --password

		log.info('Koboldcpp Server Path:', koboldcppPath);
		log.info('Starting Koboldcpp Server with args:', args);
		// NOTE do not use shell: true -- keeps server running as zombie
		commandObj.cmd = execFile(
			koboldcppPath,
			args,
			{
				windowsHide: true,
				killSignal: 'SIGKILL',
			},
			(e, stdout) => {
				console.log('cb');
			}
		);

		pid = commandObj.cmd.pid || 0;
		commandObj.cmd.stdin?.end();
		updateModel(chatModelPath);

		commandObj.cmd.stdout?.on('data', (data: any) => {
			const str = data.toString() as string;
			console.log('SD stdout:', str);
			let isFinishLine = false;
			isFinishLine = str.includes('Please connect to custom endpoint at');
			if (isFinishLine) {
				console.log('resolving');
				isReady = true;
				resolve();
			}
		});
	});
}

async function startServer(modelPath: string, nGpuLayers = 99) {
	const cfg = config.get();
	const sdModel = cfg.selected_model_image;
	const whisperModel = cfg.selected_model_whisper;

	// TODO use providers

	return new Promise<void>(async (resolve, reject) => {
		const port = getLlamaCppPort();
		const apiKey = getLlamaCppApiKey();
		log.log('using port:', port, 'and api key:', apiKey);

		if ((await verifyModel(modelPath)) === false) return reject();

		const useGpuBool = cfg.gpu_enabled_chat;
		const llamaCppPath = await findBinaryPath('llama.cpp', 'server', useGpuBool);
		const args = ['--port', port + '', '--model', modelPath];

		if (useGpuBool) {
			nGpuLayers = Math.floor(+nGpuLayers);
			args.push('--n-gpu-layers', nGpuLayers + '');
		}

		if (apiKey) {
			args.push('--api-key', apiKey);
		}

		const chatTemplate = Object.keys(chatTemplateMap).find((key) =>
			modelPath.includes(key)
		);
		if (chatTemplate && chatTemplateMap[chatTemplate]) {
			args.push('--chat-template', chatTemplateMap[chatTemplate]);
			log.info('Using chat template:', chatTemplateMap[chatTemplate]);
		}

		const contextLength = Object.keys(contextLengthMap).find((key) =>
			modelPath.includes(key)
		);
		if (contextLength && contextLengthMap[contextLength]) {
			args.push('-c', contextLengthMap[contextLength] + '');
			log.info('Using context length:', contextLengthMap[contextLength]);
		} else {
			args.push('-c', '4096');
			log.info('Using default context length:', 4096);
		}

		log.info('Llama.cpp Server Path:', llamaCppPath, `(GPU: ${useGpuBool})`);
		log.info('Starting Llama.cpp Server with args:', args);
		// NOTE do not use shell: true -- keeps server running as zombie
		commandObj.cmd = execFile(llamaCppPath, args, {
			windowsHide: true,
			killSignal: 'SIGKILL',
		});
		pid = commandObj.cmd.pid || 0;
		commandObj.cmd.stdin?.end();
		updateModel(modelPath);

		commandObj.cmd.on('error', (error: any) => {
			log.error(`Llama.cpp-Server Error: ${error.message}`);
			if (reject) {
				hasResolved = false;
				isReady = false;
				reject();
			}
		});

		commandObj.cmd.on('exit', (code: any, signal: any) => {
			if (code) {
				log.warn(`Llama.cpp-Server exited with code: ${code}`);
			}
			if (signal) {
				log.warn(`Llama.cpp-Server killed with signal: ${signal}`);
			}
			isReady = false;
		});

		process.stdin.resume(); // so the program will not close instantly

		async function exitHandler(options: any, exitCode: any) {
			// TODO clean up all the onReadys
			isReady = false;
			await stopServer();
			if (options.cleanup) console.log('clean');
			if (exitCode || exitCode === 0) console.log(exitCode);
			if (options.exit) process.exit();
		}

		process.on('exit', exitHandler.bind(null, { cleanup: true }));
		process.on('SIGINT', exitHandler.bind(null, { exit: true }));
		process.on('SIGTERM', exitHandler.bind(null, { exit: true }));
		process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
		process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
		process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

		// check if server is ready on stdout and stderr
		commandObj.cmd.stdout?.on('data', (data: any) => {
			const str = data.toString();
			if (!hasResolved && str?.includes('all slots are idle')) {
				log.info('Llama.cpp-Server ready');
				hasResolved = true;
				isReady = true;
				resolve();
			}
		});
		commandObj.cmd.stderr?.on('data', (data: any) => {
			const str = data.toString();
			if (!hasResolved && str?.includes('all slots are idle')) {
				log.info('Llama.cpp-Server ready');
				hasResolved = true;
				isReady = true;
				resolve();
			}
		});
	});
}

async function stopServer() {
	if (pid) {
		log.info('stopping llama.cpp server', pid);
		process.kill(pid);
		commandObj.cmd = null;
		pid = 0;
		updateModel(''); // reset model
	}
}

async function isServerRunning() {
	return isReady;
}

export default function llamaCppModule(mainWindow: BrowserWindow) {
	log.info('[-] MODULE::llamacpp Initializing');

	const cfg = config.get();

	ipcMain.handle(
		'llamacpp/start',
		async (_, modelPath: string, nGpuLayers: number) => {
			if (cfg.selected_provider_chat !== 'local') {
				return { message: 'Provider is not local', error: false };
			}
			if (!cfg.selected_model_chat || !modelPath) {
				return { message: 'No chat model selected', error: true };
			}
			if (await isServerRunning()) {
				return { message: 'Server already running', error: false };
			}
			lastModel = modelPath;
			try {
				await startServer(modelPath, nGpuLayers);
				return { message: 'Server started', error: false };
			} catch (e) {
				return { message: 'Server failed to start', error: true };
			}
		}
	);

	ipcMain.handle('llamacpp/stop', async () => {
		await stopServer();
		return { message: 'Server stopped' };
	});

	ipcMain.handle('llamacpp/status', async () => {
		return { isRunning: await isServerRunning() };
	});

	ipcMain.handle('llamacpp/lastModel', async () => {
		return { lastModel };
	});

	ipcMain.handle('llamacpp/baseUrl', async () => {
		return 'http://localhost:' + getLlamaCppPort();
	});

	ipcMain.handle('llamacpp/serverUrl', async () => {
		return 'http://localhost:' + getServerPort();
	});
}
