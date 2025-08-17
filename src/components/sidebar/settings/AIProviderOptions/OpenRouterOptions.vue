<script setup lang="ts">
import { ref } from 'vue';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/src/stores/main';
import OptionSection from '../OptionSection.vue';
import ConnectOpenRouterBtn from '@/src/components/ConnectOpenRouterBtn.vue';

const store = useAppStore();

const apiKey = ref(store.settings.openrouter_api_key);
const updateKey = async () => {
	if (store.settings.openrouter_api_key === apiKey.value) return;
	store.settings.openrouter_api_key = apiKey.value;
};
</script>
<template>
	<OptionSection label="OpenRouter API Key" labelName="api-key" orientation="vertical">
		<Input v-model="apiKey" @blur="updateKey()" id="api-key"
			class="border border-gray-300 dark:border-gray-700 rounded-md p-2" type="text" />
		<ConnectOpenRouterBtn v-if="!apiKey" />
	</OptionSection>
</template>
