import { useToast } from '@/src/components/ui/toast';
import { useAppStore } from '@/src/stores/main';
import { computed, onMounted, ref, watch } from 'vue';
import { type TTSRequest, koboldcpp } from '@/lib/ai/tts';
import { playAudio } from '@/src/lib/utils';
import { defineStore } from 'pinia';

export const useTTSAI = defineStore('ai/tts', () => {
	const store = useAppStore();
	const { toast } = useToast();

	const provider = computed(() => store.settings.selected_provider_tts);
	const providerType = computed(() => {
		if (store.settings.selected_provider_tts === 'koboldcpp') return 'koboldcpp';
		return '';
	});
	const availVoices = ref([] as string[]);

	const isEnabled = computed(() => provider.value && provider.value !== '0');
	const isAvailable = computed(() => {
		if (!isEnabled.value) return false;
		const lastPing = store.lastKoboldVersionResult;
		if (provider.value === 'koboldcpp' && (!lastPing || !lastPing.tts))
			return false;
		return true;
	});

	async function updateVoices() {
		let voices = [] as string[];
		if (provider.value === 'koboldcpp') voices = await koboldcpp.getVoices();
		availVoices.value.length = 0;
		availVoices.value = [...voices];
	}

	watch(() => provider.value, updateVoices);
	onMounted(updateVoices);

	async function makeTTS(req: TTSRequest): Promise<string | undefined> {
		if (provider.value === 'koboldcpp') return koboldcpp.makeTTS(req);

		toast({
			variant: 'destructive',
			description:
				'TTS is currently disabled. Enable it in Options -> AI Providers',
		});
	}

	/** Generate TTS and if Auto-Send is on then automatically play the audio. */
	async function makeAndReadTTS(text: string, voice: string) {
		const store = useAppStore();
		const autoRead = store.settings.auto_read_chat;

		if (!autoRead) return;

		const audio = await makeTTS({ text, voice });

		if (!audio) {
			console.error('Did not receive any TTS audio');
			return;
		}

		playAudio(audio);
		return audio;
	}
	// TODO need a function we can call or modify to use in conjunction with chat's stream_callback
	//   that way we can start generating and optionally play TTS after we receive the first sentence from the LLM

	function stop() {
		if (provider.value === 'koboldcpp') return koboldcpp.stop();
		return false;
	}

	function getSelectedVoice(buddyId?: string) {
		if (!providerType.value) return '';
		if (buddyId) {
			const buddy = store.buddies.find((b) => b.id === buddyId);
			if (buddy && buddy.tts_voice) {
				return buddy.tts_voice;
			}
		}
		return store.settings.selected_model_tts;
	}

	return {
		provider,
		availVoices,
		isEnabled,
		isAvailable,
		getSelectedVoice,

		makeTTS,
		makeAndReadTTS,
		updateVoices,
		stop,
	};
});
