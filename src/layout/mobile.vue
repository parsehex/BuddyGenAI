<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
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
import { useRoute } from 'vue-router/auto';

const route = useRoute();

defineProps({
	isSetup: {
		type: Boolean,
	}
})

const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

watch(
	() => route.path,
	() => {
		isSidebarOpen.value = false;
	}
);
</script>

<template>
<div class="flex flex-col h-full">
	<!-- Main Content -->
	<div class="flex-1 overflow-auto">
		<RouterView />
	</div>

	<!-- Mobile Sidebar Toggle Button -->
	<button
		v-if="isSetup"
		@click="toggleSidebar"
		class="fixed bottom-4 left-4 z-50 p-3 rounded-full bg-teal-500 text-primary-foreground shadow-lg opacity-70"
	>
		<img src="/assets/menu-deep.svg" v-if="!isSidebarOpen" />
		<img src="/assets/x.svg" v-else />
	</button>

	<!-- Mobile Sidebar -->
	<div
		v-if="isSetup"
		class="fixed bottom-0 left-0 right-0 bg-background z-40"
		:class="[
			isSidebarOpen ? 'translate-y-0' : 'translate-y-full',
			'transition-transform duration-300 ease-in-out'
		]"
		style="max-height: 40vh"
	>
		<div class="overflow-auto h-full">
			<Sidebar />
		</div>
	</div>
</div>
</template>
