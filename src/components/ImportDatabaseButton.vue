<script setup lang="ts">
import { Button } from '@/src/components/ui/button';
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
} from '@/src/components/ui/alert-dialog';
import { importDatabaseFromZip } from '@/src/lib/db/import';
import { ref } from 'vue';

const selectedFile = ref<File | null>(null);
const isImporting = ref(false);
const importError = ref<string | null>(null);
const importSuccess = ref(false);
const showConfirmDialog = ref(false); // Controls AlertDialog visibility

const fileInputRef = ref<HTMLInputElement | null>(null);

function handleFileChange(event: Event) {
	const input = event.target as HTMLInputElement;
	if (input.files && input.files.length > 0) {
		selectedFile.value = input.files[0];
		importError.value = null; // Clear previous errors
		importSuccess.value = false; // Clear previous success
		showConfirmDialog.value = true; // Show confirmation dialog after file selection
	} else {
		selectedFile.value = null;
		showConfirmDialog.value = false; // Hide dialog if no file selected
	}
}

function triggerFileInput() {
	fileInputRef.value?.click();
}

async function confirmAndImport() {
	if (!selectedFile.value) {
		importError.value = 'No file selected for import.';
		showConfirmDialog.value = false; // Close dialog if no file
		return;
	}

	isImporting.value = true;
	importError.value = null;
	importSuccess.value = false;

	try {
		await importDatabaseFromZip(selectedFile.value);
		importSuccess.value = true;
		selectedFile.value = null; // Clear selected file after successful import
		if (fileInputRef.value) {
			fileInputRef.value.value = ''; // Clear the file input
		}
	} catch (error: any) {
		console.error('Failed to import database:', error);
		importError.value = `Import failed: ${error.message || 'Unknown error'}`;
	} finally {
		isImporting.value = false;
		showConfirmDialog.value = false; // Always close dialog after import attempt
	}
}

function handleCancel() {
	selectedFile.value = null; // Clear selected file if user cancels
	if (fileInputRef.value) {
		fileInputRef.value.value = ''; // Clear the file input
	}
	showConfirmDialog.value = false;
}
</script>
<template>
	<div>
		<!-- Hidden file input -->
		<input type="file" ref="fileInputRef" @change="handleFileChange" accept=".zip" class="hidden" />
		<!-- Main button to trigger file selection -->
		<Button @click="triggerFileInput" :disabled="isImporting"> {{ isImporting ? 'Importing...' : 'Import Data' }}
		</Button>
		<!-- Confirmation Dialog -->
		<AlertDialog :open="showConfirmDialog" @update:open="showConfirmDialog = $event">
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription> This action cannot be undone. This will clear your current database and replace it
						with the data from the selected ZIP file ({{ selectedFile?.name || 'No file selected' }}). Any existing data
						will be lost. </AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel @click="handleCancel" :disabled="isImporting">Cancel</AlertDialogCancel>
					<AlertDialogAction @click="confirmAndImport" :disabled="isImporting"> Continue </AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
		<p v-if="importError" class="text-red-500 mt-2">{{ importError }}</p>
		<p v-if="importSuccess" class="text-green-500 mt-2">Database imported successfully!</p>
	</div>
</template>
