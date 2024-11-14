import * as config from '../config';
import type { Provider } from './types';

export function getProviderKey(provider: Provider) {
	const cfg = config.get();
	if (provider === 'openai') {
		return cfg.openai_api_key;
	}
	if (provider === 'togetherai') {
		return cfg.togetherai_api_key;
	}
	if (provider === 'aimlapi') {
		return cfg.aimlapi_api_key;
	}
	if (provider === 'elevenlabs') {
		return cfg.elevenlabs_api_key;
	}
	if (provider === 'deepinfra') {
		return cfg.deepinfra_api_key;
	}
	throw new Error(`Unknown provider: ${provider}`);
}
