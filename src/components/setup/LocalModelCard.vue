<script setup lang="ts">
import { onBeforeMount, onMounted, ref } from 'vue';
import { useAppStore } from '@/stores/main';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
	Collapsible,
	CollapsibleContent,
} from '@/components/ui/collapsible';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import KoboldCppSetup from './KoboldCppSetup.vue';
import { delay } from '@/src/lib/utils';
import KoboldCppSetupInfo from './KoboldCppSetupInfo.vue';



const props = defineProps<{
	firstTime: boolean;
	isOpen: boolean;
}>();

const emits = defineEmits(['completed']);

const { updateModels } = useAppStore();
const store = useAppStore();

const koboldConnected = ref(false);

onMounted(async () => {
	await delay(250);
	updateModels();
});

</script>
<template>
	<Collapsible :open="isOpen">
		<CollapsibleContent>
			<Card class="whitespace-pre-wrap w-full p-2 pt-4">
				<CardContent class="space-y-3">
					<KoboldCppSetupInfo />
					<KoboldCppSetup @connected="koboldConnected = true" @offline="koboldConnected = false" />
					<!-- TODO: instructions/handling - Using a different PC? -->
					<!-- how to forward other ip to localhost -->
					<!-- best support in chrome, asks for permission to talk to LAN -->
					<Button v-if="koboldConnected" type="button" @click="emits('completed')"> Next </Button>
				</CardContent>
			</Card>
		</CollapsibleContent>
	</Collapsible>
</template>
<style lang="scss">
.step {
	@apply text-xl mr-3 text-gray-400;
}
</style>
