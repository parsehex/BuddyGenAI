<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/src/stores/main';
import OpenRouterOptions from './OpenRouterOptions.vue';
import KoboldCppOptions from './KoboldCppOptions.vue';
import FeatureTypeSelect from '@/src/components/FeatureTypeSelect.vue';
import WebLLMModelCard from '@/src/components/setup/WebLLMModelCard.vue';
import { Separator } from '@/src/components/ui/separator';
import OllamaOptions from './OllamaOptions.vue';

const store = useAppStore();

const usingOpenRouter = computed(() => (
	store.settings.selected_provider_chat === 'openrouter' || !!store.settings.openrouter_api_key
));
const usingKoboldCpp = computed(() => (
	(store.settings.selected_provider_chat === 'koboldcpp' ||
		store.settings.selected_provider_image === 'koboldcpp' ||
		store.settings.selected_provider_tts === 'koboldcpp' ||
		store.settings.selected_provider_stt === 'koboldcpp') ||
	!!store.settings.koboldcpp_host
));
const usingOllama = computed(() => (
	(store.settings.selected_provider_chat === 'ollama') ||
	!!store.settings.ollama_host
));
const usingWebLLM = computed(() => (
	store.settings.selected_provider_chat === 'webllm'
));
</script>
<template>
	<div class="text-center flex flex-wrap max-w-[100%] justify-center">
		<FeatureTypeSelect type="chat" class="mr-2" label />
		<FeatureTypeSelect type="image" class="mr-2" label />
		<FeatureTypeSelect type="tts" class="mr-2" label />
		<FeatureTypeSelect type="stt" class="mr-2" label />
	</div>
	<Separator class="my-2" />
	<KoboldCppOptions v-if="usingKoboldCpp" />
	<Separator v-if="usingKoboldCpp && (usingOpenRouter || usingOllama || usingWebLLM)" class="my-2" />
	<OpenRouterOptions v-if="usingOpenRouter" />
	<OllamaOptions v-if="usingOllama" />
	<WebLLMModelCard v-if="usingWebLLM" />
</template>
