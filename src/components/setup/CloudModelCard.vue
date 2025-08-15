<script setup lang="ts">
import { onBeforeMount, onMounted } from 'vue';
import useElectron from '@/composables/useElectron';
import { useAppStore } from '@/stores/main';
import { Card, CardContent } from '@/components/ui/card';
import {
	Collapsible,
	CollapsibleContent,
} from '@/components/ui/collapsible';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import ConnectOpenRouterBtn from '../ConnectOpenRouterBtn.vue';

const props = defineProps<{
	firstTime: boolean;
	isOpen: boolean;
}>();

const emits = defineEmits(['openModelDirectory']);

const store = useAppStore();

onMounted(() => {
	setTimeout(() => {
		store.updateModels();
	}, 250);
});
</script>
<template>
	<Collapsible :open="isOpen">
		<CollapsibleContent>
			<Card class="whitespace-pre-wrap w-full p-2 pt-4">
				<CardContent>
					<p> If you don't already have an account with OpenRouter then you'll need to sign up. </p>
					<Alert class="my-4 p-2" variant="info">
						<AlertTitle>
							<h2 class="text-lg">Tip</h2>
						</AlertTitle>
						<AlertDescription> Set a Credit limit when you connect the app below to prevent over-spending!
						</AlertDescription>
					</Alert>
					<ConnectOpenRouterBtn />
				</CardContent>
			</Card>
		</CollapsibleContent>
	</Collapsible>
</template>
<style lang="scss"></style>
