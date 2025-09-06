import { useToast } from '@/src/components/ui/toast';
import type { ModelObject } from '@/src/lib/ai/chat';
import { a1111, swarmui, type ImageRequest } from '@/src/lib/ai/image';
import { useAppStore } from '@/src/stores/main';
import { defineStore } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

export const useImgAI = defineStore('ai/img', () => {
	const store = useAppStore();
	const { toast } = useToast();

	const provider = computed(() => store.settings.selected_provider_image);
	const providerType = computed(() => {
		if (provider.value === 'koboldcpp') return 'a1111'; // TODO create a1111 as separate provider + integrate deeper
		if (provider.value === 'swarmui') return 'swarmui';
		return '';
	});

	const isEnabled = computed(() => provider.value && provider.value !== '0');
	const isAvailable = computed(() => {
		if (!isEnabled.value) return false;
		const lastPing = store.lastKoboldVersionResult;
		if (provider.value === 'koboldcpp' && (!lastPing || !lastPing.txt2img))
			return false;
		if (provider.value === 'swarmui' && !store.settings.swarmui_host)
			return false;
		return true;
	});

	const availModels = ref([] as ModelObject[]);
	async function updateModels() {
		if (providerType.value === 'a1111') availModels.value = [];
		//if (providerType.value === 'a1111') availModels.value = [...(await a1111.getModels())];
		if (providerType.value === 'swarmui')
			availModels.value = [...(await swarmui.getModels())];
		else availModels.value = [];
	}

	onMounted(updateModels);
	watch(() => provider.value, updateModels);

	async function makeImage(req: ImageRequest): Promise<string | undefined> {
		if (providerType.value === 'a1111') return a1111.makeImage(req);
		if (providerType.value === 'swarmui') return swarmui.makeImage(req);

		toast({
			variant: 'destructive',
			description:
				'Image generation is currently disabled. Enable it in Options -> AI Providers',
		});
	}

	function stop() {
		if (provider.value === 'koboldcpp') return a1111.stop();
		if (provider.value === 'swarmui') return swarmui.stop();
		return false;
	}

	return {
		provider,
		isEnabled,
		isAvailable,
		availModels,

		makeImage,
		stop,
		updateModels,
	};
});
