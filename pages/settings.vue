<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

const { pickDirectory, verifyModelDirectory } = useElectron();

const settingsObj = ref({
	// TODO Defaults endpoint?
	user_name: 'User',
	local_model_directory: '',
	selected_provider_chat: 'local',
	selected_provider_image: 'local',
	selected_model_chat: '',
	selected_model_image: '',
});
const chatModels = ref([] as string[]);
const imageModels = ref([] as string[]);

const error = ref('');

const refreshModels = async () => {
	const c = await $fetch('/api/models/list?type=chat');
	if (c) chatModels.value = c;

	const i = await $fetch('/api/models/list?type=image');
	if (i) imageModels.value = i;
};

onBeforeMount(async () => {
	const settings = await $fetch('/api/setting');
	Object.assign(settingsObj.value, settings);

	if (settings.local_model_directory) {
		await refreshModels();
	}
});

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
	settingsObj.value.local_model_directory = directory;

	await saveSettings();
	await refreshModels();
};

const saveSettings = async () => {
	await $fetch('/api/setting', {
		method: 'PUT',
		body: JSON.stringify(settingsObj.value),
	});
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
			<div class="flex w-full items-center justify-between gap-1.5 mt-4">
				<!-- TODO button to pop folder picker -->
				<Label for="local_model_directory" class="w-full">
					Local Model Directory
					<Input
						v-model="settingsObj.local_model_directory"
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
					<select
						v-model="settingsObj.selected_provider_chat"
						id="selected_provider_chat"
						name="selected_provider_chat"
						class="w-full border border-gray-300 rounded-md p-2 mt-1"
						disabled
					>
						<!-- TODO implement -->
						<option value="external"> External </option>
						<option value="local"> Local </option>
						<option value="custom"> Custom </option>
					</select>
				</div>
				<div class="mt-4">
					<Label for="selected_provider_image" class="block"> Image Provider </Label>
					<select
						v-model="settingsObj.selected_provider_image"
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
				<Select v-model="settingsObj.selected_model_chat" @change="saveSettings" id="chat-model">
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
				<Select v-model="settingsObj.selected_model_image" @change="saveSettings" id="image-model">
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
