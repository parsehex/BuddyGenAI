<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Button from '@/components/ui/button/Button.vue';
import useElectron from '@/composables/useElectron';
import { useAppStore } from '@/stores/main';

const { openExternalLink } = useElectron();
const store = useAppStore();

defineProps({
	selectedModelProvider: {
		type: String,
		required: true,
	},
	setSelectedModelProvider: {
		type: Function,
		required: true,
	},
});
</script>

<template>
	<Card
		v-if="!store.isModelsSetup"
		class="whitespace-pre-wrap w-full p-2 pt-4 pb-0"
	>
		<CardHeader class="pt-0 pb-0 text-center">
			Welcome! Please answer a few questions before we get started. First...
		</CardHeader>
		<CardContent>
			<div
				class="flex flex-col w-full items-center justify-between gap-1.5 mt-4 pb-0"
			>
				<h2 class="text-lg text-center">
					Would you like to use <b>External (OpenAI)</b> or <b>Local</b> Models?
				</h2>
				<ul class="my-2">
					<li>
						<u>External</u>
						-- currently only OpenAI/ChatGPT is supported
					</li>
					<li>
						<u>Local</u>
						-- uses
						<span
							class="text-blue-500 cursor-pointer hover:underline"
							@click="
								openExternalLink &&
									openExternalLink('https://github.com/Mozilla-Ocho/llamafile')
							"
						>
							{{ 'LlamaFile' }}
						</span>
						+
						<span
							class="text-blue-500 cursor-pointer hover:underline"
							@click="
								openExternalLink &&
									openExternalLink('https://github.com/leejet/stable-diffusion.cpp')
							"
						>
							{{ 'Stable-Diffusion.cpp' }}
						</span>
					</li>
				</ul>

				<div class="flex items-center justify-center gap-2">
					<Button
						@click="
							() => {
								setSelectedModelProvider('external');
								store.modelProvider = 'external';
							}
						"
						:variant="selectedModelProvider === 'external' ? 'default' : 'outline'"
					>
						External
					</Button>
					<Button
						@click="
							() => {
								setSelectedModelProvider('local');
								store.modelProvider = 'local';
							}
						"
						:variant="selectedModelProvider === 'local' ? 'default' : 'outline'"
					>
						Local
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>
</template>
