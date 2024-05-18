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
			<div class="flex w-full items-end justify-between gap-1.5 mt-2">
				<Label for="local_model_directory" class="w-full">
					Model Folder
					<Input
						v-model="settings.local_model_directory"
						type="text"
						id="local_model_directory"
						name="local_model_directory"
						class="w-full border border-gray-300 rounded-md p-2 mt-1"
						style="cursor: default !important"
						disabled
					/>
				</Label>
				<Button
					@click="emits('openModelDirectory')"
					class="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md"
				>
					Open Folder
				</Button>
			</div>

			<div class="mt-4 flex items-center gap-2">
				<ImportModel />
				<Button
					@click="updateModels"
					class="bg-green-500 text-white px-4 py-2 rounded-md"
				>
					Update Models
				</Button>
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
