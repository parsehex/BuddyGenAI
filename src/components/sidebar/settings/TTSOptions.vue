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
import ImportModel from '../../ImportModel.vue';

const store = useAppStore();

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
				label="Auto Read Chat"
				labelName="auto_read_chat"
				orientation="vertical"
			>
				<RadioGroup
					:default-value="autoReadChat"
					v-model="autoReadChat"
					id="auto_read_chat"
					class="flex flex-row"
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
