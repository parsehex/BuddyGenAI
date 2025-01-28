<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import './assets/css/index.css';
import Toaster from '@/components/ui/toast/Toaster.vue';
import { Sidebar } from '@/components/sidebar';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import useElectron from '@/composables/useElectron';
import { useColorMode } from '@vueuse/core';
import { delay, isDevMode } from '@/lib/utils';
import { useAppStore } from '@/stores/main';
import { Label } from '@/components/ui/label';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSettings } from '@/lib/api/AppSettings';

const store = useAppStore();

useColorMode();

const { toggleDevTools, closeApp } = useElectron();

const skipDialog = computed(
	() =>
		// @ts-ignore
		store.settings.skip_start_dialog === '1.0' ||
		// @ts-ignore
		store.settings.skip_start_dialog === '1' ||
		store.settings.skip_start_dialog === 1
);
const enteredApp = ref(skipDialog.value ? 1 : 0);
const initialSkipDialog = skipDialog.value;
const isMounted = ref(false);

const isSetup = computed(() => {
	const key = AppSettings.get('openrouter_api_key') as string;
	return !!key;
})

onMounted(async () => {
	await AppSettings.waitForLoaded();
	if (AppSettings.get('skip_start_dialog')) enteredApp.value = 1;
	isMounted.value = true;

	console.log(AppSettings.get('skip_start_dialog'));
});

(window as any).latestAppKeyDownHandlerId = Math.random();
const handleAppKeyDown = ((id) => async (e: KeyboardEvent) => {
	if (!toggleDevTools) return console.error('useElectron not available');
	if (id !== (window as any).latestAppKeyDownHandlerId) return;

	const key = e.key.toLowerCase();

	const holdingCtrl = e.metaKey || e.ctrlKey;
	const holdingShift = e.altKey || e.shiftKey;

	if (key === 'r' && holdingCtrl && !holdingShift) {
		e.preventDefault();
		window.location.reload();
	} else if (key === 'i' && holdingCtrl && holdingShift && !isDevMode()) {
		e.preventDefault();
		toggleDevTools();
	}
})((window as any).latestAppKeyDownHandlerId);

window.addEventListener('keydown', handleAppKeyDown);

const doCloseApp = () => {
	if (closeApp) closeApp();
};

const updateSkipDialog = async () => {
	AppSettings.set('skip_start_dialog', 1);
	AppSettings.saveSettings();
};

const container = ref<HTMLElement | null>(null);
</script>

<template>
	<div
		ref="container"
		class="antialiased duration-300 transition-colors text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-950"
	>
		<TooltipProvider>
			<Suspense v-if="enteredApp === 1">
				<ResizablePanelGroup direction="horizontal">
					<ResizablePanel
						v-if="isSetup"
						class="min-w-min"
						:default-size="22"
						:min-size="20"
						:max-size="35"
					>
						<Sidebar />
					</ResizablePanel>
					<ResizableHandle v-if="isSetup" with-handle />
					<ResizablePanel>
						<RouterView />
					</ResizablePanel>
				</ResizablePanelGroup>
			</Suspense>
			<AlertDialog :open="enteredApp === 0">
				<AlertDialogContent :portal-to="container" v-if="isMounted">
					<AlertDialogHeader>
						<AlertDialogTitle>Discretion is Advised</AlertDialogTitle>
						<AlertDialogDescription>
							This app generates content with AI based on what you type, which might
							have unexpected reults.
							<br />
							Use good judgement and be responsible with the content that you
							create!
							<br /><br />
							<b class="text-lg py-1">Continue?</b>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel @click="doCloseApp"> No / Exit </AlertDialogCancel>
						<AlertDialogAction
							@click="
								() => {
									enteredApp = 1;
									updateSkipDialog();
								}
							"
						>
							Yes / Enter
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<Toaster />
		</TooltipProvider>
	</div>
</template>

<style>
html,
body {
	@apply h-screen w-screen overflow-y-hidden;
}
.info {
	@apply bg-blue-400 text-white font-bold;
}
.border-info {
	@apply border-blue-700;
}
.info-foreground {
	@apply text-blue-400 bg-white;
}

.success {
	@apply bg-green-400 text-black font-bold;
}
.border-success {
	@apply border-green-700;
}
.success-foreground {
	@apply text-green-400 bg-white;
}

.magic {
	@apply bg-purple-400 text-black font-bold;
}
</style>
