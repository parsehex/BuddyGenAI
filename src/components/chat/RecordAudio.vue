<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useSTTAI } from '../../composables/ai/useSTTAI';
import { blobToBase64, popError } from '../../lib/utils';
import { Button } from '../ui/button';
import { Mic, MicOff, X } from 'lucide-vue-next';
import { useAppStore } from '@/src/stores/main';

const emit = defineEmits(['start', 'stop', 'loading', 'error']);
const props = withDefaults(defineProps<{
	maxSeconds?: number;
}>(), {
	maxSeconds: 0,
});

const appStore = useAppStore();
const sttAI = useSTTAI();

let mediaRecorder: MediaRecorder | null = null;
let currentStream: MediaStream | null = null;
let recordingTimeout: ReturnType<typeof setTimeout> | null = null;

const recording = ref(false);
const isLoading = ref(false);

const autoSendSTT = computed(() => appStore.settings.auto_send_stt);

onMounted(async () => {
	try {
		const { register } = await import('extendable-media-recorder');
		const { connect } = await import('extendable-media-recorder-wav-encoder');
		await register(await connect());
	} catch (e: any) {
		console.log('extendable-media-recorder error', e);
	}
});

const createRecorder = async (stream: MediaStream) => {
	const { MediaRecorder: MR } = await import('extendable-media-recorder');
	const rec = new MR(stream, { mimeType: 'audio/wav' });

	rec.addEventListener('dataavailable', async (event: any) => {
		if (recording.value) return;

		try {
			recording.value = false;
			isLoading.value = true;

			const audioBlob = new Blob([event.data], { type: 'audio/wav' });
			const base64 = await blobToBase64(audioBlob);
			emit('loading');
			let text = await sttAI.transcribe({ audio_data: base64 });
			if (text) {
				text = text.trim();
				emit('stop', text);
			}
		} catch (err: any) {
			if (!(err + '').includes('aborted')) {
				console.error(err);
				popError(err, 'Transcription Error');
				emit('error');
			}
		} finally {
			isLoading.value = false;
		}
	});

	return rec;
};

const toggleRecording = async () => {
	if (recording.value) {
		// stop existing
		recording.value = false;
		mediaRecorder?.stop();
		currentStream?.getTracks().forEach(t => t.stop());
		if (recordingTimeout) clearTimeout(recordingTimeout);
		return;
	}

	if (!navigator.mediaDevices?.getUserMedia) {
		popError('Recording is not supported on your browser');
		return;
	}


	if (!sttAI.isAvailable) {
		popError('Please set a Speech-to-Text model in the settings', 'Transcription is disabled');
		return;
	}

	try {
		currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		mediaRecorder = await createRecorder(currentStream) as any;
		mediaRecorder?.start();
		emit('start');
		recording.value = true;

		if (props.maxSeconds > 0) {
			recordingTimeout = setTimeout(() => {
				toggleRecording(); // Automatically stop recording
			}, props.maxSeconds * 1000);
		}

	} catch (err: any) {
		console.log(err);
		popError(err, 'Transcription Error');
		emit('error');
	}
};

const cancel = () => {
	try {
		sttAI.stop();
	} catch (err) {
		console.error('Error stopping transcription', err);
	}
	isLoading.value = false;
	if (recordingTimeout) clearTimeout(recordingTimeout);
};

defineExpose({ toggleRecording });
</script>
<template>
	<Button v-if="sttAI.isAvailable" type="button" size="sm" @click="isLoading ? cancel() : toggleRecording()"
		:title="isLoading ? 'Cancel transcription' : recording ? 'Stop recording' : `Start recording audio${autoSendSTT ? ' (auto-send)' : ''}`"
		:variant="isLoading || recording ? 'destructive' : 'default'">
		<X v-if="isLoading" />
		<Mic v-else-if="!recording" />
		<MicOff v-else-if="recording" />
	</Button>
</template>
