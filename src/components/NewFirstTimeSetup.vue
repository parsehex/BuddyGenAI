<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAppStore } from '@/stores/main';
import ModelProviderSetupCard from './ModelProviderSetupCard.vue';
import { useToast } from './ui/toast';
import useElectron from '@/composables/useElectron';
import useLlamaCpp from '@/composables/useLlamaCpp';
import SetupChat from './SetupChat.vue';

// @ts-ignore
const { startServer } = useLlamaCpp();
const { openModelsDirectory, verifyModelDirectory } = useElectron();
const { toast } = useToast();
const store = useAppStore();

const selectedModelProvider = ref<string>('');
const setSelctedModelProvider = (value: string) => {
	selectedModelProvider.value = value;
};

onMounted(async () => {
	if (!verifyModelDirectory) return console.error('Electron not available');

	if (!store.settings.local_model_directory) {
		const dir = await verifyModelDirectory();
		if (!dir) {
			throw new Error('Invalid model directory');
		}
		store.settings.local_model_directory = dir;

		await store.updateModels();
	}
});

const checkToStartServer = async () => {
	if (store.chatServerStarting || store.chatServerRunning) return;

	const isExternal = store.modelProvider === 'external';
	if (
		!isExternal &&
		!store.chatServerStarting &&
		!store.chatServerRunning &&
		store.settings.local_model_directory &&
		store.settings.selected_model_chat
	) {
		store.chatServerStarting = true;
		const result = await startServer(
			store.getChatModelPath(),
			store.getNGpuLayers()
		);
		store.chatServerRunning = !result.error;
		store.chatServerStarting = false;

		if (result.error) {
			toast({
				variant: 'destructive',
				title: 'Error starting chat server',
				description: result.error,
			});
		}
	}
};
</script>

<template>
	<ScrollArea class="h-screen">
		<div class="flex flex-col items-center w-full md:w-5/6 mx-auto">
			<img
				v-if="store.newHere"
				class="w-[50px]"
				src="/assets/logo.png"
				alt="BuddyGen Logo"
			/>
			<RouterLink
				class="text-xl font-bold dark:bg-gray-600 rounded-b px-1 mb-2"
				to="/"
			>
				{{ store.newHere ? 'Welcome to' : '' }}
				<div class="underline inline">
					<span style="color: #61dafb">BuddyGen</span>
					<span style="color: #111">AI</span>
				</div>
			</RouterLink>

			<div
				v-if="store.chatServerStarting"
				class="text-center flex flex-col items-center justify-center gap-y-2"
			>
				<Spinner />
				Getting ready...
			</div>

			<ModelProviderSetupCard
				v-if="!store.isModelsSetup"
				:selected-model-provider="selectedModelProvider"
				:set-selected-model-provider="setSelctedModelProvider"
			/>

			<ExternalModelSettingsCard
				v-if="
					!store.isModelsSetup &&
					selectedModelProvider &&
					store.modelProvider === 'external'
				"
				:first-time="store.newHere"
			/>

			<LocalModelSettingsCard
				v-if="
					!store.isModelsSetup &&
					selectedModelProvider &&
					store.modelProvider === 'local'
				"
				:first-time="store.newHere"
				@open-model-directory="openModelsDirectory && openModelsDirectory"
				@model-change="checkToStartServer"
			/>

			<div v-if="!store.chatServerStarting && store.isModelsSetup">
				<SetupChat />
			</div>
		</div>
	</ScrollArea>
</template>
