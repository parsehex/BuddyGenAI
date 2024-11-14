<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import './assets/css/index.css';
import { useColorMode } from '@vueuse/core';
import useSettingsLauncher from '@/composables/useSettingsLauncher';
import SettingsPanel from '@/components/settings/SettingsPanel.vue';
import Toaster from '@/components/ui/toast/Toaster.vue';
import { TooltipProvider } from '@/components/ui/tooltip';
import appFeatureSupport from './src/composables/useFeatureSupport';
import ProviderOptions from './src/components/settings/ProviderOptions.vue';

const launcher = useSettingsLauncher();
const featSupport = appFeatureSupport;

const settings = ref({} as any);

onMounted(async () => {
	const cfg = useSettingsLauncher();
	settings.value = await cfg?.getSettings();
});

const refreshSettings = async () => {
	const cfg = useSettingsLauncher();
	settings.value = await cfg?.getSettings();
	console.log('settings', settings.value);
};

useColorMode();

const supports = (type: string) => {
	if (!featSupport) return false;
	return featSupport.featureSupport.value[
		type as keyof typeof featSupport.featureSupport.value
	];
};

const container = ref<HTMLElement | null>(null);
</script>

<template>
	<div
		ref="container"
		class="antialiased duration-300 transition-colors text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-950"
	>
		<TooltipProvider>
			<div class="flex">
				<div class="w-1/3 p-2 border-r border-gray-200 dark:border-gray-800">
					<h2 class="text-center">Feature Support</h2>
					<ul class="p-2 flex gap-2">
						<li :class="supports('chat') ? 'text-green-500' : 'text-red-500'">
							Chat
						</li>
						<li :class="supports('image') ? 'text-green-500' : 'text-red-500'">
							Image
						</li>
						<li :class="supports('tts') ? 'text-green-500' : 'text-red-500'">TTS</li>
						<li :class="supports('whisper') ? 'text-green-500' : 'text-red-500'">
							STT
						</li>
					</ul>
					<h2 class="text-center">API Keys</h2>
					<ProviderOptions />
				</div>
				<div class="flex flex-col h-full w-full">
					<div
						class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800"
					>
						<div class="flex items-center space-x-4">
							<div class="text-2xl font-semibold">Settings</div>
							<button @click="refreshSettings">Refresh</button>
						</div>
					</div>
					<Suspense>
						<SettingsPanel />
					</Suspense>
				</div>
			</div>
			<button @click="launcher?.restartApp()">Restart</button>
			<Toaster />
		</TooltipProvider>
	</div>
</template>
