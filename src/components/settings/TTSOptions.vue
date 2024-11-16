<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
} from '@/components/ui/select';
import OptionSection from './OptionSection.vue';
import ImportModel from '../ImportModel.vue';
import appConfig, {
	type Config,
	type Provider,
} from '@/src/composables/useConfig';
import { delay } from '@/src/lib/utils';
import appFeatureSupport from '@/src/composables/useFeatureSupport';

const feat = appFeatureSupport;
const isDisabled = computed(
	() => appConfig?.getActiveProvider('tts') === 'disabled'
);
const isExternal = computed(() => appConfig?.isExternal('tts'));

const updateModel = async (model: string) => {
	const newCfg = {
		selected_model_tts: model,
	};
	await appConfig?.updateConfig(newCfg);
	selectedModel.value = model;
};
const updateProvider = async (provider: Provider) => {
	const newCfg = {
		selected_provider_tts: provider,
	};
	await appConfig?.updateConfig(newCfg);
	selectedProvider.value = provider;
};

const selectedProvider = ref(appConfig?.getActiveProvider('tts') || 'disabled');
onMounted(async () => {
	await delay(10);
	selectedProvider.value = appConfig?.getActiveProvider('tts') || 'disabled';
});
const updateProviders = async () => {
	if (!feat) return;
	providers.value = await feat.getProviders('tts');
};
const providers = ref([] as Provider[]);
watch(() => appConfig?.config.value, updateProviders, { immediate: true });

const selectedModel = ref(appConfig?.config.value.selected_model_tts);
const models = ref([] as string[]);
watch(
	() => appConfig?.ttsModels.value,
	async () => {
		if (!appConfig) return;
		models.value = [...appConfig.ttsModels.value];
		selectedModel.value = appConfig.config.value.selected_model_tts;
	},
	{ immediate: true }
);
</script>

<template>
	<AccordionItem value="tts-options">
		<AccordionTrigger>Text-to-Speech Options</AccordionTrigger>
		<AccordionContent>
			<OptionSection
				label="TTS Provider"
				labelName="tts-provider"
				orientation="vertical"
			>
				<Select
					:default-value="selectedProvider"
					@update:model-value="(provider: string) => updateProvider(provider as Provider)"
					id="tts-provider"
				>
					<SelectTrigger :title="selectedProvider">
						<SelectValue placeholder="Select a TTS provider" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>TTS Providers</SelectLabel>
							<SelectItem value="disabled"> Disabled </SelectItem>
							<SelectItem
								v-for="provider in providers"
								:key="provider"
								:value="provider"
							>
								{{ provider }}
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</OptionSection>

			<OptionSection
				v-if="!isDisabled"
				label="Default Voice"
				labelName="tts-model"
				orientation="vertical"
			>
				<div class="flex">
					<ImportModel type="tts" v-if="!isExternal" />
					<Select
						:default-value="selectedModel"
						@update:model-value="updateModel"
						id="tts-model"
					>
						<SelectTrigger :title="selectedModel">
							<SelectValue placeholder="Select a TTS model" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>TTS Models</SelectLabel>
								<SelectItem v-for="model in models" :key="model" :value="model">
									{{ model }}
								</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</OptionSection>
		</AccordionContent>
	</AccordionItem>
</template>
