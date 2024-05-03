import { execFile, spawn } from 'child_process';
import { findBinaryPath } from '../fs';
import { BrowserWindow, ipcMain } from 'electron';
import { startGenerating, stopGenerating, updateProgress } from '../sd-state';

// @/lib/api/types-api
interface SDOptions {
	model: string;
	pos: string;
	output: string;
	neg?: string;
	size?: number;
}

let hasResolved = false;

async function runSD(
	model: string,
	pos: string,
	output: string,
	neg?: string,
	size = 256
) {
	const sdPath = await findBinaryPath('stable-diffusion.cpp', 'sd');
	return new Promise((resolve, reject) => {
		const args = [
			'-m',
			model,
			'-p',
			pos,
			'-o',
			output,
			'--seed',
			'-1',
			'-H',
			`${size}`,
			'-W',
			`${size}`,
		];
		if (neg) {
			args.push('-n', neg);
		}
		startGenerating();
		const command = execFile(sdPath, args, { shell: false });

		command.on('error', (error) => {
			console.error(`SD Error: ${error.message}`);
			hasResolved = true;
			stopGenerating();
			reject(error);
		});

		command.on('exit', (code, signal) => {
			if (code) console.log(`SD Process exited with code: ${code}`);
			if (signal) console.log(`SD Process killed with signal: ${signal}`);
			hasResolved = true;
			stopGenerating();
			resolve(output);
		});

		command.stdout?.on('data', (data: any) => {
			const str = data.toString();
			let isProgressLine = false;
			isProgressLine = str.match(/(\d+\/\d+)/) !== null;
			if (isProgressLine) {
				const cur = str.match(/(\d+)\/\d+/);
				const total = str.match(/\d+\/(\d+)/);
				const isNotValid = cur[1] === total[1];
				if (!isNotValid && cur && total) {
					const progress = +cur[1] / +total[1];
					updateProgress(progress);
				}
			}
		});

		process.on('exit', () => {
			command.kill();
			hasResolved = true;
			stopGenerating();
			resolve(output);
		});
	});
}

export default function sdModule(mainWindow: BrowserWindow) {
	console.log('[-] MODULE::SD Initializing');

	ipcMain.handle('SD/run', async (_, options: SDOptions) => {
		console.log('[-] MODULE::SD Running - new');
		return await runSD(
			options.model,
			options.pos,
			options.output,
			options.neg,
			options.size
		);
	});
}
