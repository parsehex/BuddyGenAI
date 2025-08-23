<script setup lang="ts">
import { Sidebar } from '@/components/sidebar';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';

defineProps({
	isSetup: {
		type: Boolean,
	}
})
</script>
<template>
	<ResizablePanelGroup direction="horizontal" auto-save-id="main">
		<ResizablePanel v-if="isSetup" class="min-w-min" :default-size="30" :min-size="28" :max-size="35">
			<Sidebar />
		</ResizablePanel>
		<ResizableHandle v-if="isSetup" with-handle />
		<ResizablePanel>
			<RouterView />
		</ResizablePanel>
	</ResizablePanelGroup>
</template>
