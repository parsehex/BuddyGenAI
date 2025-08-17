<script setup lang="ts">
import { Button } from '@/src/components/ui/button'; // Adjust path as needed
import { exportDatabaseToZip } from '@/src/lib/db/export'; // Adjust path as needed
import { ref } from 'vue';

const isExporting = ref(false);
const exportError = ref<string | null>(null);

async function handleExport() {
	isExporting.value = true;
	exportError.value = null;
	try {
		await exportDatabaseToZip();
	} catch (error: any) {
		console.error('Failed to export database:', error);
		exportError.value = `Export failed: ${error.message || 'Unknown error'}`;
	} finally {
		isExporting.value = false;
	}
}
</script>
<template>
	<div>
		<!-- TODO
		 options for controling zip structure (figure out way to still allow import?) -->
		<Button @click="handleExport" :disabled="isExporting"> {{ isExporting ? 'Exporting...' : 'Export Data' }} </Button>
		<p v-if="exportError" class="text-red-500 mt-2">{{ exportError }}</p>
	</div>
</template>
