<script setup lang="ts">
import { ref, computed, toRefs } from 'vue';
import { Import } from 'lucide-vue-next';
import useElectron from '@/composables/useElectron';
import { useAppStore } from '@/stores/main';
import { delay } from '@/lib/utils';
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogFooter,
	DialogClose,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const props = defineProps<{
	type?: 'chat' | 'image' | 'tts' | 'stt';
	label?: string;
}>();
const { type, label } = toRefs(props);

const filePaths = ref<string[]>([]);

const { pathJoin, pickFile, moveFile, linkFile, basename } = useElectron();
const store = useAppStore();

const emit = defineEmits(['modelImport']);

const tryToAutoSelectModels = () => {
	const selectedChatModel = store.settings.selected_model_chat;
	const selectedImageModel = store.settings.selected_model_image;
	const selectedTTSModel = store.settings.selected_model_tts;
	const selectedSTTModel = store.settings.selected_model_whisper;
	const chatModels = store.chatModels;
	const imageModels = store.imageModels;
	const ttsModels = store.ttsModels;
	const sttModels = store.whisperModels;

	if (!selectedChatModel && chatModels.length === 1) {
		store.settings.selected_model_chat = chatModels[0];
	}
	if (!selectedImageModel && imageModels.length === 1) {
		store.settings.selected_model_image = imageModels[0];
	}
	if (!selectedTTSModel && selectedTTSModel !== '0' && ttsModels.length === 1) {
		store.settings.selected_model_tts = ttsModels[0];
	}
	if (!selectedSTTModel && selectedSTTModel !== '0' && sttModels.length === 1) {
		store.settings.selected_model_whisper = sttModels[0];
	}
};

const doPickFile = async () => {
	if (!pickFile) return console.error('Electron not available');

	const files = await pickFile(type.value);
	if (!files) return;

	filePaths.value = files;
};
const doMoveFile = async () => {
	if (!moveFile) return console.error('Electron not available');

	if (filePaths.value.length === 0) return;

	// console.log('Moving file:', filePath);
	const modelsPath = store.settings.local_model_directory;

	if (!modelsPath) {
		console.error('No model directory');
		return;
	}

	for (const filePath of filePaths.value) {
		const fileName = await basename(filePath);
		const newPath = await pathJoin(modelsPath, fileName);
		// console.log('New Model Path:', newPath);

		await moveFile(filePath, newPath);
	}

	filePaths.value = [];
	await delay(50);
	store.updateModels();
	await delay(50);

	tryToAutoSelectModels();

	emit('modelImport');
};
const doLinkFile = async () => {
	if (!moveFile) return console.error('Electron not available');

	if (filePaths.value.length === 0) return;

	// console.log('Linking file:', filePath);
	const modelsPath = store.settings.local_model_directory;

	if (!modelsPath) {
		console.error('No model directory');
		return;
	}

	for (const filePath of filePaths.value) {
		const fileName = await basename(filePath);
		const newPath = await pathJoin(modelsPath, fileName);
		// console.log('New Model Path:', newPath);

		await linkFile(filePath, newPath);
	}

	filePaths.value = [];
	await delay(50);
	store.updateModels();
	await delay(50);

	tryToAutoSelectModels();

	emit('modelImport');
};

const slash = process.platform === 'win32' ? '\\' : '/';
const maxLength = 25;

const fileNames = computed(() => {
	const names = filePaths.value.map((path) => path.split(slash).pop() as string);

	return names.map((name) => {
		const truncated =
			name.length > maxLength ? name.slice(0, maxLength) + '...' : name;
		return { name, truncated };
	});
});
</script>

<template>
	<Dialog :modal="true">
		<DialogTrigger as-child>
			<Button variant="default" class="self-center px-2">
				<span v-if="!type && !label" class="flex items-center gap-1">
					<Import />
					Import Models
				</span>
				<span v-else-if="label" class="flex items-center gap-1">
					<Import />
					{{ label }}
				</span>
				<Import v-else />
			</Button>
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>
					<span v-if="!type">Import Any Model(s)</span>
					<span v-else-if="type === 'chat'">Import Chat Model(s)</span>
					<span v-else-if="type === 'image'">Import Image Model(s)</span>
					<span v-else-if="type === 'tts'">Import TTS Model(s)</span>
					<span v-else-if="type === 'stt'">Import STT Model(s)</span>
				</DialogTitle>
			</DialogHeader>
			<DialogDescription>
				<div class="my-1 text-center">
					<div v-if="!type || type === 'chat'">Chat models: <code>.gguf</code></div>
					<div v-if="!type || type === 'image'">
						Image models: <code>.safetensors</code>
					</div>
					<div v-if="!type || type === 'tts'">
						TTS models: <code>.onnx</code> + Adjacent <code>.json</code> file
					</div>
					<div v-if="!type || type === 'stt'">STT models: <code>.bin</code></div>
				</div>
				<div class="flex items-end">
					<Button
						type="button"
						@click="doPickFile"
						variant="link"
						class="custom-file-upload hover:bg-gray-100"
					>
						Choose file...
					</Button>
				</div>
				<div
					id="file-name"
					class="mt-1 px-2 py-1 rounded border"
					v-if="filePaths.length > 0"
				>
					<span class="block text-gray-400 select-none">
						Selected file(s):
						<Button
							type="button"
							@click="filePaths = []"
							variant="link"
							class="ml-4 p-0"
						>
							Reset
						</Button>
					</span>
					<span
						v-for="name in fileNames"
						:key="name.name"
						:class="{ 'ml-2': name === fileNames[0] }"
					>
						<b :title="name.name">{{ name.truncated }}</b>
						<span
							v-if="name !== fileNames[fileNames.length - 1]"
							class="text-xs text-gray-400 select-none"
						>
							&amp;
						</span>
					</span>
				</div>
				<p class="mt-4">
					<b>Tip</b>: Choosing <u>Link</u> will leave the Model(s) in the same
					location and will make a link to them instead. You should keep the file(s)
					in the same location (don't delete them!).
				</p>
			</DialogDescription>
			<DialogFooter>
				<DialogClose as-child class="mr-4">
					<Button variant="secondary" @click="doLinkFile">Link</Button>
				</DialogClose>
				<DialogClose as-child>
					<Button variant="default" @click="doMoveFile">Move</Button>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>

<style scoped>
input[type='file'] {
	display: none;
}

.custom-file-upload {
	border: 1px solid #ccc;
	display: inline-block;
	padding: 6px 12px;
	cursor: pointer;
}
</style>
