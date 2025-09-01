<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
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
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-vue-next';
import { useTTSAI } from '@/src/composables/ai/useTTSAI';
import { playAudio } from '../lib/utils';

const props = defineProps<{
	modelValue: string;
	label?: string;
	placeholder?: string;
	buddyName?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const { modelValue, label, placeholder, buddyName } = toRefs(props);

const store = useAppStore();
const ttsAI = useTTSAI();
const voices = ref(ttsAI.availVoices);

const selectedVoice = computed({
	get: () => modelValue.value,
	set: (val: string) => {
		emit('update:modelValue', val);
	},
});

const ttsEnabled = computed(() => store.settings.selected_provider_tts === 'koboldcpp');

const previewTTS = async (voice: string) => {
	if (!voice) return;
	const text = buddyName?.value ? `Hello, I am ${buddyName.value}.` : 'This is a voice preview.';
	const audio = await ttsAI.makeTTS({ text, voice });
	if (audio) playAudio(audio);
};
</script>
<template>
	<div v-if="ttsEnabled" class="flex gap-4 items-center w-full">
		<Label v-if="label" :for="`tts-voice-select-${label}`"> {{ label }} </Label>
		<Select v-model="selectedVoice" :id="`tts-voice-select-${label}`" @update:open="voices = ttsAI.availVoices">
			<SelectTrigger :title="selectedVoice">
				<SelectValue :placeholder="placeholder || 'Select a TTS voice'" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Voices</SelectLabel>
					<SelectItem v-for="voice in voices" :key="voice" :value="voice"> {{ voice }} </SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
		<Button @click="previewTTS(selectedVoice)" :disabled="!selectedVoice" variant="ghost" size="icon"
			title="Preview voice">
			<Volume2 class="h-4 w-4" />
		</Button>
	</div>
</template>
