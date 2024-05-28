<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import useElectron from '@/composables/useElectron';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAppStore } from '@/stores/main';
import { Button } from '@/components/ui/button';
import DevOnly from '@/components/DevOnly.vue';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion } from '@/components/ui/accordion';

import GeneralOptions from './GeneralOptions.vue';
import ChatAIOptions from './ChatAIOptions.vue';
import ImageAIOptions from './ImageAIOptions.vue';
import TTSOptions from './TTSOptions.vue';
import STTOptions from './STTOptions.vue';

const { pickDirectory, verifyModelDirectory } = useElectron();

const { updateModels } = useAppStore();
const store = useAppStore();

const { settings } = storeToRefs(store);

const error = ref('');

const refreshModels = async () => {
	await updateModels();
};

if (settings.value.local_model_directory) {
	await refreshModels();
}

const reloadPage = () => {
	window.location.reload();
};

const pickModelDirectory = async () => {
	if (!pickDirectory) return console.error('Electron not available');

	if (settings.value.local_model_directory) {
		console.log(
			'Local model directory already set:',
			settings.value.local_model_directory
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
	settings.value.local_model_directory = directory;

	await refreshModels();
};
onMounted(() => {
	if (!settings.value.local_model_directory) {
		pickModelDirectory();
	}
});
</script>

<template>
	<!--
		TODO
		- add option: Advanced -- show advanced options
			- Just have a map of which settings are advanced, conditionally hide (do it in optionselect?)
			- if enabled, hide:
				- global model import
				- models if # of all models === 1 (not default voice / selected_model_tts)
		- (unrelated) add option to Buddies to specify a certain chat model
		-   if the currently active model is not the one specified, switch to it and restart server
	 -->
	<ScrollArea class="h-screen pb-12">
		<Alert v-if="error" variant="destructive">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{{ error }}</AlertDescription>
		</Alert>
		<Accordion class="px-2" type="multiple" collapsible>
			<GeneralOptions />
			<ChatAIOptions />
			<ImageAIOptions />
			<TTSOptions />
			<STTOptions />
		</Accordion>
		<div class="mt-4 flex flex-col items-center">
			<Button
				type="button"
				@click="reloadPage"
				class="px-4 py-2 rounded-md"
				variant="ghost"
				>Reload Page</Button
			>
			<RouterLink to="/credits">App Credits</RouterLink>
			<DevOnly>
				<Button
					type="button"
					class="px-4 py-2 mt-2 rounded-md"
					variant="destructive"
					>Reset & Close App</Button
				>
			</DevOnly>
		</div>
	</ScrollArea>
</template>

<style lang="scss"></style>
