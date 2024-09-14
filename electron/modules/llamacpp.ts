import { execFile, ChildProcess } from 'child_process';
import { findBinaryPath } from '../fs';
import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { updateModel } from '../routes/message';
import log from 'electron-log/main';
import { AppSettings } from '../AppSettings';
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

function startServer(modelPath: string, nGpuLayers = 99) {
	return new Promise<void>(async (resolve, reject) => {
		const port = getLlamaCppPort();
		const apiKey = getLlamaCppApiKey();
		log.log('using port:', port, 'and api key:', apiKey);

		modelPath = path.normalize(modelPath);
		try {
			await fs.access(modelPath);
		} catch (e) {
			log.error('Model file not found:', modelPath);
			reject();
			return;
		}

		const useGpu = (await AppSettings.get('gpu_enabled_chat')) as 0 | 1;
		// @ts-ignore
		const useGpuBool = useGpu === 1 || useGpu === '1.0';

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
		if (chatTemplate) {
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

		commandObj.cmd.stdout?.on('data', (data: any) => {
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

	ipcMain.handle(
		'llamacpp/start',
		async (_, modelPath: string, nGpuLayers: number) => {
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
