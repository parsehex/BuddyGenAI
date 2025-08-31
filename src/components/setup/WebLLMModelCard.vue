<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/src/stores/main';
import { getModels, loadModel } from '@/src/lib/ai/chat/webllm';
import { AppSettings } from '@/src/lib/api/AppSettings';
import type { InitProgressReport } from '@mlc-ai/web-llm';

const emits = defineEmits(['completed']);
const store = useAppStore()

const selectedModel = ref(AppSettings.get('selected_model_chat') as string || '');
const models = ref<{ model_id: string; model_url: string }[]>([]);
const loading = ref(true);
const initProgress = ref('Initializing...');

onMounted(async () => {
	try {
		models.value = await getModels();
		loading.value = false;
		const model = AppSettings.get('selected_model_chat') as string;
		if (model) selectedModel.value = model;
	} catch (error) {
		console.error("Failed to load WebLLM models:", error);
		initProgress.value = "Failed to load models. Please check your browser compatibility.";
		loading.value = false;
	}
});

async function load() {
	if (!selectedModel.value) {
		alert('Please select a model.');
		return;
	}

	initProgress.value = 'Loading model...';
	const initProgressCallback = (report: InitProgressReport) => {
		initProgress.value = report.text;
	};

	try {
		const engine = await loadModel(selectedModel.value, initProgressCallback);
		console.log('WebLLM engine initialized:', engine);
		store.settings.selected_provider_chat = 'webllm';
		store.settings.selected_model_chat = selectedModel.value;
		emits('completed');
	} catch (error: any) {
		console.error("Failed to initialize WebLLM engine:", error);
		initProgress.value = `Failed to load model: ${error.message}`;
	}
}
</script>
<template>
	<Card>
		<CardHeader>
			<h4 class="text-lg font-semibold">WebLLM Model</h4>
		</CardHeader>
		<CardContent>
			<p class="mb-4">Select a model to run directly in your browser. This may require a one-time download.</p>
			<div v-if="loading" class="text-center">
				<p>{{ initProgress }}</p>
			</div>
			<div v-else>
				<Select v-model="selectedModel">
					<SelectTrigger class="w-full">
						<SelectValue placeholder="Select a model" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem v-for="model in models" :key="model.model_id" :value="model.model_id"> {{ model.model_id }}
						</SelectItem>
					</SelectContent>
				</Select>
				<p v-if="initProgress && initProgress !== 'Initializing...'" class="text-sm text-muted-foreground mt-2"> {{
					initProgress }} </p>
			</div>
		</CardContent>
		<CardFooter class="flex justify-end">
			<Button @click="load" :disabled="!selectedModel || loading"> Load Model </Button>
		</CardFooter>
	</Card>
</template>
