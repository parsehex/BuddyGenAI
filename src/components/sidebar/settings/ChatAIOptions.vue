<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '@/src/stores/main';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
import ImportModel from '../../ImportModel.vue';

const store = useAppStore();
const needsRestart = ref(false);

// the settings besides model is used by the electron version
// the main settings component won't show this component if not cloud anyway
const isCloud = computed(() => store.settings.selected_provider_chat === 'cloud')

const updateChatModel = async (model: string) => {
	if (store.settings.selected_model_chat === model) return;
	store.settings.selected_model_chat = model;
	if (isCloud || store.chatServerRunning) return;
	// would restart local chat server if necessary
};

let initialNgl = null as null | number;
const nglFocus = () => {
	const val = store.settings.n_gpu_layers;
	initialNgl = val;
};
const nglBlur = async () => {
	const val = store.settings.n_gpu_layers;
	if (val === initialNgl) return;

	needsRestart.value = true;
};

const useGpu = computed(
	() => store.settings.gpu_enabled_chat
);
const updateUseGPU = async (boolVal: boolean) => {
	if (store.settings.gpu_enabled_chat === boolVal) return;
	store.settings.gpu_enabled_chat = boolVal;
	needsRestart.value = true;
};
</script>
<template>
	<AccordionItem value="chat-ai-options">
		<AccordionTrigger>Chat AI Options</AccordionTrigger>
		<AccordionContent>
			<Alert variant="info" class="my-2" v-if="needsRestart">
				<AlertTitle>Heads up!</AlertTitle>
				<AlertDescription> You'll need to restart the app for changes to take effect. </AlertDescription>
			</Alert>
			<OptionSection v-if="!isCloud">
				<Label class="flex items-center gap-2">
					<Switch :checked="useGpu" @update:checked="updateUseGPU" /> Use GPU if available
				</Label>
			</OptionSection>
			<OptionSection label="Chat Model" labelName="chat-model" orientation="vertical">
				<div class="flex">
					<ImportModel type="chat" />
					<Select :default-value="store.settings.selected_model_chat" @update:model-value="updateChatModel"
						id="chat-model">
						<SelectTrigger :title="store.settings.selected_model_chat">
							<SelectValue placeholder="Select a chat model" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Chat Models</SelectLabel>
								<SelectItem v-for="model in store.chatModels" :key="model" :value="model"> {{ model }} </SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</OptionSection>
			<OptionSection v-if="!isCloud" label="Number of GPU Layers" labelName="n-gpu-layers" orientation="vertical">
				<Input v-model="store.settings.n_gpu_layers" @focus="nglFocus" @blur="nglBlur" type="number" id="n-gpu-layers"
					name="n-gpu-layers" class="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 mt-1" />
			</OptionSection>
		</AccordionContent>
	</AccordionItem>
</template>
