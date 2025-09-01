<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/src/stores/main';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import OptionSection from './OptionSection.vue';
import { Separator } from '../../ui/separator';
import TTSVoiceSelect from '@/src/components/TTSVoiceSelect.vue';

const store = useAppStore();
const ttsProvider = computed(() => store.settings.selected_provider_tts);
const sttProvider = computed(() => store.settings.selected_provider_stt);

const defaultVoice = computed({
	get: () => store.settings.selected_model_tts,
	set: (val: string) => {
		store.settings.selected_model_tts = val;
	},
});

const autoReadChat = computed({
	get: () => store.settings.auto_read_chat ? 'true' : 'false',
	set: (val: string) => {
		if (val === store.settings.auto_read_chat + '') return;
		const b = val === 'true';
		if (b === store.settings.auto_read_chat) return;
		store.settings.auto_read_chat = b;
	},
});

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
			<TTSVoiceSelect v-model="defaultVoice" label="Default Voice" placeholder="Select a TTS voice" />
			<div class="mt-2 flex gap-4">
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
