import { execFile, spawn } from 'child_process';
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

async function runSD(model: string, pos: string, output: string, neg?: string) {
	const sdPath = await findBinaryPath('stable-diffusion.cpp', 'sd');
	return new Promise((resolve, reject) => {
		const args = ['-m', model, '-p', pos, '-o', output, '--seed', '-1'];
		if (neg) {
			args.push('-n', neg);
		}
		const command = execFile(sdPath, args, { shell: false });

		command.on('error', (error) => {
			console.error(`Error: ${error.message}`);
			reject(error);
		});

		command.on('exit', (code, signal) => {
			if (code) console.log(`Process exited with code: ${code}`);
			if (signal) console.log(`Process killed with signal: ${signal}`);
			resolve(output);
		});

		// Prevent the script from exiting until the child process exits
		process.on('exit', () => {
			command.kill();
			resolve(output);
		});
	});
}

export default function sdModule(mainWindow: BrowserWindow) {
	console.log('[-] MODULE::SD Initializing');

	ipcMain.handle(
		'SD/run',
		async (_, model: string, pos: string, output: string, neg?: string) => {
			console.log('[-] MODULE::SD Running');
			return runSD(model, pos, output, neg);
		}
	);
}
