<script setup lang="ts">
import FirstTimeSetup from '@/components/FirstTimeSetup.vue';
import { useToast } from '@/components/ui/toast';
import useLlamaCpp from '@/composables/useLlamaCpp';
import { useAppStore } from '@/stores/main';

const { toast } = useToast();

const {
	settings,
	updateModels,
	updateBuddies,
	updateSettings,
	updateThreads,
	getChatModelPath,
	getNGpuLayers,
} = useAppStore();
const store = useAppStore();

// @ts-ignore
const { startServer } = useLlamaCpp();

await updateBuddies();
await updateThreads();

const userNameValue = ref('');
await updateSettings();
if (settings.user_name && settings.user_name !== 'User') {
	userNameValue.value = settings.user_name;
	console.log(settings);
}

const isModelsSetup = ref(false);

const calcIsModelsSetup = computed(() => {
	const hasModelDir = !!settings.local_model_directory;
	const hasChatModel = !!settings.selected_model_chat;
	const hasImageModel = !!settings.selected_model_image;
	return hasModelDir && hasChatModel && hasImageModel;
});

if (settings.local_model_directory) {
	await updateModels();
}
isModelsSetup.value = calcIsModelsSetup.value;

const handleModelChange = async () => {
	setTimeout(async () => {
		const hasModelDir = !!settings.local_model_directory;
		const hasChatModel = !!settings.selected_model_chat;
		const hasImageModel = !!settings.selected_model_image;
		const isSetup = hasModelDir && hasChatModel && hasImageModel;

		if (isSetup) {
			isModelsSetup.value = true; // hide model setup while waiting
			store.chatServerStarting = true;
			const result = await startServer(getChatModelPath(), getNGpuLayers());
			store.chatServerRunning = !result.error;
			store.chatServerStarting = false;

			if (result.error) {
				toast({
					variant: 'destructive',
					title: 'Error starting chat server',
					description: result.error,
				});
			}
		} else {
			isModelsSetup.value = false;
		}
	}, 10);
};

watch(
	() => settings.local_model_directory,
	async () => {
		await updateModels();
		await handleModelChange();
	}
);
</script>

<template>
	<FirstTimeSetup
		:new-here="false"
		:is-models-setup="isModelsSetup"
		:server-starting="store.chatServerStarting"
		:handle-model-change="handleModelChange"
	/>
</template>

<style lang="scss"></style>
