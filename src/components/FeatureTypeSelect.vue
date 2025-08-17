<script setup lang="ts">
import { computed, toRefs } from 'vue';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
} from '@/components/ui/select';
import { type AnyPossibleProvider, LLMProviders, ImgProviders, STTProviders, TTSProviders } from '../lib/api/AppSettings';
import { type FeatureType } from '../lib/api/types-api';
import { useAppStore } from '../stores/main';

const props = defineProps<{
	type: FeatureType;
}>();
const { type } = toRefs(props);
const key = computed(() => `selected_provider_${type.value}`);
const typeLabel = computed(() => {
	switch (type.value) {
		case 'chat': return 'Chat';
		case 'image': return 'Image';
		case 'tts': return 'TTS'
		case 'stt': return 'Transcription'
	}
});
const providers = computed(() => {
	switch (type.value) {
		case 'chat': return LLMProviders;
		case 'image': return ImgProviders;
		case 'tts': return TTSProviders;
		case 'stt': return STTProviders;
	}
})

const store = useAppStore();

function getProviderLabel(provider: AnyPossibleProvider) {
	switch (provider) {
		case 'koboldcpp': return 'KoboldCpp';
		case 'openrouter': return 'OpenRouter';
		case '0': return 'Disabled';
		default: return '';
	}
}

const updateValue = (val: string) => {
	if (store.settings[key.value] === val) return;
	store.settings[key.value] = val;
}
console.log(store.settings);
</script>
<template>
	<Select :default-value="store.settings[key] + ''" @update:model-value="updateValue" :id="`${type}-provider`">
		<SelectTrigger :title="store.settings[key]">
			<SelectValue :placeholder="`Select a provider for ${typeLabel}`" />
		</SelectTrigger>
		<SelectContent>
			<SelectGroup>
				<SelectLabel>Providers</SelectLabel>
				<SelectItem v-for="provider in providers" :key="provider" :value="provider"> {{ getProviderLabel(provider) }}
				</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>
</template>
