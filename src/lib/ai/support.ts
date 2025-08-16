import { useAppStore } from '@/src/stores/main';
import type { AppSettingsKeys, Settings } from '../api/AppSettings';

type FeatureType = 'chat' | 'image' | 'tts' | 'stt';

interface FeatureRequirements {
	requiredSettings: AppSettingsKeys[];
	validateFn?: (settings: Settings) => boolean;
}

const featureRequirements: Record<FeatureType, FeatureRequirements> = {
	chat: {
		requiredSettings: ['selected_model_chat', 'selected_provider_chat'],
		validateFn: (settings) => {
			if (!settings.selected_provider_chat) return false;
			if (settings.selected_provider_chat === 'local') {
				return !!settings.koboldcpp_host;
			}
			return !!settings.openrouter_api_key;
		},
	},
	image: {
		requiredSettings: ['selected_model_image', 'selected_provider_image'],
		validateFn: (settings) => {
			if (!settings.selected_provider_image) return false;
			if (settings.selected_provider_image === 'local') {
				return !!settings.koboldcpp_host;
			}
			return false;
		},
	},
	tts: {
		requiredSettings: ['selected_model_tts', 'selected_provider_tts'],
		validateFn: (settings) => {
			if (!settings.selected_provider_tts) return false;
			if (settings.selected_provider_image === 'local') {
				return !!settings.koboldcpp_host;
			}
			return !!settings.selected_model_tts;
		},
	},
	stt: {
		requiredSettings: ['selected_model_whisper', 'selected_provider_stt'],
		validateFn: (settings) => {
			if (!settings.selected_provider_stt) return false;
			if (settings.selected_provider_image === 'local') {
				return !!settings.koboldcpp_host;
			}
			return !!settings.selected_model_whisper;
		},
	},
};
const store = useAppStore();

export function isFeatureAvailable(feature: FeatureType): boolean {
	const requirements = featureRequirements[feature];
	if (!requirements) return false;

	// Check if all required settings have non-empty values
	const hasRequiredSettings = requirements.requiredSettings.every((key) => {
		const value = store.settings[key];
		return value !== undefined && value !== '' && value !== '0';
	});

	// If there's a custom validation function, use it
	if (requirements.validateFn) {
		return requirements.validateFn(store.settings);
	}

	return hasRequiredSettings;
}

export function getAvailableFeatures(): FeatureType[] {
	return Object.keys(featureRequirements).filter((feature) =>
		isFeatureAvailable(feature as FeatureType)
	) as FeatureType[];
}
