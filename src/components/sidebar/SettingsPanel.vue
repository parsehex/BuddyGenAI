<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import useElectron from '@/composables/useElectron';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAppStore } from '@/stores/main';
import { RefreshCw } from 'lucide-vue-next';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import ImportModel from '@/components/ImportModel.vue';
import OpenAIAPIKeyHelpButton from '@/components/OpenAIAPIKeyHelpButton.vue';
import DevOnly from '@/components/DevOnly.vue';
import { ScrollArea } from '../ui/scroll-area';

const { toast } = useToast();

const { pickDirectory, verifyModelDirectory, openModelsDirectory } =
	useElectron();

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

const error = ref('');

const refreshModels = async () => {
	await updateModels();
};

if (settings.local_model_directory) {
	await refreshModels();
}

const reloadPage = () => {
	window.location.reload();
};

const openModels = async () => {
	if (!openModelsDirectory) return console.error('Electron not available');

	await openModelsDirectory();
};
const pickModelDirectory = async () => {
	if (!pickDirectory) return console.error('Electron not available');

	if (settings.local_model_directory) {
		console.log(
			'Local model directory already set:',
			settings.local_model_directory
		);
		return;
	}

	const directory = await verifyModelDirectory();
	if (!directory) {
		error.value =
			'Cound not find a valid model directory. Please select a valid directory.';
		return;
	} else {
		error.value = '';
	}
	settings.local_model_directory = directory;

	await refreshModels();
};
onMounted(() => {
	if (!settings.local_model_directory) {
		pickModelDirectory();
	}
});

const needsRestart = ref(false);

const updateChatModel = async (model: string) => {
	console.log('Update chat model:', model);

	if (settings.selected_provider_chat === 'external') {
		settings.selected_model_chat = model;
		return;
	}
	if (settings.selected_model_chat === model) return;

	settings.selected_model_chat = model;
	if (store.chatServerRunning) return;
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

const externalOrLocal = computed({
	get: () => (isExternal.value ? 'external' : 'local'),
	set: (val) => {
		isExternal.value = val === 'external';
	},
});

const prvNeedsRestart = ref(false);
const prvLastVal = ref(isExternal.value);
watch(isExternal, (newVal) => {
	if (newVal === prvLastVal.value) return;
	prvLastVal.value = newVal;
	prvNeedsRestart.value = newVal && store.chatServerRunning;
	updateModels();
});
</script>

<template>
	<!--
		TODO
		- add sections to reduce clutter
		- add parental control(s) to moderate and prevent inappropriate content
		- (unrelated) add option to Buddies to specify a certain model
		-   if the currently active model is not the one specified, switch to it and restart server
	 -->
	<ScrollArea class="h-screen">
		<div class="sidebar p-3 pb-12">
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

			<Alert variant="info" class="my-2" v-if="prvNeedsRestart">
				<AlertTitle>Heads up!</AlertTitle>
				<AlertDescription>
					The local chat model will stay online until you restart this app.
				</AlertDescription>
			</Alert>
			<Label class="block mt-2 mb-1">Model Provider</Label>
			<RadioGroup
				:default-value="isExternal ? 'external' : 'local'"
				v-model="externalOrLocal"
				class="flex flex-row mb-3"
			>
				<div class="flex items-center space-x-2">
					<RadioGroupItem id="external" value="external">External</RadioGroupItem>
					<Label for="external" class="block">External (OpenAI)</Label>
				</div>
				<div class="flex items-center space-x-2">
					<RadioGroupItem id="local" value="local">Local</RadioGroupItem>
					<Label for="local" class="block">Local</Label>
				</div>
			</RadioGroup>
			<OpenAIAPIKeyHelpButton v-if="isExternal" />
			<div class="mt-1" v-if="isExternal">
				<Label for="external_api_key" class="block">OpenAI API Key</Label>
				<Input
					v-model="settings.external_api_key"
					type="text"
					id="external_api_key"
					class="w-full border border-gray-300 rounded-md p-2 mt-1"
				/>
			</div>
			<div
				class="flex w-full items-end justify-between gap-1.5 mt-4"
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
					@click="openModels"
					class="mt-2 px-4 py-2 rounded-md"
					variant="outline"
				>
					Open
				</Button>
			</div>
			<div class="mt-2 flex items-center" v-if="!isExternal">
				<ImportModel />
				<Button
					@click="updateModels"
					class="px-4 py-2 ml-2 rounded-md"
					title="Refresh Models"
					variant="secondary"
				>
					<RefreshCw class="w-4 h-4" />
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

			<div class="mt-4 flex flex-col items-center">
				<Button
					type="button"
					@click="reloadPage"
					class="px-4 py-2 rounded-md"
					variant="default"
					>Reload Page</Button
				>
				<RouterLink to="/credits">App Credits</RouterLink>
				<DevOnly>
					<Button type="button" class="px-4 py-2 rounded-md" variant="destructive"
						>Reset & Close App</Button
					>
				</DevOnly>
			</div>
		</div>
	</ScrollArea>
</template>

<style lang="scss"></style>
