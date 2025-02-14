<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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

defineProps({
	isSetup: {
		type: Boolean,
	}
})
</script>

<template>
	<ResizablePanelGroup direction="horizontal">
		<ResizablePanel
			v-if="isSetup"
			class="min-w-min"
			:default-size="30"
			:min-size="28"
			:max-size="35"
		>
			<Sidebar />
		</ResizablePanel>
		<ResizableHandle v-if="isSetup" with-handle />
		<ResizablePanel>
			<RouterView />
		</ResizablePanel>
	</ResizablePanelGroup>
</template>
