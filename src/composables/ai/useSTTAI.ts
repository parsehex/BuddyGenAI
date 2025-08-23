import { useToast } from '@/src/components/ui/toast';
import { koboldcpp, type STTRequest } from '@/src/lib/ai/stt';
import { useAppStore } from '@/src/stores/main';
import { computed } from 'vue';

export function useSTTAI() {
	const store = useAppStore();
	const { toast } = useToast();

	const provider = computed(() => store.settings.selected_provider_stt);
	const providerType = computed(() => {
		if (store.settings.selected_provider_tts === 'koboldcpp') return 'koboldcpp';
		return '';
	});
	const isAvailable = computed(() => !!providerType.value);

	async function transcribe(req: STTRequest): Promise<string | undefined> {
		if (provider.value === 'koboldcpp') return koboldcpp.transcribe(req);

		toast({
			variant: 'destructive',
			description:
				'Transcription is currently disabled. Enable it in Options -> AI Providers',
		});
	}

	function stop() {
		if (provider.value === 'koboldcpp') return koboldcpp.stop();
		return false;
	}

	return {
		provider,
		isAvailable,

		transcribe,
		stop,
	};
}
