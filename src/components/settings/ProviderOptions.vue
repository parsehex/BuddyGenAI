<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import OptionSection from './OptionSection.vue';
import appConfig, { type Config } from '@/src/composables/useConfig';
import { delay } from '@/src/lib/utils';

const openaiKey = ref('');
const togetheraiKey = ref('');
const aimlapiKey = ref('');
const elevenlabsKey = ref('');
const deepinfraKey = ref('');

onMounted(async () => {
	await delay(10);
	openaiKey.value = appConfig?.config.value.openai_api_key || '';
	togetheraiKey.value = appConfig?.config.value.togetherai_api_key || '';
	aimlapiKey.value = appConfig?.config.value.aimlapi_api_key || '';
	elevenlabsKey.value = appConfig?.config.value.elevenlabs_api_key || '';
	deepinfraKey.value = appConfig?.config.value.deepinfra_api_key || '';
});

const updateOpenaiKey = async (key: string) => {
	const newCfg = {
		...appConfig?.config.value,
		openai_api_key: key,
	} as Config;
	await appConfig?.updateConfig(newCfg);
	openaiKey.value = key;
};
const updateTogetheraiKey = async (key: string) => {
	const newCfg = {
		...appConfig?.config.value,
		togetherai_api_key: key,
	} as Config;
	await appConfig?.updateConfig(newCfg);
	togetheraiKey.value = key;
};
const updateAimlapiKey = async (key: string) => {
	const newCfg = {
		...appConfig?.config.value,
		aimlapi_api_key: key,
	} as Config;
	await appConfig?.updateConfig(newCfg);
	aimlapiKey.value = key;
};
const updateElevenlabsKey = async (key: string) => {
	const newCfg = {
		...appConfig?.config.value,
		elevenlabs_api_key: key,
	} as Config;
	await appConfig?.updateConfig(newCfg);
	elevenlabsKey.value = key;
};
const updateDeepinfraKey = async (key: string) => {
	const newCfg = {
		...appConfig?.config.value,
		deepinfra_api_key: key,
	} as Config;
	await appConfig?.updateConfig(newCfg);
	deepinfraKey.value = key;
};
</script>

<template>
	<div>
		<OptionSection
			label="OpenAI"
			labelName="openai"
			title="Supports Chat, Image, TTS, and STT models"
			orientation="vertical"
		>
			<Input
				v-model="openaiKey"
				@update:model-value="(v) => updateOpenaiKey(v as string)"
				type="text"
				id="openai"
				name="openai"
				class="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 mt-1"
			/>
		</OptionSection>

		<br />
		<p>More providers coming soon!</p>

		<!-- <OptionSection
			label="TogetherAI"
			labelName="togetherai"
			title="Supports Chat and Image models"
			orientation="vertical"
		>
			<Input
				v-model="togetheraiKey"
				@update:model-value="(v) => updateTogetheraiKey(v as string)"
				type="text"
				id="togetherai"
				name="togetherai"
				class="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 mt-1"
			/>
		</OptionSection>

		<OptionSection
			label="AI/ML"
			labelName="aimlapi"
			title="Supports Chat, Image, and STT models"
			orientation="vertical"
		>
			<Input
				v-model="aimlapiKey"
				@update:model-value="(v) => updateAimlapiKey(v as string)"
				type="text"
				id="aimlapi"
				name="aimlapi"
				class="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 mt-1"
			/>
		</OptionSection>

		<OptionSection
			label="ElevenLabs"
			labelName="elevenlabs"
			title="Supports TTS models"
			orientation="vertical"
		>
			<Input
				v-model="elevenlabsKey"
				@update:model-value="(v) => updateElevenlabsKey(v as string)"
				type="text"
				id="elevenlabs"
				name="elevenlabs"
				class="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 mt-1"
			/>
		</OptionSection>

		<OptionSection
			label="DeepInfra"
			labelName="deepinfra"
			title="Supports Chat, Image, TTS, and STT models"
			orientation="vertical"
		>
			<Input
				v-model="deepinfraKey"
				@update:model-value="(v) => updateDeepinfraKey(v as string)"
				type="text"
				id="deepinfra"
				name="deepinfra"
				class="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 mt-1"
			/>
		</OptionSection> -->
	</div>
</template>
