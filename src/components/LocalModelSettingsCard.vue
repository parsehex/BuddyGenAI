<script setup lang="ts">
import { onBeforeMount, onMounted } from 'vue';
import useElectron from '@/composables/useElectron';
import { useAppStore } from '@/stores/main';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
	SelectValue,
} from '@/components/ui/select';
import ImportModel from '@/components/ImportModel.vue';
import useLlamaCpp from '@/composables/useLlamaCpp';
import ImportModelPack from './ImportModelPack.vue';
import { Button } from './ui/button';
import appConfig from '@/composables/useConfig';

const { openExternalLink } = useElectron();

const props = defineProps<{
	firstTime: boolean;
}>();

const emits = defineEmits(['openModelDirectory']);

const { updateModels } = useAppStore();
const store = useAppStore();

onMounted(() => {
	// updateModels();
	setTimeout(() => {
		updateModels();
	}, 250);

	const chatProvider = appConfig?.getActiveProvider('chat');
	const chatModel = appConfig?.modelPath('chat');
	const hasChat = chatProvider && chatModel;
	const imageProvider = appConfig?.getActiveProvider('image');
	const imageModel = appConfig?.modelPath('image');
	const hasImage = imageProvider && imageModel;
	if (hasChat && hasImage) {
		store.proceed = true;
	}
});

const onChatModelChange = () => {
	const selectedChatModel = appConfig?.modelPath('chat');
	if (!selectedChatModel) return;

	const llamaCpp = useLlamaCpp();
	if (!llamaCpp) return;

	store.chatServerStarting = true;

	const gpuLayers = appConfig?.config.value.n_gpu_layers;

	llamaCpp.startServer(selectedChatModel, gpuLayers);

	store.chatServerStarting = false;
};
</script>

<template>
	<Card class="whitespace-pre-wrap w-full p-2 pt-4">
		<CardHeader class="text-lg pt-0 pb-2 flex flex-row justify-between">
			Local Models Setup
		</CardHeader>
		<CardContent>
			<p class="my-1">
				<span
					class="text-blue-500 cursor-pointer hover:underline"
					@click="
						openExternalLink &&
							openExternalLink(
								'https://github.com/parsehex/BuddyGenAI/blob/main/docs/getting-started.md#getting-started-with-buddygenai'
							)
					"
				>
					{{ 'Help: Getting Started with BuddyGenAI' }}
				</span>
			</p>
			<div class="mt-4 flex items-center gap-2">
				<ImportModel @model-import="onChatModelChange" />
				<ImportModelPack />
			</div>
			<div
				class="mt-4"
				:style="{
					visibility: store.settings.local_model_directory ? 'visible' : 'hidden',
				}"
			>
				<Label for="chat-model" class="mb-1">Chat Model</Label>
				<Select
					v-model="store.settings.selected_model_chat"
					@update:model-value="onChatModelChange"
					id="chat-model"
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a chat model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Chat Models</SelectLabel>
							<SelectItem
								v-for="model in store.chatModels"
								:key="model"
								:value="model"
							>
								{{ model }}
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<br />
				<Label for="image-model" class="mb-1">Image Model</Label>
				<Select v-model="store.settings.selected_model_image" id="image-model">
					<SelectTrigger>
						<SelectValue placeholder="Select an image model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Image Models</SelectLabel>
							<SelectItem
								v-for="model in store.imageModels"
								:key="model"
								:value="model"
							>
								{{ model }}
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<br />
				<Label for="tts-model" class="mb-1">Default TTS Voice</Label>
				<Select v-model="store.settings.selected_model_tts" id="tts-model">
					<SelectTrigger>
						<SelectValue placeholder="Select a TTS voice" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>TTS Voices</SelectLabel>
							<SelectItem value="0">Disabled</SelectItem>

							<SelectItem v-for="model in store.ttsModels" :key="model" :value="model">
								{{ model }}
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<br />
				<Label for="stt-model" class="mb-1">STT Model</Label>
				<Select v-model="store.settings.selected_model_whisper" id="stt-model">
					<SelectTrigger>
						<SelectValue placeholder="Select an STT model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>STT Models</SelectLabel>
							<SelectItem value="0">Disabled</SelectItem>

							<SelectItem
								v-for="model in store.whisperModels"
								:key="model"
								:value="model"
							>
								{{ model }}
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>

				<span
					class="mt-4 inline-block"
					:title="
						!store.settings.selected_model_chat ||
						!store.settings.selected_model_image
							? 'Please select at least a chat and image model first.'
							: ''
					"
				>
					<Button
						type="button"
						:disabled="
							!store.settings.selected_model_chat ||
							!store.settings.selected_model_image
						"
						@click="store.proceed = true"
					>
						Continue
					</Button>
				</span>
			</div>
		</CardContent>
	</Card>
</template>

<style lang="scss"></style>
