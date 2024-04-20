import { fork } from 'child_process';
import { findBinaryPath } from '@/lib/fs';

const QUIET = true;
const commandObj = {
	cmd: null as any,
};

// by default, llamacpp uses template embedded in gguf if availabe
// TODO any way to get this from the model?
const chatTemplateMap: { [key: string]: string } = {
	Moistral: 'vicuna',
	'WizardLM-2': 'vicuna',
};

export function startServer(model: string) {
	return new Promise<void>(async (resolve, reject) => {
		const serverPath = await findBinaryPath('llama.cpp', 'server');
		const stdio = QUIET ? 'pipe' : 'inherit';
		const args = ['--model', model, '--n-gpu-layers', '35', '-c', '4096'];

		const chatTemplate = Object.keys(chatTemplateMap).find((key) =>
			model.includes(key)
		);
		if (chatTemplate) {
			args.push('--chat-template', chatTemplateMap[chatTemplate]);
			console.log('Using chat template:', chatTemplateMap[chatTemplate]);
		}

		commandObj.cmd = fork(serverPath, args, { stdio });

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
				if (str.includes('all slots are idle')) {
					console.log('Llama.cpp-Server ready');
					resolve();
				}
			});
		} else {
			resolve();
		}
	});
}

export async function stopServer() {
	if (commandObj.cmd) {
		commandObj.cmd.kill();
		commandObj.cmd = null;
	}
}

export async function isServerRunning() {
	return commandObj.cmd !== null;
}
