import { useToast } from '@/src/components/ui/toast';
import {
	type ChatRequest as TChatRequest,
	webllm,
	openaiCompat,
	type ModelObject,
} from '@/src/lib/ai/chat';
import { useAppStore } from '@/src/stores/main';
import { computed, onMounted, ref, watch } from 'vue';

export type ChatRequest = TChatRequest;
export function useChatAI() {
	const store = useAppStore();
	const { toast } = useToast();

	const provider = computed(() => store.settings.selected_provider_chat);
	const providerType = computed(() => {
		if (provider.value === 'koboldcpp' || provider.value === 'openrouter')
			return 'openai';
		if (provider.value === 'webllm') return 'webllm';
		return '';
	});
	const availModels = ref([] as ModelObject[]);

	async function updateModels() {
		if (providerType.value === 'openai')
			availModels.value = [...(await openaiCompat.getModels())];
		else if (providerType.value === 'webllm')
			availModels.value = [...(await webllm.getModels())];
		else availModels.value = [];
	}

	onMounted(updateModels);
	watch(() => provider.value, updateModels);

	async function chat(req: ChatRequest) {
		if (provider.value === 'koboldcpp' || provider.value === 'openrouter')
			return openaiCompat.chat(req);
		if (provider.value === 'webllm') return webllm.chat(req);

		toast({
			variant: 'destructive',
			description:
				'Chat is currently disabled. Enable it in Options -> AI Providers',
		});
	}

	function stop() {
		if (provider.value === 'koboldcpp' || provider.value === 'openrouter')
			return openaiCompat.stop();
		if (provider.value === 'webllm') return webllm.stop();
		return false;
	}

	return {
		provider,
		availModels,

		chat,
		stop,
	};
}
