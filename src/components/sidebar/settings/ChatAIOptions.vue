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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import OptionSection from './OptionSection.vue';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useChatAI } from '@/src/composables/ai/useChatAI';
import { RefreshCcw } from 'lucide-vue-next';

const store = useAppStore();
const chatAI = useChatAI();

const isOpenRouter = computed(() => store.settings.selected_provider_chat === 'openrouter');
const isOllama = computed(() => store.settings.selected_provider_chat === 'ollama');

const updateChatModel = async (model: string) => {
	if (store.settings.selected_model_chat === model) return;
	store.settings.selected_model_chat = model;
};

const streaming = computed({
	get: () => store.settings.chat_streaming ? 'true' : 'false',
	set: (val: string) => {
		if (val === store.settings.chat_streaming + '') return;
		const b = val === 'true';
		if (b === store.settings.chat_streaming) return;
		store.settings.chat_streaming = b;
	},
});
</script>
<template>
	<div>
		<OptionSection v-if="isOpenRouter || isOllama" label="Chat Model" labelName="chat-model" orientation="vertical">
			<div class="flex items-center gap-2">
				<Select :default-value="store.settings.selected_model_chat" @update:model-value="updateChatModel"
					id="chat-model">
					<SelectTrigger :title="store.settings.selected_model_chat">
						<SelectValue placeholder="Select a chat model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Chat Models</SelectLabel>
							<SelectItem v-for="model in chatAI.availModels" :key="model.model_id" :value="model.model_id"> {{
								model.model_id }} </SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<Button type="button" variant="ghost" @click="chatAI.updateModels">
					<RefreshCcw />
				</Button>
			</div>
		</OptionSection>
		<OptionSection label="Stream AI Responses" labelName="chat_images_enable" orientation="vertical">
			<RadioGroup :default-value="streaming" v-model="streaming" class="flex flex-row" id="chat_images_enable">
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
		<!-- TODO could add option for smooth typing -->
	</div>
</template>
