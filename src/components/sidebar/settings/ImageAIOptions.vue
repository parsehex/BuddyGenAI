<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '@/src/stores/main';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import OptionSection from './OptionSection.vue';
import { RefreshCcw } from 'lucide-vue-next';
import { useImgAI } from '@/src/composables/ai/useImgAI';
import { Separator } from '../../ui/separator';
import { Label } from '../../ui/label';

const store = useAppStore();
const imgAI = useImgAI();

const isSwarmUI = computed(() => store.settings.selected_provider_image === 'swarmui');

const updateModel = async (model: string) => {
	if (store.settings.selected_model_image === model) return;
	store.settings.selected_model_image = model;
};

const chatImageEnabledChat = computed({
	get: () => store.settings.chat_image_enabled ? 'true' : 'false',
	set: (val: string) => {
		if (val === store.settings.chat_image_enabled + '') return;
		const b = val === 'true';
		if (b === store.settings.chat_image_enabled) return;
		store.settings.chat_image_enabled = b;
	},
});

const updateChatImageQuality = async (quality: string) => {
	if (store.settings.chat_image_quality === quality) return;
	store.settings.chat_image_quality = quality;
};
</script>
<template>
	<div>
		<OptionSection v-if="isSwarmUI" label="Image Model" labelName="image-model" orientation="vertical">
			<div class="flex items-center gap-2">
				<Select :default-value="store.settings.selected_model_image" @update:model-value="updateModel" id="image-model">
					<SelectTrigger :title="store.settings.selected_model_image">
						<SelectValue placeholder="Select a image model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Image Models</SelectLabel>
							<SelectItem v-for="model in imgAI.availModels" :key="model.model_id" :value="model.model_id"> {{
								model.model_id }} </SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<Button type="button" variant="ghost" @click="imgAI.updateModels">
					<RefreshCcw />
				</Button>
			</div>
		</OptionSection>
		<Separator />
		<OptionSection label="Enable Chat Images" labelName="chat_images_enable">
			<RadioGroup :default-value="chatImageEnabledChat" v-model="chatImageEnabledChat" id="chat_images_enable"
				class="flex flex-row">
				<div class="flex items-center space-x-2">
					<RadioGroupItem id="yes" value="true">Yes</RadioGroupItem>
					<Label for="yes" class="block">Yes</Label>
				</div>
				<div class="flex items-center space-x-2">
					<RadioGroupItem id="no" value="false">No</RadioGroupItem>
					<Label for="no" class="block">No</Label>
				</div>
			</RadioGroup>
		</OptionSection>
		<OptionSection v-if="chatImageEnabledChat === 'true'" label="Chat Image Quality" labelName="chat-images"
			orientation="vertical">
			<Select :default-value="store.settings.chat_image_quality" @update:model-value="updateChatImageQuality"
				id="chat-image-quality">
				<SelectTrigger :title="store.settings.chat_image_quality">
					<SelectValue placeholder="Select an image quality" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>Image Quality</SelectLabel>
						<SelectItem v-for="quality in ['low', 'medium', 'high']" :key="quality" :value="quality"> {{ quality }}
						</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
		</OptionSection>
	</div>
</template>
