<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '@/src/stores/main';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
} from '@/components/ui/select';
import OptionSection from './OptionSection.vue';

const store = useAppStore();

const updateImageModel = async (model: string) => {
	if (store.settings.selected_model_image === model) return;

	store.settings.selected_model_image = model;
};
const updateChatImageQuality = async (quality: string) => {
	if (store.settings.chat_image_quality === quality) return;

	store.settings.chat_image_quality = quality;
};
</script>

<template>
	<AccordionItem value="image-ai-options">
		<AccordionTrigger>Image AI Options</AccordionTrigger>
		<AccordionContent>
			<OptionSection
				label="Image Model"
				labelName="image-model"
				orientation="vertical"
			>
				<Select
					:default-value="store.settings.selected_model_image"
					@update:model-value="updateImageModel"
					id="image-model"
				>
					<SelectTrigger :title="store.settings.selected_model_image">
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
			</OptionSection>

			<OptionSection
				label="Chat Image Quality"
				labelName="chat-image-quality"
				orientation="vertical"
			>
				<Select
					:default-value="store.settings.chat_image_quality"
					@update:model-value="updateChatImageQuality"
					id="chat-image-quality"
				>
					<SelectTrigger :title="store.settings.chat_image_quality">
						<SelectValue placeholder="Select an image quality" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Image Quality</SelectLabel>
							<SelectItem
								v-for="quality in ['low', 'medium', 'high']"
								:key="quality"
								:value="quality"
							>
								{{ quality }}
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</OptionSection>
		</AccordionContent>
	</AccordionItem>
</template>
