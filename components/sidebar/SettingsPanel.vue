<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAppStore } from '@/stores/main';
import useLlamaCpp from '@/composables/useLlamaCpp';
import { useTitle } from '@vueuse/core';

useTitle('Settings | BuddyGen');

const { pickDirectory, verifyModelDirectory } = useElectron();
const {
	chatModels,
	imageModels,
	settings,
	updateChatServerRunning,
	updateModels,
	getChatModelPath,
	getNGpuLayers,
} = useAppStore();
const store = useAppStore();

// @ts-ignore
const { startServer, stopServer } = useLlamaCpp();

const error = ref('');

const refreshModels = async () => {
	await updateModels();
};

if (settings.local_model_directory) {
	await refreshModels();
}

const pickModelDirectory = async () => {
	if (!pickDirectory) return console.error('Electron not available');

	const directory = await pickDirectory();
	if (!directory) return;

	const verified = await verifyModelDirectory(directory);
	if (!verified) {
		error.value =
			'Invalid model directory (should contain chat and image folders)';
		return;
	} else {
		error.value = '';
	}
	settings.local_model_directory = directory;

	await refreshModels();
};

const needsRestart = ref(false);

const updateChatModel = async (model: string) => {
	console.log('Update chat model:', model);

	if (settings.selected_model_chat === model) return;

	settings.selected_model_chat = model;
	needsRestart.value = true;
	// await updateChatServerRunning();
	// if (store.chatServerRunning) {
	// 	await stopServer();
	// 	await startServer(getChatModelPath(), getNGpuLayers());
	// }
};
const updateImageModel = async (model: string) => {
	console.log('Update image model:', model);

	if (settings.selected_model_image === model) return;

	settings.selected_model_image = model;
};

const doStartServer = async () => {
	await startServer(getChatModelPath(), getNGpuLayers());
};

const doStopServer = async () => {
	await stopServer();
};

// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let initialNgl = null as null | number;

const nglFocus = () => {
	const val = settings.n_gpu_layers;
	console.log('ngl Focus:', val);
	initialNgl = val;
};
const nglBlur = async () => {
	const val = settings.n_gpu_layers;
	console.log('ngl Blur:', val);
	if (val === initialNgl) return;

	needsRestart.value = true;

	// await updateChatServerRunning();
	// if (store.chatServerRunning) {
	// 	await doStopServer();
	// 	await delay(250);
	// 	await doStartServer();
	// }
};

const isExternal = computed({
	get: () => settings.selected_provider_chat === 'external',
	set: (val) => {
		settings.selected_provider_chat = val ? 'external' : 'local';
		settings.selected_provider_image = val ? 'external' : 'local';
	},
});
</script>

<template>
	<div class="sidebar p-3">
		<Alert v-if="error" variant="destructive">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{{ error }}</AlertDescription>
		</Alert>

		<div>
			<Label for="name" class="block">Your Name</Label>
			<Input
				v-model="settings.user_name"
				type="text"
				id="name"
				class="w-full border border-gray-300 rounded-md p-2 mt-1"
			/>
		</div>

		<div class="mt-4">
			<Label for="selected_provider_chat" class="block">Model Provider</Label>
			<input
				v-model="settings.selected_provider_chat"
				type="radio"
				id="selected_provider_chat_external"
				name="selected_provider_chat"
				value="external"
			/>
			<label for="selected_provider_chat_external">External</label>
			<input
				v-model="settings.selected_provider_chat"
				type="radio"
				id="selected_provider_chat_local"
				name="selected_provider_chat"
				value="local"
			/>
			<label for="selected_provider_chat_local">Local</label>
		</div>
		<div class="mt-4" v-if="isExternal">
			<Label for="external_api_key" class="block">OpenAI API Key</Label>
			<Input
				v-model="settings.external_api_key"
				type="text"
				id="external_api_key"
				class="w-full border border-gray-300 rounded-md p-2 mt-1"
			/>
		</div>
		<div
			class="flex w-full items-center justify-between gap-1.5 mt-4"
			v-if="!isExternal"
		>
			<Label for="local_model_directory" class="w-full">
				Model Folder
				<Input
					v-model="settings.local_model_directory"
					:title="settings.local_model_directory"
					type="text"
					id="local_model_directory"
					name="local_model_directory"
					class="w-full border border-gray-300 rounded-md p-2 mt-1"
					style="cursor: default"
					disabled
				/>
			</Label>
			<Button
				@click="pickModelDirectory"
				class="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md"
			>
				Choose
			</Button>
		</div>
		<div class="mt-4">
			<Label for="chat-model" class="mb-1">Chat Model</Label>
			<Alert variant="info" class="my-2" v-if="needsRestart">
				<AlertTitle>Heads up!</AlertTitle>
				<AlertDescription>
					You'll need to restart the app for changes to take effect.
				</AlertDescription>
			</Alert>
			<Select
				:default-value="settings.selected_model_chat"
				@update:model-value="updateChatModel"
				id="chat-model"
			>
				<SelectTrigger :title="settings.selected_model_chat">
					<SelectValue placeholder="Select a chat model" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>Chat Models</SelectLabel>
						<SelectItem v-for="model in chatModels" :key="model" :value="model">
							{{ model }}
						</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
			<div class="mt-2" v-if="!isExternal">
				<Label for="n-gpu-layers" class="block">Number of GPU Layers</Label>
				<Input
					v-model="settings.n_gpu_layers"
					@focus="nglFocus"
					@blur="nglBlur"
					type="number"
					id="n-gpu-layers"
					name="n-gpu-layers"
					class="w-full border border-gray-300 rounded-md p-2 mt-1"
				/>
			</div>
		</div>
		<div class="mt-4">
			<Label for="image-model" class="mb-1">Image Model</Label>
			<Select
				:default-value="settings.selected_model_image"
				@update:model-value="updateImageModel"
				id="image-model"
			>
				<SelectTrigger :title="settings.selected_model_image">
					<SelectValue placeholder="Select an image model" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>Image Models</SelectLabel>
						<SelectItem v-for="model in imageModels" :key="model" :value="model">
							{{ model }}
						</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>

		<div class="mt-4">
			<NuxtLink to="/credits">App Credits</NuxtLink>
		</div>
	</div>
</template>

<style lang="scss"></style>
