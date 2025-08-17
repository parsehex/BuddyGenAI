import { useAppStore } from '@/src/stores/main';
import {
	AppSettings,
	type AppSettingsKeys,
	type Settings,
} from '../api/AppSettings';
import type { FeatureType } from '../api/types-api';

interface FeatureRequirements {
	requiredSettings: AppSettingsKeys[];
	validateFn?: (settings: Settings) => boolean;
}

const featureRequirements: Record<FeatureType, FeatureRequirements> = {
	chat: {
		requiredSettings: ['selected_model_chat', 'selected_provider_chat'],
		validateFn: (settings) => {
			if (!settings.selected_provider_chat) return false;
			if (settings.selected_provider_chat === 'koboldcpp') {
				const lastKoboldVersion = useAppStore().lastKoboldVersionResult;
				return !!settings.koboldcpp_host && lastKoboldVersion.llm !== false;
			}
			if (settings.selected_provider_chat === 'webllm') {
				return !!settings.selected_model_chat;
			}
			return !!settings.openrouter_api_key;
		},
	},
	image: {
		requiredSettings: ['selected_model_image', 'selected_provider_image'],
		validateFn: (settings) => {
			if (!settings.selected_provider_image) return false;
			if (settings.selected_provider_image === 'koboldcpp') {
				const lastKoboldVersion = useAppStore().lastKoboldVersionResult;
				return !!settings.koboldcpp_host && lastKoboldVersion.txt2img !== false;
			}
			return false; // koboldcpp only
		},
	},
	tts: {
		requiredSettings: ['selected_provider_tts'],
		validateFn: (settings) => {
			if (!settings.selected_provider_tts) return false;
			if (settings.selected_provider_image === 'koboldcpp') {
				const lastKoboldVersion = useAppStore().lastKoboldVersionResult;
				return !!settings.koboldcpp_host && lastKoboldVersion.tts !== false;
			}
			return false; // koboldcpp only
		},
	},
	stt: {
		requiredSettings: ['selected_provider_stt'],
		validateFn: (settings) => {
			if (!settings.selected_provider_stt) return false;
			if (settings.selected_provider_image === 'koboldcpp') {
				const lastKoboldVersion = useAppStore().lastKoboldVersionResult;
				return !!settings.koboldcpp_host && lastKoboldVersion.transcribe !== false;
			}
			return false; // koboldcpp only
		},
	},
};

export function isFeatureAvailable(feature: FeatureType): boolean {
	const requirements = featureRequirements[feature];
	if (!requirements) return false;

	const store = useAppStore();

	// Check if all required settings have non-empty values
	const hasRequiredSettings = requirements.requiredSettings.every((key) => {
		const value = AppSettings.get(key as string);
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
