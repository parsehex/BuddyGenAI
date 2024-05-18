<script setup lang="ts">
import type { Message } from 'ai/vue';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useElectron from '@/composables/useElectron';
import { api } from '@/lib/api';
import urls from '@/lib/api/urls';
import { useAppStore } from '@/stores/main';
import BuddyAvatar from './BuddyAvatar.vue';

const filePath = ref<string>('');

const detectedModelType = ref<string>(''); // chat or image

const { pathJoin, pickFile, moveFile, linkFile, basename } = useElectron();
const store = useAppStore();

const doPickFile = async () => {
	if (!pickFile) return console.error('Electron not available');

	const file = await pickFile();
	if (!file) return;

	filePath.value = file;
};
const doMoveFile = async () => {
	if (!moveFile) return console.error('Electron not available');

	console.log('Moving file:', filePath);
	let modelPath = store.getChatModelPath();
	if (!modelPath) {
		console.error('No chat model selected');
		return;
	}
	modelPath = await pathJoin(modelPath, '..');

	const fileName = await basename(filePath.value);
	const path = await pathJoin(modelPath, fileName);
	console.log('Path:', path);

	await moveFile(filePath.value, path);

	filePath.value = '';
	store.updateModels();
};
const doLinkFile = async () => {
	if (!moveFile) return console.error('Electron not available');

	console.log('Linking file:', filePath);
	let modelPath = store.getChatModelPath();
	if (!modelPath) {
		console.error('No chat model selected');
		return;
	}
	modelPath = await pathJoin(modelPath, '..');

	const fileName = await basename(filePath.value);
	const path = await pathJoin(modelPath, fileName);
	console.log('Path:', path);

	await linkFile(filePath.value, path);

	filePath.value = '';
	store.updateModels();
};
</script>

<template>
	<Dialog :modal="true">
		<DialogTrigger as-child>
			<Button variant="default"> Import Model </Button>
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Import a Model</DialogTitle>
			</DialogHeader>
			<DialogDescription>
				<div>
					<Button
						type="button"
						@click="doPickFile"
						variant="link"
						class="custom-file-upload hover:bg-gray-100"
					>
						Choose file...
					</Button>
					<span id="file-name" class="ml-2">
						{{ filePath ? filePath.split('\\').pop() : 'No file selected' }}
					</span>
				</div>
				<p class="mt-2">
					<b>Tip</b>: Choosing <u>Link</u> will leave the Model file in the same
					location and will make a link to it instead. You should keep the file in
					the same location.
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
