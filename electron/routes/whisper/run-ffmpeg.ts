import { execFile } from 'child_process';
import log from 'electron-log/main';
import ffmpegStatic from 'ffmpeg-static';

export function runFfmpeg(input: string, output: string) {
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
