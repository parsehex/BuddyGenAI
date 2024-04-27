<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { useToast } from '@/components/ui/toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Spinner from '@/components/Spinner.vue';
import FirstTimeSetup from '@/components/FirstTimeSetup.vue';
import useLlamaCpp from '@/composables/useLlamaCpp';
import type { PersonaVersionMerged } from '@/lib/api/types-db';
import api from '@/lib/api/db';
import urls from '@/lib/api/urls';
import { useAppStore } from '@/stores/main';

const {
	chatServerRunning,
	chatModels,
	imageModels,
	personas,
	settings,
	threads,
	updateModels,
	updatePersonas,
	updateSettings,
	updateThreads,
	getChatModelPath,
	mkdir,
} = useAppStore();

// @ts-ignore
const { startServer, stopServer, isServerRunning } = useLlamaCpp();

await updatePersonas();
await updateThreads();

const userNameValue = ref('');
const personaName = ref('');
const personaKeywords = ref('');
const createdDescription = ref('');
const profilePicturePrompt = ref('');

const acceptedPersona = ref('' as '' | 'description' | 'keywords');
const newPersona = ref(null as PersonaVersionMerged | null);
const updatingProfilePicture = ref(false);

const relationshipToBuddy = ref('');

// TODO figure out temporary pics
const profilePictureValue = ref('');

const newHere = computed(
	() => !!+settings.fresh_db || (!threads.length && !personas.length)
);

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

const serverStarting = ref(false);
const handleModelChange = async () => {
	setTimeout(async () => {
		const hasModelDir = !!settings.local_model_directory;
		const hasChatModel = !!settings.selected_model_chat;
		const hasImageModel = !!settings.selected_model_image;
		const isSetup = hasModelDir && hasChatModel && hasImageModel;

		if (isSetup) {
			isModelsSetup.value = true; // hide model setup while waiting
			serverStarting.value = true;
			await startServer(getChatModelPath());
			serverStarting.value = false;
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
		:server-starting="serverStarting"
		:handle-model-change="handleModelChange"
	/>
</template>

<style lang="scss"></style>
