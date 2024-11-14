<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useAppStore } from '@/src/stores/main';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
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
import appFeatureSupport from '@/src/composables/useFeatureSupport';
import { delay } from '@/src/lib/utils';

// TODO this whole file needs refactoring to reuse for other ai types

const feat = appFeatureSupport;
const isDisabled = computed(
	() => appConfig?.getActiveProvider('chat') === 'disabled'
);
const isExternal = computed(() => appConfig?.isExternal('chat'));

const updateModel = async (model: string) => {
	const newCfg = {
		...appConfig?.config.value,
		selected_model_chat: model,
	} as Config;
	await appConfig?.updateConfig(newCfg);
	selectedModel.value = model;
};
const updateProvider = async (provider: Provider) => {
	const newCfg = {
		...appConfig?.config.value,
		selected_provider_chat: provider,
	} as Config;
	await appConfig?.updateConfig(newCfg);
	selectedProvider.value = provider;
};

const selectedProvider = ref(
	appConfig?.getActiveProvider('chat') || 'disabled'
);
onMounted(async () => {
	await delay(10);
	selectedProvider.value = appConfig?.getActiveProvider('chat') || 'disabled';
});
const updateProviders = async () => {
	if (!feat) return;
	providers.value = await feat.getProviders('chat');
};
const providers = ref([] as Provider[]);
watch(() => appConfig?.config.value, updateProviders, { immediate: true });

const selectedModel = ref(appConfig?.config.value.selected_model_chat);
const models = ref([] as string[]);
watch(
	() => appConfig?.chatModels.value,
	async () => {
		if (!appConfig) return;
		models.value = [...appConfig.chatModels.value];
		selectedModel.value = appConfig.config.value.selected_model_chat;
	},
	{ immediate: true }
);

const ngl = ref(appConfig?.config.value.n_gpu_layers);
let initialNgl = null as null | number;
const nglFocus = () => {
	const val = ngl.value;
	initialNgl = val as number;
};
const nglBlur = async () => {
	const val = ngl.value;
	const newCfg = {
		...appConfig?.config.value,
		n_gpu_layers: val,
	} as Config;
	if (val !== initialNgl) appConfig?.updateConfig(newCfg);
};

const useGpu = computed(() => appConfig?.config.value.gpu_enabled_chat);
const updateUseGPU = async (boolVal: boolean) => {
	const newCfg = {
		...appConfig?.config.value,
		gpu_enabled_chat: boolVal,
	} as Config;
	appConfig?.updateConfig(newCfg);
};
</script>

<template>
	<AccordionItem value="chat-ai-options">
		<AccordionTrigger>Chat AI Options</AccordionTrigger>
		<AccordionContent>
			<OptionSection v-if="!isDisabled && !isExternal">
				<Label class="flex items-center gap-2">
					<Switch :checked="useGpu" @update:checked="updateUseGPU" />
					Use GPU if available
				</Label>
			</OptionSection>

			<OptionSection
				label="Chat Provider"
				labelName="chat-provider"
				orientation="vertical"
			>
				<Select
					:default-value="selectedProvider"
					@update:model-value="(val: string) => updateProvider(val as Provider)"
					id="chat-provider"
				>
					<SelectTrigger :title="selectedProvider">
						<SelectValue placeholder="Select a chat provider" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Chat Providers</SelectLabel>
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
				label="Chat Model"
				labelName="chat-model"
				orientation="vertical"
			>
				<div class="flex">
					<ImportModel type="chat" v-if="!isExternal" />

					<Select
						v-if="appConfig?.chatModels"
						:default-value="selectedModel"
						@update:model-value="updateModel"
						id="chat-model"
					>
						<SelectTrigger :title="selectedModel">
							<SelectValue placeholder="Select a chat model" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Chat Models</SelectLabel>
								<SelectItem v-for="model in models" :key="model" :value="model">
									{{ model }}
								</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</OptionSection>

			<OptionSection
				v-if="!isDisabled && !isExternal"
				label="Number of GPU Layers"
				labelName="n-gpu-layers"
				orientation="vertical"
			>
				<Input
					v-model="ngl"
					@focus="nglFocus"
					@blur="nglBlur"
					type="number"
					id="n-gpu-layers"
					name="n-gpu-layers"
					class="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 mt-1"
				/>
			</OptionSection>
		</AccordionContent>
	</AccordionItem>
</template>
