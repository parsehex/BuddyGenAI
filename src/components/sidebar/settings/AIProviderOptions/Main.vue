<script setup lang="ts">
import { computed } from 'vue';
import {
	Button
} from '@/components/ui/button';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import { useAppStore } from '@/src/stores/main';
import OpenRouterOptions from './OpenRouterOptions.vue';
import KoboldCppOptions from './KoboldCppOptions.vue';

const store = useAppStore();

const isCloud = computed(() => store.settings.selected_provider_chat === 'cloud');
const currentProvider = computed(() => (store.settings.selected_provider_chat === 'cloud' ? 'OpenRouter' : 'KoboldCpp'));
const otherProvider = computed(() => (store.settings.selected_provider_chat === 'cloud' ? 'KoboldCpp' : 'OpenRouter'));

const switchProvider = () => {
	const newProvider = store.settings.selected_provider_chat === 'cloud' ? 'local' : 'cloud';
	store.settings.selected_provider_chat = newProvider;
	store.settings.selected_provider_image = newProvider;
};
</script>
<template>
	<AccordionItem value="ai-provider-options">
		<AccordionTrigger>AI Provider Options ({{ currentProvider }})</AccordionTrigger>
		<AccordionContent class="text-center">
			<Button type="button" @click="switchProvider" size="xs" variant="secondary">Switch to {{ otherProvider }}</Button>
			<OpenRouterOptions v-if="isCloud" />
			<KoboldCppOptions v-else />
		</AccordionContent>
	</AccordionItem>
</template>
