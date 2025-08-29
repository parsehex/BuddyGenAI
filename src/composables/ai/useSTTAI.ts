import { useToast } from '@/src/components/ui/toast';
import { koboldcpp, type STTRequest } from '@/src/lib/ai/stt';
import { useAppStore } from '@/src/stores/main';
import { defineStore } from 'pinia';
import { computed } from 'vue';

export const useSTTAI = defineStore('ai/stt', () => {
	const store = useAppStore();
	const { toast } = useToast();

	const provider = computed(() => store.settings.selected_provider_stt);
	const providerType = computed(() => {
		if (provider.value === 'koboldcpp') return 'koboldcpp';
		return '';
	});

	const isEnabled = computed(() => provider.value && provider.value !== '0');
	const isAvailable = computed(() => {
		if (!isEnabled.value) return false;
		const lastPing = store.lastKoboldVersionResult;
		if (provider.value === 'koboldcpp') {
			if (!lastPing || !lastPing.transcribe) return false;

			// audio recording won't work otherwise:
			const hostIsHttps =
				window.location.href.includes('localhost') ||
				store.settings.koboldcpp_host.includes('https:') ||
				store.settings.koboldcpp_host.includes('localhost');
			if (!store.settings.koboldcpp_host || !hostIsHttps) return false;
		}
		return true;
	});

	async function transcribe(req: STTRequest): Promise<string | undefined> {
		if (providerType.value === 'koboldcpp') return koboldcpp.transcribe(req);

		toast({
			variant: 'destructive',
			description:
				'Transcription is currently disabled. Enable it in Options -> AI Providers',
		});
	}

	function stop() {
		if (providerType.value === 'koboldcpp') return koboldcpp.stop();
		return false;
	}

	return {
		provider,
		isEnabled,
		isAvailable,

		transcribe,
		stop,
	};
});
