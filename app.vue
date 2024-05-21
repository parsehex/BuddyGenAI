<script setup lang="ts">
import './assets/css/index.css';
import Toaster from '@/components/ui/toast/Toaster.vue';
import { Sidebar } from '@/components/sidebar';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import useElectron from '@/composables/useElectron';

const { toggleDevTools } = useElectron();

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
	} else if (key === 'i' && holdingCtrl && holdingShift) {
		e.preventDefault();
		toggleDevTools();
	}
})((window as any).latestAppKeyDownHandlerId);

window.addEventListener('keydown', handleAppKeyDown);
</script>

<template>
	<div
		class="antialiased duration-300 transition-colors text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-950"
	>
		<Suspense>
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel
					class="min-w-min"
					:default-size="22"
					:min-size="20"
					:max-size="35"
				>
					<Sidebar />
				</ResizablePanel>
				<ResizableHandle with-handle />
				<ResizablePanel>
					<RouterView />
				</ResizablePanel>
			</ResizablePanelGroup>
		</Suspense>
		<Toaster />
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
