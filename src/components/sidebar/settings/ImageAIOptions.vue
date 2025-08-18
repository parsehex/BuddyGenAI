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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const store = useAppStore();

const updateChatImageQuality = async (quality: string) => {
	if (store.settings.chat_image_quality === quality) return;
	store.settings.chat_image_quality = quality;
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
</script>
<template>
	<div>
		<OptionSection label="Enable Chat Images" labelName="chat_images_enable" orientation="vertical">
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
