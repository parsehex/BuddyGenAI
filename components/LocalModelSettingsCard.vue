<template>
	<Card class="whitespace-pre-wrap w-full md:w-1/2 p-2 pt-4">
		<CardHeader class="pt-0 pb-2">Local Model Setup</CardHeader>
		<CardContent>
			<p v-if="firstTime" class="text-center">
				<code class="font-bold">Models</code>
				let your Buddies respond to you with words, and they let you create a face
				for your Buddy.
				<br />
				You'll need to download these models and tell BuddyGen where to find them.
			</p>
			<div class="flex w-full items-center justify-between gap-1.5 mt-4">
				<Label for="local_model_directory" class="w-full">
					Local Model Directory
					<Input
						v-model="settings.local_model_directory"
						type="text"
						id="local_model_directory"
						name="local_model_directory"
						class="w-full border border-gray-300 rounded-md p-2 mt-1"
						disabled
					/>
				</Label>
				<Button
					@click="emits('pickModelDirectory')"
					class="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md"
				>
					Pick Directory
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
import { useAppStore } from '~/stores/main';

const props = defineProps<{
	firstTime: boolean;
}>();

const emits = defineEmits(['pickModelDirectory', 'modelChange']);

const { settings, chatModels, imageModels, updateModels } = useAppStore();

onBeforeMount(() => {
	updateModels();
});
</script>

<style lang="scss"></style>
