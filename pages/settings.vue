<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import $f from '~/lib/api/$fetch';
import uF from '~/lib/api/useFetch';

const { pickDirectory, verifyModelDirectory } = useElectron();

const settings = await uF.setting.getAll();
const chatModels = ref([] as string[]);
const imageModels = ref([] as string[]);

const isServerRunning = ref(false);

const error = ref('');

const startServer = async () => {
	await $fetch('/api/llama.cpp/start', { method: 'POST' });
	await refreshServerStatus();
};
const stopServer = async () => {
	await $fetch('/api/llama.cpp/stop', { method: 'POST' });
	await refreshServerStatus();
};
const getServerStatus = async () => {
	return await $fetch('/api/llama.cpp/status', { method: 'GET' });
};

const refreshServerStatus = async () => {
	const status = await getServerStatus();
	isServerRunning.value = status.isRunning;
};

const refreshModels = async (useUF = false) => {
	// TODO is there a better way to do this?
	const provider = useUF ? uF : $f;
	let c = await provider.model.get('chat');
	if (Array.isArray(c)) chatModels.value = c;
	else chatModels.value = c.value;

	let i = await provider.model.get('image');
	if (Array.isArray(i)) imageModels.value = i;
	else imageModels.value = i.value;
};

if (settings.value.local_model_directory) {
	await refreshModels(true);
}

const pickModelDirectory = async () => {
	if (!pickDirectory) return console.error('Electron not available');

	const directory = await pickDirectory();
	if (!directory) return;

	const verified = await verifyModelDirectory(directory);
	if (!verified) {
		error.value = 'Invalid model directory (should contain chat and image folders)';
		return;
	} else {
		error.value = '';
	}
	settings.value.local_model_directory = directory;

	await saveSettings();
	await refreshModels();
};

const saveSettings = async () => {
	await $f.setting.update(settings.value);
};

const updateSelectedModel = (type: 'chat' | 'image') => {
	return async (model: string) => {
		settings.value[`selected_model_${type}`] = model;
		await saveSettings();
		if (type !== 'chat') return;
		await refreshServerStatus();
		if (isServerRunning.value) {
			await stopServer();
			await startServer();
		}
	};
};
</script>

<template>
	<div class="container flex flex-col items-center">
		<h1 class="text-2xl font-bold"> App Settings </h1>
		<div class="w-1/2">
			<Alert v-if="error" variant="destructive">
				<AlertTitle> Error </AlertTitle>
				<AlertDescription> {{ error }} </AlertDescription>
			</Alert>
			<Button v-if="settings.local_model_directory && settings.selected_model_chat" @click="startServer" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md">
				Start Server
			</Button>
			<Button v-if="isServerRunning" @click="stopServer" class="mt-4 bg-red-500 text-white px-4 py-2 rounded-md"> Stop Server </Button>
			<Button @click="refreshServerStatus" class="mt-4 bg-gray-500 text-white px-4 py-2 rounded-md"> Refresh Server Status </Button>
			<div class="flex w-full items-center justify-between gap-1.5 mt-4">
				<Label for="local_model_directory" class="w-full">
					Local Model Directory
					<Input
						v-model="settings.local_model_directory"
						type="text"
						id="local_model_directory"
						name="local_model_directory"
						class="w-full border border-gray-300 rounded-md p-2 mt-1"
						disabled
					/>
				</Label>
				<Button @click="pickModelDirectory" class="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md"> Pick Directory </Button>
			</div>
			<div class="flex justify-evenly">
				<div class="mt-4">
					<Label for="selected_provider_chat" class="block"> Chat Provider </Label>
					<select v-model="settings.selected_provider_chat" id="selected_provider_chat" name="selected_provider_chat" class="w-full border border-gray-300 rounded-md p-2 mt-1" disabled>
						<!-- TODO implement -->
						<option value="external"> External </option>
						<option value="local"> Local </option>
						<option value="custom"> Custom </option>
					</select>
				</div>
				<div class="mt-4">
					<Label for="selected_provider_image" class="block"> Image Provider </Label>
					<select
						v-model="settings.selected_provider_image"
						id="selected_provider_image"
						name="selected_provider_image"
						class="w-full border border-gray-300 rounded-md p-2 mt-1"
						disabled
					>
						<!-- TODO implement -->
						<option value="external"> External </option>
						<option value="local"> Local </option>
						<option value="custom"> Custom </option>
						<!-- TODO option: disabled ? -->
					</select>
				</div>
			</div>
			<div class="mt-4">
				<Label for="chat-model" class="mb-1"> Chat Model </Label>
				<Select v-model="settings.selected_model_chat" @update:model-value="updateSelectedModel('chat')" id="chat-model">
					<SelectTrigger>
						<SelectValue placeholder="Select a chat model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel> Chat Models </SelectLabel>
							<SelectItem v-for="model in chatModels" :key="model" :value="model"> {{ model }} </SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
			<div class="mt-4">
				<Label for="image-model" class="mb-1"> Image Model </Label>
				<Select v-model="settings.selected_model_image" @update:model-value="updateSelectedModel('image')" id="image-model">
					<SelectTrigger>
						<SelectValue placeholder="Select an image model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel> Image Models </SelectLabel>
							<SelectItem v-for="model in imageModels" :key="model" :value="model"> {{ model }} </SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
		</div>
	</div>
</template>

<style lang="scss"></style>
