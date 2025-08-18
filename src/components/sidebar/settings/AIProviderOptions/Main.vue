<script setup lang="ts">
import { computed } from 'vue';
import OptionSection from '../OptionSection.vue';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import { useAppStore } from '@/src/stores/main';
import OpenRouterOptions from './OpenRouterOptions.vue';
import KoboldCppOptions from './KoboldCppOptions.vue';
import FeatureTypeSelect from '@/src/components/FeatureTypeSelect.vue';
import WebLLMModelCard from '@/src/components/setup/WebLLMModelCard.vue';

const store = useAppStore();

const usingOpenRouter = computed(() => (
	store.settings.selected_provider_chat === 'openrouter' || !!store.settings.openrouter_api_key
));
const usingKoboldCpp = computed(() => (
	!!store.settings.koboldcpp_host ||
	store.settings.selected_provider_chat === 'koboldcpp' ||
	store.settings.selected_provider_image === 'koboldcpp' ||
	store.settings.selected_provider_tts === 'koboldcpp' ||
	store.settings.selected_provider_stt === 'koboldcpp'
));
</script>
<template>
	<div class="text-center">
		<OptionSection label="Chat" labelName="chat-provider">
			<FeatureTypeSelect type="chat" />
		</OptionSection>
		<OptionSection label="Image" labelName="image-provider">
			<FeatureTypeSelect type="image" />
		</OptionSection>
		<OptionSection label="TTS" labelName="tts-provider">
			<FeatureTypeSelect type="tts" />
		</OptionSection>
		<OptionSection label="Transcription" labelName="stt-provider">
			<FeatureTypeSelect type="stt" />
		</OptionSection>
		<OpenRouterOptions v-if="usingOpenRouter" />
		<KoboldCppOptions v-if="usingKoboldCpp" />
		<WebLLMModelCard v-if="store.settings.selected_provider_chat === 'webllm'" />
	</div>
</template>
