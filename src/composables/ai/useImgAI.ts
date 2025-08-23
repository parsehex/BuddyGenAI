import { useToast } from '@/src/components/ui/toast';
import { a1111, type ImageRequest } from '@/src/lib/ai/image';
import { useAppStore } from '@/src/stores/main';
import { computed } from 'vue';

export function useImgAI() {
	const store = useAppStore();
	const { toast } = useToast();

	const provider = computed(() => store.settings.selected_provider_image);
	const providerType = computed(() => {
		if (provider.value === 'koboldcpp') return 'a1111'; // TODO create a1111 as separate provider + integrate deeper
		return '';
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

		makeImage,
		stop,
	};
}
