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
</script>
<template>
	<AccordionItem value="ai-provider-options">
		<AccordionTrigger>AI Provider</AccordionTrigger>
		<AccordionContent class="text-center">
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
			<OpenRouterOptions />
			<KoboldCppOptions />
		</AccordionContent>
	</AccordionItem>
</template>
