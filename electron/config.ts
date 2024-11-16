// a config.json will be used in the app's data directory to store user settings
// if that file doesn't exist, open settings launcher on first run

// Providers to support:
// - local: only cuda on windows
//TODO: - localai (chat, image, tts, whisper)
// - openai (chat, image, tts, whisper)
// - togetherai (chat, image)
// - aimlapi (chat, image, whisper)
//   has free + $20/mo tiers
// - elevenlabs (tts)
// - deepinfra (chat, image, tts, whisper)

const SettingsDefaults = {
	local_model_directory: '',

	// local, (providers above ^), or disabled?
	selected_provider_chat: 'disabled',
	selected_provider_image: 'disabled',
	selected_provider_tts: 'disabled',
	selected_provider_whisper: 'disabled',

	openai_api_key: '',
	togetherai_api_key: '',
	aimlapi_api_key: '',
	elevenlabs_api_key: '',
	deepinfra_api_key: '',

	// names or paths to models
	selected_model_chat: '',
	selected_model_image: '',
	selected_model_tts: '',
	selected_model_whisper: '',

	gpu_enabled_chat: true,
	gpu_enabled_image: true,
	gpu_enabled_whisper: true,

	n_gpu_layers: 99,
	auto_start_server: false,
};
// TODO idea: don't show 'local' provider option if not windows or cuda binary missing
//   can skip some checks elsewhere that way

// express server has routes for getting and setting settings
// can also have ipc composable

import * as fs from 'fs-extra';
import { getDataPath } from './fs';
import { ipcMain } from 'electron';
import { getProviderModels } from './providers/models';
import { ModelType } from './providers/types';
import { delay } from './utils';

let appSettings = { ...SettingsDefaults };

let configPath = '';

function configFilePath() {
	if (configPath) return configPath;
	const dataPath = getDataPath('config.json');
	configPath = dataPath;
	return dataPath;
}

/** Check if the config file exists and has all the required keys */
async function exists() {
	const doesExist = await fs.pathExists(configFilePath());
	if (!doesExist) return false;
	const data = fs.readFileSync(configFilePath(), 'utf-8');
	if (!data?.trim()) return false;
	const parsed = JSON.parse(data);
	const keys = Object.keys(SettingsDefaults);
	const parsedKeys = Object.keys(parsed);
	if (!parsedKeys.length || keys.length !== parsedKeys.length) return false;
	for (const key of keys) {
		if (!parsedKeys.includes(key)) return false;
	}
	return true;
}

async function load() {
	const filePath = configFilePath();
	if (await exists()) {
		const data = await fs.readJson(filePath);
		appSettings = data;
	}
}

// alright so the problem here is that the mlodel dir is being set to blank on the first save
async function init() {
	const filePath = configFilePath();
	if (!(await exists())) {
		await fs.writeJson(filePath, SettingsDefaults, { spaces: 2 });
	}

	if (!appSettings.local_model_directory) {
		const modelsPath = getDataPath('Models');
		await fs.mkdir(modelsPath, { recursive: true });
		appSettings.local_model_directory = modelsPath;
		console.log(appSettings);
		save();
	}

	ipcMain.emit('config:loaded', appSettings);
	ipcMain.handle('config:get', () => appSettings);
	ipcMain.handle('config:set', (_, newSettings: typeof SettingsDefaults) => {
		appSettings = { ...appSettings, ...newSettings };
		save();
		return appSettings;
	});

	// getProviderModels
	ipcMain.handle('getModels', async (_, type: ModelType) => {
		return getProviderModels(type);
	});

	await delay(100);
}
function get() {
	return appSettings;
}

const debounce = (func: (...args: any[]) => void, wait: number) => {
	let timeout: NodeJS.Timeout;
	return (...args: any[]) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
};

const saveDebounced = debounce(async () => {
	console.log(appSettings);
	await fs.writeJson(configFilePath(), appSettings, { spaces: 2 });
}, 250);

async function save() {
	await saveDebounced();
}
async function update(newSettings: Partial<typeof SettingsDefaults>) {
	appSettings = { ...appSettings, ...newSettings };
	await save();
}

export { init, load, get, update, exists, SettingsDefaults };
