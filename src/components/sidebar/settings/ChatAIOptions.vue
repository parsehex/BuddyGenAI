<script setup lang="ts">
import { computed, ref } from 'vue';
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
import { Switch } from '@/components/ui/switch';
import OptionSection from './OptionSection.vue';
import ImportModel from '../../ImportModel.vue';

const store = useAppStore();

const isCloud = computed(() => store.settings.selected_provider_chat === 'cloud')

const updateChatModel = async (model: string) => {
	if (store.settings.selected_model_chat === model) return;
	store.settings.selected_model_chat = model;
};

const streaming = computed(() => store.settings.chat_streaming);
const updateStreaming = async (boolVal: boolean) => {
	if (store.settings.chat_streaming === boolVal) return;
	store.settings.chat_streaming = boolVal;
};
</script>
<template>
	<AccordionItem value="chat-ai-options">
		<AccordionTrigger>Chat AI Options</AccordionTrigger>
		<AccordionContent>
			<OptionSection v-if="isCloud" label="Chat Model" labelName="chat-model" orientation="vertical">
				<div class="flex">
					<ImportModel type="chat" />
					<Select :default-value="store.settings.selected_model_chat" @update:model-value="updateChatModel"
						id="chat-model">
						<SelectTrigger :title="store.settings.selected_model_chat">
							<SelectValue placeholder="Select a chat model" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel>Chat Models</SelectLabel>
								<SelectItem v-for="model in store.chatModels" :key="model" :value="model"> {{ model }} </SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</OptionSection>
			<OptionSection>
				<Switch :checked="streaming" @update:checked="updateStreaming" /> Stream AI Resposes
			</OptionSection>
			<!-- TODO could add option for smooth typing -->
		</AccordionContent>
	</AccordionItem>
</template>
