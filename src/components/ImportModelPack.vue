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

const filePaths = ref<string[]>([]);

const {
	pathJoin,
	pickPackFile,
	moveFile,
	linkFile,
	basename,
	openExternalLink,
} = useElectron();
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
	if (!selectedTTSModel && ttsModels.length) {
		store.settings.selected_model_tts = ttsModels[0];
	}
	if (!selectedSTTModel && sttModels.length === 1) {
		store.settings.selected_model_whisper = sttModels[0];
	}
};

const doPickFile = async () => {
	if (!pickPackFile) return console.error('Electron not available');

	const file = await pickPackFile();
	if (!file) return;

	console.log('Picked file:', file);
};
const doMoveFile = async () => {
	if (!moveFile) return console.error('Electron not available');

	// importModelPack

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
				<span class="flex items-center gap-1">
					<Import />
					Import Model Pack
				</span>
			</Button>
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>
					<span>Import Model Pack</span>
				</DialogTitle>
			</DialogHeader>
			<DialogDescription>
				<div class="mb-4">
					You can import a model pack to save time from downloading models
					individually and importing them.
					<!-- TODO link to model pack -->
				</div>
				<div class="flex items-end">
					<Button
						type="button"
						@click="doPickFile"
						variant="link"
						class="custom-file-upload hover:bg-gray-100 underline"
					>
						Choose file...
					</Button>
				</div>
				<div
					id="file-name"
					class="mt-1 px-2 py-1 rounded border"
					v-if="filePaths.length > 0"
				>
					<span class="block text-gray-400 select-none"> Importing Models: </span>
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
			</DialogDescription>
			<DialogFooter>
				<DialogClose as-child class="mr-4">
					<Button variant="outline">Cancel</Button>
				</DialogClose>
				<DialogClose as-child>
					<Button variant="default" @click="doMoveFile">Import</Button>
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
