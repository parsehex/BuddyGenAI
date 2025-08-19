<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '@/src/stores/main';
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
import { Separator } from '../../ui/separator';

const store = useAppStore();
const ttsProvider = computed(() => store.settings.selected_provider_tts);
const sttProvider = computed(() => store.settings.selected_provider_stt);
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

const autoSendSTT = computed({
	get: () => store.settings.auto_send_stt ? 'true' : 'false',
	set: (val: string) => {
		if (val === store.settings.auto_send_stt + '') return;
		const b = val === 'true';
		if (b === store.settings.auto_send_stt) return;
		store.settings.auto_send_stt = b;
	},
});
</script>
<template>
	<div>
		<OptionSection v-if="ttsProvider && ttsProvider !== '0'" label="Text-to-Speech" orientation="vertical">
			<div class="flex gap-4">
				<Label for="default_voice"> Default Voice </Label>
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
			</div>
			<div class="flex gap-4">
				<Label for="auto_read_chat"> Auto-Read Chat </Label>
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
			</div>
		</OptionSection>
		<Separator />
		<OptionSection v-if="sttProvider && sttProvider !== '0'" label="Transcription" orientation="vertical">
			<div class="flex gap-4">
				<Label for="auto_send_stt"> Auto-Send after recording </Label>
				<RadioGroup :default-value="autoSendSTT" v-model="autoSendSTT" id="auto_send_stt" class="flex flex-row">
					<div class="flex items-center space-x-2">
						<RadioGroupItem id="auto-stt-yes" value="true">Yes</RadioGroupItem>
						<Label for="auto-stt-yes" class="block">Yes</Label>
					</div>
					<div class="flex items-center space-x-2">
						<RadioGroupItem id="auto-stt-no" value="false">No</RadioGroupItem>
						<Label for="auto-stt-no" class="block">No</Label>
					</div>
				</RadioGroup>
			</div>
		</OptionSection>
	</div>
</template>
