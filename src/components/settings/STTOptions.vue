<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useAppStore } from '@/src/stores/main';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
const store = useAppStore();
const isDisabled = computed(
	() => appConfig?.getActiveProvider('whisper') === 'disabled'
);
const isExternal = computed(() => appConfig?.isExternal('whisper'));

const updateModel = async (model: string) => {
	const newCfg = {
		selected_model_whisper: model,
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
		models.value = [...appConfig.whisperModels.value];
		selectedModel.value = appConfig.config.value.selected_model_tts;
	},
	{ immediate: true }
);

const useGpu = computed(() => appConfig?.config.value.gpu_enabled_whisper);
const updateUseGPU = async (boolVal: boolean) => {
	const newCfg = {
		gpu_enabled_whisper: boolVal,
	};
	await appConfig?.updateConfig(newCfg);
};
</script>

<template>
	<AccordionItem value="stt-options">
		<AccordionTrigger>Speech-to-Text Options</AccordionTrigger>
		<AccordionContent>
			<OptionSection v-if="!isExternal && !isDisabled">
				<Label class="flex items-center gap-2">
					<Switch :checked="useGpu" @update:checked="updateUseGPU" />
					Use GPU if available
				</Label>
			</OptionSection>

			<OptionSection
				label="Whisper/STT Provider"
				labelName="stt-provider"
				orientation="vertical"
			>
				<Select
					:default-value="selectedProvider"
					@update:model-value="(provider: string) => updateProvider(provider as Provider)"
					id="stt-provider"
				>
					<SelectTrigger :title="selectedProvider">
						<SelectValue placeholder="Select an STT provider" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>STT Providers</SelectLabel>
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
				label="STT / Whisper Model"
				labelName="stt-model"
				orientation="vertical"
			>
				<div class="flex">
					<ImportModel type="stt" v-if="!isExternal" />
					<Select
						:default-value="selectedModel"
						@update:model-value="updateModel"
						id="stt-model"
					>
						<SelectTrigger :title="selectedModel">
							<SelectValue placeholder="Select a model for STT" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>STT Models</SelectLabel>

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
