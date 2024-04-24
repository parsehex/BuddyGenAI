import { exec } from 'child_process';
import { findBinaryPath } from '../fs';
import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';

const QUIET = false;
const commandObj = {
	cmd: null as any,
};

// by default, llamacpp uses template embedded in gguf if availabe
// TODO any way to get this from the model?
const chatTemplateMap: { [key: string]: string } = {
	Moistral: 'vicuna',
	'WizardLM-2': 'vicuna',
};

function startServer(model: string) {
	return new Promise<void>(async (resolve, reject) => {
		// normalize model path  for cross platform
		model = path.normalize(model);
		console.log('model', model);
		const serverPath = await findBinaryPath('llama.cpp', 'server');
		// console.log('binPath', serverPath);
		const stdio = QUIET ? 'pipe' : 'inherit';
		const args = ['--model', model, '--n-gpu-layers', '35', '-c', '4096'];

		const chatTemplate = Object.keys(chatTemplateMap).find((key) =>
			model.includes(key)
		);
		if (chatTemplate) {
			args.push('--chat-template', chatTemplateMap[chatTemplate]);
			console.log('Using chat template:', chatTemplateMap[chatTemplate]);
		}

		console.log('Starting Llama.cpp-Server', args);
		commandObj.cmd = exec(`"${serverPath}" ${args.join(' ')}`);

		console.log('forked');

		commandObj.cmd.on('error', (error: any) => {
			console.error(`Llama.cpp-Server Error: ${error.message}`);
			if (reject) reject();
		});

		commandObj.cmd.on('exit', (code: any, signal: any) => {
			if (code) console.log(`Llama.cpp-Server exited with code: ${code}`);
			if (signal) console.log(`Llama.cpp-Server killed with signal: ${signal}`);
		});

		process.on('exit', () => {
			commandObj.cmd.kill();
		});

		if (QUIET) {
			commandObj.cmd.stdout.on('data', (data: any) => {
				const str = data.toString();
				if (str?.includes('all slots are idle')) {
					console.log('Llama.cpp-Server ready');
					resolve();
				}
			});
		} else {
			resolve();
		}
	});
}

async function stopServer() {
	if (commandObj.cmd) {
		commandObj.cmd.kill();
		commandObj.cmd = null;
	}
}

async function isServerRunning() {
	return commandObj.cmd !== null;
}

export default function llamaCppModule(mainWindow: BrowserWindow) {
	console.log('[-] MODULE::llamacpp Initializing');

	ipcMain.handle('llamacpp/start', async (_, modelPath: string) => {
		await startServer(modelPath);
		return { message: 'Server started' };
	});

	ipcMain.handle('llamacpp/stop', async () => {
		await stopServer();
		return { message: 'Server stopped' };
	});

	ipcMain.handle('llamacpp/status', async () => {
		return { isRunning: await isServerRunning() };
	});
}
