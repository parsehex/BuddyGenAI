<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import useElectron from '@/src/composables/useElectron';
import { useAppStore } from '@/src/stores/main';
import ImportModel from '@/src/components/ImportModel.vue';
import OptionSection from './OptionSection.vue';
import ImportModelPack from '../ImportModelPack.vue';

const { openModelsDirectory } = useElectron();
const store = useAppStore();

const openModels = async () => {
	if (!openModelsDirectory) return console.error('Electron not available');

	await openModelsDirectory();
};
</script>

<template>
	<AccordionItem value="general-options">
		<AccordionTrigger>General Options</AccordionTrigger>
		<AccordionContent>
			<OptionSection orientation="vertical">
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
				<ImportModelPack />
				<ImportModel />
			</OptionSection>
		</AccordionContent>
	</AccordionItem>
</template>
