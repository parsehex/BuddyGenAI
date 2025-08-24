import { computed } from 'vue';
import { useAppStore } from '@/src/stores/main';
import { useChatAI } from './useChatAI';
import { useImgAI } from './useImgAI';
import { useTTSAI } from './useTTSAI';
import { useSTTAI } from './useSTTAI';

export function useAIStatus() {
	const store = useAppStore();
	const chatAI = useChatAI();
	const imgAI = useImgAI();
	const ttsAI = useTTSAI();
	const sttAI = useSTTAI();

	const overallStatus = computed(() => {
		let allEnabledAndAvailable = true;
		let anyEnabledAndUnavailable = false;
		let anyEnabledAndAvailable = false;

		const features = [
			{
				name: 'Chat',
				enabled: chatAI.isEnabled.value,
				available: chatAI.isAvailable.value,
			},
			{
				name: 'Image Generation',
				enabled: imgAI.isEnabled.value,
				available: imgAI.isAvailable.value,
			},
			{
				name: 'Text-to-Speech',
				enabled: ttsAI.isEnabled.value,
				available: ttsAI.isAvailable.value,
			},
			{
				name: 'Speech-to-Text',
				enabled: sttAI.isEnabled.value,
				available: sttAI.isAvailable.value,
			},
		];

		for (const feature of features) {
			if (feature.enabled) {
				if (feature.available) {
					anyEnabledAndAvailable = true;
				} else {
					allEnabledAndAvailable = false;
					anyEnabledAndUnavailable = true;
				}
			}
		}

		if (allEnabledAndAvailable && anyEnabledAndAvailable) {
			return 'green'; // All enabled features are responsive/ready to use
		} else if (chatAI.isAvailable.value && anyEnabledAndUnavailable) {
			return 'yellow'; // Chat is available but some enabled feature(s) aren't available
		} else {
			return 'red'; // All providers are unavailable or no features are enabled and available
		}
	});

	const activeFeatures = computed(() => {
		const features = [];
		if (chatAI.isEnabled.value && chatAI.isAvailable.value) features.push('Chat');
		if (imgAI.isEnabled.value && imgAI.isAvailable.value)
			features.push('Image Generation');
		if (ttsAI.isEnabled.value && ttsAI.isAvailable.value)
			features.push('Text-to-Speech');
		if (sttAI.isEnabled.value && sttAI.isAvailable.value)
			features.push('Speech-to-Text');
		return features;
	});

	const availableModels = computed(() => {
		const models = [];
		if (
			chatAI.isEnabled.value &&
			chatAI.isAvailable.value &&
			store.settings.selected_model_chat
		) {
			models.push(`Chat: ${store.settings.selected_model_chat}`);
		}
		// For other AI types, we might need to get the specific model names if they are stored in settings
		// For now, just indicate if the feature is active.
		if (
			imgAI.isEnabled.value &&
			imgAI.isAvailable.value &&
			store.settings.selected_provider_image
		) {
			models.push(`Image: ${store.settings.selected_provider_image}`);
		}
		if (
			ttsAI.isEnabled.value &&
			ttsAI.isAvailable.value &&
			store.settings.selected_model_tts
		) {
			models.push(`TTS: ${store.settings.selected_model_tts}`);
		}
		if (
			sttAI.isEnabled.value &&
			sttAI.isAvailable.value &&
			store.settings.selected_provider_stt
		) {
			models.push(`STT: ${store.settings.selected_provider_stt}`);
		}
		return models;
	});

	return {
		overallStatus,
		activeFeatures,
		availableModels,
	};
}
