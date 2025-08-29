import { useToast } from '@/src/components/ui/toast';
import { a1111, type ImageRequest } from '@/src/lib/ai/image';
import { useAppStore } from '@/src/stores/main';
import { defineStore } from 'pinia';
import { computed } from 'vue';

export const useImgAI = defineStore('ai/img', () => {
	const store = useAppStore();
	const { toast } = useToast();

	const provider = computed(() => store.settings.selected_provider_image);
	const providerType = computed(() => {
		if (provider.value === 'koboldcpp') return 'a1111'; // TODO create a1111 as separate provider + integrate deeper
		return '';
	});

	const isEnabled = computed(() => provider.value && provider.value !== '0');
	const isAvailable = computed(() => {
		if (!isEnabled.value) return false;
		const lastPing = store.lastKoboldVersionResult;
		if (provider.value === 'koboldcpp' && (!lastPing || !lastPing.txt2img))
			return false;
		return true;
	});

	async function makeImage(req: ImageRequest): Promise<string | undefined> {
		if (providerType.value === 'a1111') return a1111.makeImage(req);

		toast({
			variant: 'destructive',
			description:
				'Image generation is currently disabled. Enable it in Options -> AI Providers',
		});
	}

	function stop() {
		if (provider.value === 'koboldcpp') return a1111.stop();
		return false;
	}

	return {
		provider,
		isEnabled,
		isAvailable,

		makeImage,
		stop,
	};
});
