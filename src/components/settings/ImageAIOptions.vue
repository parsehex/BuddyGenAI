<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useAppStore } from '@/src/stores/main';
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
import { Switch } from '@/components/ui/switch';
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
	() => appConfig?.getActiveProvider('image') === 'disabled'
);
const isExternal = computed(() => appConfig?.isExternal('image'));

const updateModel = async (model: string) => {
	const newCfg = {
		...appConfig?.config.value,
		selected_model_image: model,
	} as Config;
	await appConfig?.updateConfig(newCfg);
	selectedModel.value = model;
};
const updateProvider = async (provider: Provider) => {
	const newCfg = {
		...appConfig?.config.value,
		selected_provider_image: provider,
	} as Config;
	await appConfig?.updateConfig(newCfg);
	selectedProvider.value = provider;
};

const selectedProvider = ref(
	appConfig?.getActiveProvider('image') || 'disabled'
);
onMounted(async () => {
	await delay(10);
	selectedProvider.value = appConfig?.getActiveProvider('image') || 'disabled';
});
const updateProviders = async () => {
	if (!feat) return;
	providers.value = await feat.getProviders('image');
};
const providers = ref([] as Provider[]);
watch(() => appConfig?.config.value, updateProviders, { immediate: true });

const selectedModel = ref(appConfig?.config.value.selected_model_image);
const models = ref([] as string[]);
watch(
	() => appConfig?.imageModels.value,
	async () => {
		if (!appConfig) return;
		models.value = [...appConfig.imageModels.value];
		selectedModel.value = appConfig.config.value.selected_model_image;
		console.log('models', models.value);
	},
	{ immediate: true }
);

const useGpu = computed(() => appConfig?.config.value.gpu_enabled_image);
const updateUseGPU = async (boolVal: boolean) => {
	const newCfg = {
		...appConfig?.config.value,
		gpu_enabled_image: boolVal,
	} as Config;
	await appConfig?.updateConfig(newCfg);
};
</script>

<template>
	<AccordionItem value="image-ai-options">
		<AccordionTrigger>Image AI Options</AccordionTrigger>
		<AccordionContent>
			<OptionSection v-if="!isDisabled && !isExternal">
				<Label class="flex items-center gap-2">
					<Switch :checked="useGpu" @update:checked="updateUseGPU" />
					Use GPU if available
				</Label>
			</OptionSection>

			<OptionSection
				label="Image Provider"
				labelName="image-provider"
				orientation="vertical"
			>
				<Select
					:default-value="selectedProvider"
					@update:model-value="(provider: string) => updateProvider(provider as Provider)"
					id="image-provider"
				>
					<SelectTrigger :title="selectedProvider">
						<SelectValue placeholder="Select an image provider" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Image Providers</SelectLabel>
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
				label="Image Model"
				labelName="image-model"
				orientation="vertical"
			>
				<div class="flex">
					<ImportModel type="image" v-if="!isExternal" />

					<Select
						:default-value="selectedModel"
						@update:model-value="updateModel"
						id="image-model"
					>
						<SelectTrigger :title="selectedModel">
							<SelectValue placeholder="Select an image model" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Image Models</SelectLabel>
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
