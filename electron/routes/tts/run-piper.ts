import { execFile } from 'child_process';
import { findBinaryPath } from '../../fs';
import log from 'electron-log/main';
import stream from 'stream';

export async function runPiper(
	model: string,
	output: string,
	text: string
): Promise<string> {
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
		const command = execFile(piperPath, args);
		const input = text;

		var stdinStream = new stream.Readable();
		stdinStream.push(input);
		stdinStream.push(null);
		stdinStream.pipe(command.stdin as any);

		command.on('error', (error) => {
			log.error(`Piper onError: ${error.message}`);
			reject(error);
		});

		command.on('exit', (code, signal) => {
			if (code) log.info(`Piper Process exited with code: ${code}`);
			if (signal) log.info(`Piper Process killed with signal: ${signal}`);
			resolve(output);
		});

		// command.stdout?.on('data', (data: any) => {
		// 	use if we want to track progress
		// });

		process.on('exit', () => {
			command.kill();
			resolve(output);
		});
	});
}
