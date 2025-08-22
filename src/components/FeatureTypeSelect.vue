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
	SelectSeparator,
} from '@/components/ui/select';
import { type AnyPossibleProvider, LLMProviders, ImgProviders, STTProviders, TTSProviders } from '../lib/api/AppSettings';
import { type FeatureType } from '../lib/api/types-api';
import { useAppStore } from '../stores/main';
import OptionSection from './sidebar/settings/OptionSection.vue';

const props = defineProps<{
	type: FeatureType;
	label?: boolean;
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
		case 'webllm': return 'WebLLM';
		case '0': return 'Disabled';
		default: return '';
	}
}

const groupedProviders = computed(() => {
	const groups: Record<string, AnyPossibleProvider[]> = {
		Local: [],
		'In-Browser': [],
		Cloud: [],
		Other: [],
	};

	for (const p of providers.value ?? []) {
		switch (p) {
			case 'koboldcpp':
				groups.Local.push(p);
				break;
			case 'webllm':
				groups['In-Browser'].push(p);
				break;
			case 'openrouter':
				groups.Cloud.push(p);
				break;
			case '0':
				groups.Other.push(p);
				break;
			default:
				groups.Other.push(p);
				break;
		}
	}
	return groups;
});

const updateValue = (val: string) => {
	if (store.settings[key.value] === val) return;
	store.settings[key.value] = val;
}
</script>
<template>
	<OptionSection :label="label ? typeLabel : ''" :labelName="`${type}-provider`" orientation="vertical"
		class="inline-flex" style="flex-basis: 120px;">
		<Select :default-value="store.settings[key] + ''" @update:model-value="updateValue" :id="`${type}-provider`"
			class="">
			<SelectTrigger :title="store.settings[key]">
				<SelectValue :placeholder="`Select a provider for ${typeLabel}`" />
			</SelectTrigger>
			<SelectContent>
				<template v-for="(group, label) in groupedProviders" :key="label">
					<SelectGroup v-if="label !== 'Other' && group.length > 0">
						<SelectLabel>{{ label }}</SelectLabel>
						<SelectItem v-for="provider in group" :key="provider" :value="provider"> {{ getProviderLabel(provider) }}
						</SelectItem>
					</SelectGroup>
					<SelectSeparator v-if="label === 'Other'" />
					<SelectItem v-if="label === 'Other'" v-for="provider in group" :key="provider" :value="provider" class="pl-9">
						{{ getProviderLabel(provider) }} </SelectItem>
				</template>
			</SelectContent>
		</Select>
	</OptionSection>
</template>
