import { execFile, spawn } from 'child_process';
import OpenAI from 'openai';
import { findBinaryPath } from '../fs';
import fs from 'fs-extra';
import { BrowserWindow, ipcMain } from 'electron';
import { startGenerating, stopGenerating, updateProgress } from '../sd-state';
import { AppSettings } from '../AppSettings';

// @/lib/api/types-api
interface SDOptions {
	model: string;
	pos: string;
	output: string;
	neg?: string;
	size?: number;
}

function removeAccents(input: string): string {
	return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function runOpenai(
	model: 'dall-e-2' | 'dall-e-3',
	prompt: string,
	output: string
) {
	return new Promise(async (resolve, reject) => {
		const apiKey = (await AppSettings.get('external_api_key')) as string;
		const baseURL = 'https://api.openai.com/v1';
		const openai = new OpenAI({
			apiKey,
			baseURL,
		});

		const size = '1024x1024';
		const quality = 'standard';
		const n = 1;

		try {
			console.log('Running OpenAI:', model, prompt, output);
			const response = await openai.images.generate({
				model,
				prompt,
				size,
				quality,
				n,
			});
			const image_url = response.data[0].url;

			if (!image_url) {
				reject('No image URL found');
				return;
			}


			const image = await fetch(image_url);
			const buffer = await image.arrayBuffer();
			await fs.writeFile(output, Buffer.from(buffer));

			resolve(output);
		} catch (error) {
			console.error('OpenAI error:', error);
			reject(error);
		}
	});
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
			removeAccents(pos),
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
			args.push('-n', removeAccents(neg));
		}

		console.log('SD Path:', sdPath);
		console.log('Running SD:', args);
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
			console.log('SD stdout:', str);
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
		console.log('[-] MODULE::SD Running');

		const isExternal =
			(await AppSettings.get('selected_provider_image')) === 'external';
		const apiKey = (await AppSettings.get('external_api_key')) as string;
		if (isExternal && apiKey) {
			return await runOpenai(
				(await AppSettings.get('selected_model_image')) as 'dall-e-2' | 'dall-e-3',
				options.pos,
				options.output
			);
		}

		return await runSD(
			options.model,
			options.pos,
			options.output,
			options.neg,
			options.size
		);
	});
}
