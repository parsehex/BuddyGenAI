<template>
	<Card class="whitespace-pre-wrap w-full p-2 pt-4">
		<CardHeader class="text-lg pt-0 pb-2 flex flex-row justify-between">
			Local Models Setup
			<span
				class="text-blue-500 cursor-pointer hover:underline"
				@click="
					openExternalLink &&
						openExternalLink(
							'https://github.com/parsehex/BuddyGenAI/blob/main/docs/how-to-setup.md#local-models-setup'
						)
				"
			>
				{{ 'Instructions' }}
			</span>
		</CardHeader>
		<CardContent>
			<p class="my-1 italic">
				Download models and then click <b>Import Models</b> below to choose them.
				<br />
				<span
					class="text-blue-500 cursor-pointer hover:underline"
					@click="
						openExternalLink &&
							openExternalLink(
								'https://github.com/parsehex/BuddyGenAI/blob/main/docs/how-to-setup.md#download-ai-models'
							)
					"
				>
					{{ 'Example Models' }}
				</span>
			</p>
			<div class="mt-4 flex items-center gap-2">
				<!-- model type doesnt matter: -->
				<ImportModel @model-import="emits('modelChange', 'chat')" />
				<!-- <Button
					@click="updateModels"
					class="bg-green-500 text-white px-4 py-2 rounded-md"
				>
					Update Models
				</Button> -->
				<!-- <Button
					type="button"
					@click="emits('openModelDirectory')"
					class="mt-2 px-4 py-2 rounded-md self-center"
					variant="secondary"
				>
					Open Models Folder
				</Button> -->
			</div>
			<div
				class="mt-4"
				:style="{
					visibility: settings.local_model_directory ? 'visible' : 'hidden',
				}"
			>
				<Label for="chat-model" class="mb-1">Chat Model</Label>
				<Select
					v-model="settings.selected_model_chat"
					@update:model-value="emits('modelChange', 'chat')"
					id="chat-model"
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a chat model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Chat Models</SelectLabel>
							<SelectItem v-for="model in chatModels" :key="model" :value="model">
								{{ model }}
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<br />
				<Label for="image-model" class="mb-1">Image Model</Label>
				<Select
					v-model="settings.selected_model_image"
					@update:model-value="emits('modelChange', 'image')"
					id="image-model"
				>
					<SelectTrigger>
						<SelectValue placeholder="Select an image model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Image Models</SelectLabel>
							<SelectItem v-for="model in imageModels" :key="model" :value="model">
								{{ model }}
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
		</CardContent>
	</Card>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/main';

const { openExternalLink } = useElectron();

const props = defineProps<{
	firstTime: boolean;
}>();

const emits = defineEmits(['openModelDirectory', 'modelChange']);

const { settings, chatModels, imageModels, updateModels } = useAppStore();

onBeforeMount(() => {
	updateModels();
});
</script>

<style lang="scss"></style>
