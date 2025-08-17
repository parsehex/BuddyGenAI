<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import useElectron from '@/composables/useElectron';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAppStore } from '@/stores/main';
import { Button } from '@/components/ui/button';
import DevOnly from '@/components/DevOnly.vue';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion } from '@/components/ui/accordion';

import GeneralOptions from './GeneralOptions.vue';
import ChatAIOptions from './ChatAIOptions.vue';
import ImageAIOptions from './ImageAIOptions.vue';
import TTSOptions from './TTSOptions.vue';
import STTOptions from './STTOptions.vue';
import AIProviderOptions from './AIProviderOptions/Main.vue';
import { isFeatureAvailable } from '@/src/lib/ai/support';
import ExportDatabaseButton from '../../ExportDatabaseButton.vue';
import ImportDatabaseButton from '../../ImportDatabaseButton.vue';
import { clearDatabase, db, tableNames } from '@/src/lib/db/schema';

const store = useAppStore();
const chatProvider = computed(() => store.settings.selected_provider_chat);
const imageProvider = computed(() => store.settings.selected_provider_image);
const ttsProvider = computed(() => store.settings.selected_provider_tts);
const sttProvider = computed(() => store.settings.selected_provider_stt);

const error = ref('');

const reloadPage = () => {
	window.location.reload();
};

const resetApp = async () => {
	await clearDatabase();
	window.location.reload();
}
</script>
<template>
	<!--
		TODO
		- add option: Advanced -- show advanced options
			- Just have a map of which settings are advanced, conditionally hide (do it in optionselect?)
			- if enabled, hide:
				- global model import
				- models if # of all models === 1 (not default voice / selected_model_tts)
		- (unrelated) add option to Buddies to specify a certain chat model
		-   if the currently active model is not the one specified, switch to it and restart server
	 -->
	<ScrollArea class="h-screen pb-12">
		<Alert v-if="error" variant="destructive">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{{ error }}</AlertDescription>
		</Alert>
		<Accordion class="px-2" type="multiple" collapsible>
			<GeneralOptions />
			<AIProviderOptions />
			<!-- TODO conditional based on isFeatureAvailable -->
			<ChatAIOptions v-if="chatProvider && chatProvider !== '0'" />
			<ImageAIOptions v-if="imageProvider && imageProvider !== '0'" />
			<TTSOptions v-if="ttsProvider && ttsProvider !== '0'" />
			<STTOptions v-if="sttProvider && sttProvider !== '0'" />
		</Accordion>
		<div class="mt-4 flex flex-col items-center">
			<div class="flex items-center">
				<Button type="button" @click="reloadPage" class="px-4 py-2 rounded-md" variant="ghost">Reload Page</Button>
				<ExportDatabaseButton />
				<ImportDatabaseButton />
			</div>
			<RouterLink to="/credits">BuddyGenAI Credits / Licenses</RouterLink>
			<DevOnly>
				<Button @click="resetApp" type="button" class="px-4 py-2 mt-2 rounded-md" variant="destructive">Reset & Close
					App</Button>
			</DevOnly>
		</div>
	</ScrollArea>
</template>
<style lang="scss"></style>
