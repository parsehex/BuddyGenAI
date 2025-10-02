<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import './assets/css/index.css';
import Toaster from '@/components/ui/toast/Toaster.vue';
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
import useMobile from '@/composables/useMobile';
import { useColorMode } from '@vueuse/core';
import { delay, isDevMode } from '@/lib/utils';
import { useAppStore } from '@/stores/main';
import { Label } from '@/components/ui/label';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSettings } from '@/lib/api/AppSettings';
import DesktopLayout from './src/layout/desktop.vue';
import MobileLayout from './src/layout/mobile.vue';
import { isFeatureAvailable } from './src/lib/ai/support';
import LogDashboard from '@/components/LogDashboard.vue';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-vue-next';
import { VisuallyHidden } from 'reka-ui';

const store = useAppStore();
const device = useMobile();

useColorMode();

const { closeApp } = useElectron();

// TODO
// 1 - maybe remove the current dialog
// 2 - add a dialog if the user is on mobile, warning about the layout

const skipDialog = computed(() => store.settings.skip_start_dialog);
const enteredApp = ref(skipDialog.value ? 1 : 0);

const isSetup = computed(() => {
	// const isDefaultUserName = store.settings.user_name?.toLowerCase() === 'user';
	// const hasThreads = store.threads.length > 0;
	// const hasBuddies = store.buddies.length > 0;
	// if (!isDefaultUserName || hasBuddies || hasThreads) return true;

	// if (!isFeatureAvailable('chat')) return false; // TODO is not reactive
	// const skippedSetup = +store.settings.skip_setup;
	// if (skippedSetup) return true;
	// if (!hasBuddies && !isDefaultUserName && !hasThreads) return false;
	return true;
});

onMounted(async () => {
	await AppSettings.waitForLoaded();
	await delay(15);
	if (store.settings.skip_start_dialog) enteredApp.value = 1;
});

const updateSkipDialog = () => {
	store.settings.skip_start_dialog = true;
};

const container = ref<HTMLElement | null>(null);
</script>
<template>
	<div ref="container"
		class="antialiased duration-300 transition-colors text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-950">
		<TooltipProvider>
			<Suspense v-if="enteredApp === 1">
				<DesktopLayout v-if="!device.isMobile.value" :is-setup="isSetup" />
				<MobileLayout v-else :is-setup="isSetup" />
			</Suspense>
			<AlertDialog :open="enteredApp === 0">
				<AlertDialogContent :portal-to="container">
					<AlertDialogHeader>
						<AlertDialogTitle>Discretion is Advised - AI Content</AlertDialogTitle>
						<AlertDialogDescription> This app generates content with AI from what you type, which might have unexpected
							reults. <br /> Use good judgement and act responsiblly with what you create! <br /><br />
							<p class="text-lg py-1 font-bold text-center">Continue?</p>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel @click="closeApp"> No / Exit </AlertDialogCancel>
						<AlertDialogAction @click="
							() => {
								enteredApp = 1;
								updateSkipDialog();
							}
						"> Yes / Enter </AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<Toaster />
			<Dialog v-if="isDevMode()">
				<DialogTrigger as-child>
					<Button variant="warning" class="px-4 py-6 fixed bottom-4 right-16 z-50 opacity-95">
						<Bug class="h-g w-6" />
					</Button>
				</DialogTrigger>
				<DialogContent class="sm:max-w-[800px] h-[90vh] p-0">
					<VisuallyHidden>
						<DialogTitle>Application Logs</DialogTitle>
						<DialogDescription>Logs that this app has generated. For debugging purposes.</DialogDescription>
					</VisuallyHidden>
					<LogDashboard />
				</DialogContent>
			</Dialog>
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
