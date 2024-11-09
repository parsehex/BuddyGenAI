// https://github.com/ggerganov/llama.cpp/releases
// https://github.com/ggerganov/whisper.cpp/releases
// https://github.com/leejet/stable-diffusion.cpp/releases
// https://github.com/rhasspy/piper/releases

// following is mostly for notes right now -- not sure how to integrate this into the build process yet
// should provide some guidance what bins are needed for each platform
const osDownloadMap = {
	windows: {
		'llama.cpp': [
			// if using cuda, can use 11 instead of 12 for below lines
			'cudart-llama-bin-win-cu12*-x64.zip', // if using cuda

			// choose one:
			// 'llama-*-bin-win-*-x64.zip', // to include all backends
			// 'llama-*-bin-win-cuda-cu12*-x64.zip', // for cuda12
		],
		'whisper.cpp': ['whisper-bin-x64.zip', 'whisper-cublas-12*-bin-x64.zip'],
		'stable-diffusion.cpp': ['sd-master-*-bin-win-*-x64.zip'], // includes avx, cuda, etc.
		piper: ['piper_windows_amd64.zip'],
	},
	linux: {
		// TODO
		'llama.cpp': [],
		'whisper.cpp': [],
		'stable-diffusion.cpp': [],
		piper: ['piper_linux_x86_64.tar.gz'],
	},
	macos: {
		// TODO
		'llama.cpp': [],
		'whisper.cpp': [],
		'stable-diffusion.cpp': [],
		piper: ['piper_macos_x64.tar.gz'],
	},
};

const repos = [
	'ggerganov/llama.cpp',
	'ggerganov/whisper.cpp',
	'leejet/stable-diffusion.cpp',
	'rhasspy/piper',
];

const os = 'windows'; // 'linux' | 'macos' | 'windows'
const arch = 'x64'; // 'x64' | 'arm64'

const platformsToDownload = {
	'llama.cpp': [],
	'whisper.cpp': [],
	'stable-diffusion.cpp': [],
	piper: [],
};

// use gh api to get latest release
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const download = async (url, dest) => {
	const writer = fs.createWriteStream(dest);
	const response = await axios({
		url,
		method: 'GET',
		responseType: 'stream',
	});
	response.data.pipe(writer);
	return new Promise((resolve, reject) => {
		writer.on('finish', resolve);
		writer.on('error', reject);
	});
};

const getLatestRelease = async (repo) => {
	const url = `https://api.github.com/repos/${repo}/releases/latest`;
	const response = await axios.get(url);
	return response.data;
};

(async () => {
	for (const repo of repos) {
		const release = await getLatestRelease(repo);
		console.log(`Latest release for ${repo}: ${release.tag_name}`);
		// const platform = process.platform === 'win32' ? 'windows' : process.platform;
		// const asset = release.assets.find((asset) => asset.name.includes(platform));
		// if (!asset) {
		// 	console.error(`No asset found for ${repo} on ${platform}`);
		// 	continue;
		// }
		// const url = asset.browser_download_url;
		// const dest = path.join(__dirname, 'binaries', path.basename(url));
		// console.log(`Downloading ${url} to ${dest}`);
		// await download(url, dest);
	}
})();
