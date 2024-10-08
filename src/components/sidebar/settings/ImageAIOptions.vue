<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/src/stores/main';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import OptionSection from './OptionSection.vue';
import ImportModel from '../../ImportModel.vue';

const store = useAppStore();

const updateImageModel = async (model: string) => {
	if (store.settings.selected_model_image === model) return;

	store.settings.selected_model_image = model;
};
const updateChatImageQuality = async (quality: string) => {
	if (store.settings.chat_image_quality === quality) return;

	store.settings.chat_image_quality = quality;
};

const useGpu = computed(
	() =>
		// @ts-ignore
		store.settings.gpu_enabled_image === '1.0' ||
		store.settings.gpu_enabled_image === 1
);
const updateUseGPU = async (boolVal: boolean) => {
	const numVal = boolVal ? 1 : 0;
	if (store.settings.gpu_enabled_image === numVal) return;

	// @ts-ignore
	store.settings.gpu_enabled_image = numVal + '.0';
};

const chatImageEnabled = computed(
	() =>
		// @ts-ignore
		store.settings.chat_image_enabled === '1.0' ||
		store.settings.chat_image_enabled === 1
);
const updateChatImageEnabled = async (boolVal: boolean) => {
	const numVal = boolVal ? 1 : 0;
	if (store.settings.chat_image_enabled === numVal) return;

	// @ts-ignore
	store.settings.chat_image_enabled = numVal + '.0';
};
</script>

<template>
	<AccordionItem value="image-ai-options">
		<AccordionTrigger>Image AI Options</AccordionTrigger>
		<AccordionContent>
			<OptionSection>
				<Label class="flex items-center gap-2">
					<Switch :checked="useGpu" @update:checked="updateUseGPU" />
					Use GPU if available
				</Label>
			</OptionSection>

			<OptionSection
				label="Image Model"
				labelName="image-model"
				orientation="vertical"
			>
				<div class="flex">
					<ImportModel type="image" />

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
				</div>
			</OptionSection>

			<OptionSection
				label="Chat Images"
				labelName="chat-images"
				orientation="vertical"
			>
				<Label class="flex items-center gap-2">
					<Switch
						:checked="chatImageEnabled"
						@update:checked="updateChatImageEnabled"
					/>
					Enable chat images
				</Label>
				<Label class="text-sm flex items-center gap-2">
					Quality
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
				</Label>
			</OptionSection>
		</AccordionContent>
	</AccordionItem>
</template>
