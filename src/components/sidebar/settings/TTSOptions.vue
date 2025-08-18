<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '@/src/stores/main';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import OptionSection from './OptionSection.vue';
import { getVoices } from '@/src/lib/ai/tts';

const store = useAppStore();
const voices = ref(getVoices());

const autoReadChat = computed({
	get: () => store.settings.auto_read_chat ? 'true' : 'false',
	set: (val: string) => {
		if (val === store.settings.auto_read_chat + '') return;
		const b = val === 'true';
		if (b === store.settings.auto_read_chat) return;
		store.settings.auto_read_chat = b;
	},
});

const updateTTSVoice = async (voiceName: string) => {
	if (store.settings.selected_model_tts === voiceName) return;
	store.settings.selected_model_tts = voiceName;
};
</script>
<template>
	<div>
		<OptionSection label="Default Voice" labelName="default_voice" orientation="vertical">
			<Select :default-value="store.settings.selected_model_tts" @update:model-value="updateTTSVoice"
				@update:open="voices = getVoices()" id="default_voice">
				<SelectTrigger :title="store.settings.selected_model_tts">
					<SelectValue placeholder="Select a TTS voice" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>Voices</SelectLabel>
						<SelectItem v-for="voice in voices" :key="voice" :value="voice"> {{ voice }} </SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
		</OptionSection>
		<OptionSection label="Auto Read Chat" labelName="auto_read_chat" orientation="vertical">
			<RadioGroup :default-value="autoReadChat" v-model="autoReadChat" id="auto_read_chat" class="flex flex-row">
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
	</div>
</template>
