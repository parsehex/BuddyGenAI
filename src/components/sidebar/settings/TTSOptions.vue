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
import OptionSection from './OptionSection.vue';

const store = useAppStore();

const updateTTSModel = async (model: string) => {
	if (store.settings.selected_model_tts === model) return;

	store.settings.selected_model_tts = model;
};

const autoReadChat = computed({
	get: () =>
		// @ts-ignore
		store.settings.auto_read_chat === 1 || store.settings.auto_read_chat === '1.0'
			? 'true'
			: 'false',
	set: (val: string) => {
		if (val === store.settings.auto_read_chat + '') return;
		const b = val === 'true';
		const num = b ? 1 : 0;
		if (num === store.settings.auto_read_chat) return;
		store.settings.auto_read_chat = num;
	},
});
</script>

<template>
	<AccordionItem value="tts-options">
		<AccordionTrigger>Text-to-Speech Options</AccordionTrigger>
		<AccordionContent>
			<OptionSection
				label="Default TTS Voice"
				labelName="tts-model"
				orientation="vertical"
			>
				<Select
					:default-value="store.settings.selected_model_tts"
					@update:model-value="updateTTSModel"
					id="tts-model"
				>
					<SelectTrigger :title="store.settings.selected_model_tts">
						<SelectValue placeholder="Select a TTS model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>TTS Models</SelectLabel>
							<SelectItem v-for="model in store.ttsModels" :key="model" :value="model">
								{{ model }}
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</OptionSection>

			<OptionSection
				label="Auto Read Chat"
				labelName="auto_read_chat"
				orientation="vertical"
			>
				<RadioGroup
					:default-value="autoReadChat"
					v-model="autoReadChat"
					id="auto_read_chat"
					class="flex flex-row mb-3"
				>
					<div class="flex items-center space-x-2">
						<RadioGroupItem id="auto-tts-yes" value="true">Yes</RadioGroupItem>
						<Label for="auto-tts-yes" class="block">Yes</Label>
					</div>
					<div class="flex items-center space-x-2">
						<RadioGroupItem id="auto-tts-no" value="false">No</RadioGroupItem>
						<Label for="auto-tts-no" class="block">No</Label>
					</div>
				</RadioGroup>
			</OptionSection>
		</AccordionContent>
	</AccordionItem>
</template>
