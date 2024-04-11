import { spawn } from 'child_process';
import { findBinaryPath } from '../utils/binary-path';

// TODO how can we reuse the process for multiple images?
(async () => {
	const args = ['-m', '/media/user/ML/StabilityMatrix/Models/StableDiffusion/realisticVisionV60B1_v51VAE.safetensors', '-p', 'a swirling galaxy in a bottle'];
	const sdPath = await findBinaryPath('stable-diffusion.cpp', 'sd');

	const command = spawn(sdPath, args, { stdio: 'inherit' });

	command.on('error', (error) => {
		console.error(`Error: ${error.message}`);
	});

	command.on('exit', (code, signal) => {
		if (code) console.log(`Process exited with code: ${code}`);
		if (signal) console.log(`Process killed with signal: ${signal}`);
	});

	// Prevent the script from exiting until the child process exits
	process.on('exit', () => {
		command.kill();
	});
})();
