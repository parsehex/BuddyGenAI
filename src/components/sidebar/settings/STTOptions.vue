<script setup lang="ts">
import { computed, ref } from 'vue';
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
import ImportModel from '../../ImportModel.vue';

const store = useAppStore();

const updateWhisperModel = async (model: string) => {
	if (store.settings.selected_model_whisper === model) return;

	store.settings.selected_model_whisper = model;
};

const autoSendSTT = computed({
	get: () =>
		// @ts-ignore
		store.settings.auto_send_stt === 1 || store.settings.auto_send_stt === '1.0'
			? 'true'
			: 'false',
	set: (val: string) => {
		if (val === store.settings.auto_send_stt + '') return;
		const b = val === 'true';
		const num = b ? 1 : 0;
		if (num === store.settings.auto_send_stt) return;
		// @ts-ignore
		store.settings.auto_send_stt = num + '.0';
	},
});

const useGpu = computed(
	() =>
		// @ts-ignore
		store.settings.gpu_enabled_whisper === '1.0' ||
		store.settings.gpu_enabled_whisper === 1
);
const updateUseGPU = async (boolVal: boolean) => {
	const numVal = boolVal ? 1 : 0;
	if (store.settings.gpu_enabled_whisper === numVal) return;

	// @ts-ignore
	store.settings.gpu_enabled_whisper = numVal + '.0';
};
</script>

<template>
	<AccordionItem value="stt-options">
		<AccordionTrigger>Speech-to-Text Options</AccordionTrigger>
		<AccordionContent>
			<OptionSection
				label="Auto Send STT"
				labelName="auto_send_stt"
				orientation="vertical"
			>
				<RadioGroup
					:default-value="autoSendSTT"
					v-model="autoSendSTT"
					id="auto_send_stt"
					class="flex flex-row"
				>
					<div class="flex items-center space-x-2">
						<RadioGroupItem id="auto-stt-yes" value="true">Yes</RadioGroupItem>
						<Label for="auto-stt-yes" class="block">Yes</Label>
					</div>
					<div class="flex items-center space-x-2">
						<RadioGroupItem id="auto-stt-no" value="false">No</RadioGroupItem>
						<Label for="auto-stt-no" class="block">No</Label>
					</div>
				</RadioGroup>
			</OptionSection>
		</AccordionContent>
	</AccordionItem>
</template>
