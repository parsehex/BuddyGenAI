<template>
	<Card class="whitespace-pre-wrap w-full p-2 pt-4">
		<CardHeader class="text-lg pt-0 pb-2 flex flex-row justify-between">
			External (OpenAI) Models Setup
			<span
				class="text-blue-500 cursor-pointer hover:underline"
				@click="
					openExternalLink &&
						openExternalLink(
							'https://github.com/parsehex/BuddyGenAI/blob/main/docs/how-to-setup.md#openai-models-setup'
						)
				"
			>
				{{ 'Instructions' }}
			</span>
		</CardHeader>
		<CardContent>
			<p v-if="firstTime">
				We'll use OpenAI to run models for you once you add an API Key below.
				<br />
				You'll need to sign up for an OpenAI account and set billing information to
				use external models.
				<br />
				See OpenAI's
				<a
					class="text-blue-500 cursor-pointer hover:underline"
					@click="
						openExternalLink &&
							openExternalLink(
								'https://openai.com/enterprise-privacy/#2Hc3bUMJHSPrw3aDCS8hYA-button'
							)
					"
				>
					{{ 'API data privacy page' }}
				</a>
				for info about usage of your data when you use External (OpenAI) models.
			</p>

			<div class="mt-4">
				<Label for="external_api_key" class="mb-1 flex items-center gap-2">
					OpenAI API Key
					<OpenAIAPIKeyHelpButton />
				</Label>
				<Input
					v-model="settings.external_api_key"
					@update:model-value="emits('modelChange', 'external_api_key')"
					id="external_api_key"
					class="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2"
				/>
			</div>

			<div class="mt-4" v-if="settings.external_api_key.length > 10">
				<Button
					@click="updateModels"
					class="bg-green-500 text-white px-4 py-2 rounded-md"
				>
					Update Models
				</Button>
				<br />
				<br />
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
import { onBeforeMount } from 'vue';
import useElectron from '@/composables/useElectron';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
} from '@/components/ui/select';
import OpenAIAPIKeyHelpButton from '@/components/OpenAIAPIKeyHelpButton.vue';
import { useAppStore } from '@/stores/main';

const { openExternalLink } = useElectron();

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
