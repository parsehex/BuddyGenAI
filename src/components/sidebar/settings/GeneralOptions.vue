<script setup lang="ts">
import { ref } from 'vue';
import { RefreshCw } from 'lucide-vue-next';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useElectron from '@/src/composables/useElectron';
import { useAppStore } from '@/src/stores/main';
import ImportModel from '@/src/components/ImportModel.vue';
import OptionSection from './OptionSection.vue';

const { openModelsDirectory } = useElectron();
const store = useAppStore();

const userName = ref(store.settings.user_name);

const updateName = async () => {
	if (store.settings.user_name === userName.value) return;
	store.settings.user_name = userName.value;
};

const openModels = async () => {
	if (!openModelsDirectory) return console.error('Electron not available');

	await openModelsDirectory();
};
</script>

<template>
	<AccordionItem value="general-options">
		<AccordionTrigger>General Options</AccordionTrigger>
		<AccordionContent>
			<OptionSection label="Your Name" labelName="name" orientation="vertical">
				<Input
					v-model="userName"
					@blur="updateName()"
					id="name"
					class="border border-gray-300 dark:border-gray-700 rounded-md p-2"
					type="text"
				/>
			</OptionSection>

			<OptionSection label="General Model Options" orientation="vertical">
				<div class="flex justify-center">
					<Button
						@click="openModels"
						class="px-4 py-2 ml-1 rounded-md"
						variant="outline"
					>
						Open Model Folder
					</Button>
					<Button
						@click="store.updateModels"
						class="px-4 py-2 rounded-md"
						title="Refresh Model Lists"
						variant="secondary"
					>
						<RefreshCw class="w-4 h-4" />
					</Button>
				</div>
				<ImportModel />
			</OptionSection>
		</AccordionContent>
	</AccordionItem>
</template>
