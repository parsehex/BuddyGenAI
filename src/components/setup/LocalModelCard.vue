<script setup lang="ts">
import { onBeforeMount, onMounted, ref } from 'vue';
import useElectron from '@/composables/useElectron';
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

const { openExternalLink } = useElectron();

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

// TODO would be nice to have a generator or some preset config files
// 	for kcpp
// Generator:
// - User could
</script>

<template>
	<Collapsible :open="isOpen">
		<CollapsibleContent>
			<Card class="whitespace-pre-wrap w-full p-2 pt-4">
				<CardHeader>
					<h2 class="ml-4 text-2xl">Setting Up KoboldCpp</h2>
				</CardHeader>
				<CardContent class="space-y-3">
					<p>
						<span class="step">1.</span>
						To run on your PC, you'll need to install <span class="text-blue-500 cursor-pointer hover:underline" @click="openExternalLink('https://github.com/LostRuins/koboldcpp')">KoboldCpp</span>, an open source project to run several kinds of AI models from a single self-contained app.
					</p>
					<p class="text-center">
						To download the latest version of KoboldCpp, see <span class="text-blue-500 cursor-pointer hover:underline" @click="openExternalLink('https://github.com/LostRuins/koboldcpp/releases')">here</span>.
					</p>
					<p class="mt-2">
						<span class="step">2.</span>
						Next, download models to use with Kobold. For some examples and links, see the bottom of <span class="text-blue-500 cursor-pointer hover:underline" @click="openExternalLink('https://github.com/LostRuins/koboldcpp?tab=readme-ov-file#where-can-i-download-ai-model-files')">this page</span>.
					</p>
					<Alert class="my-4 p-2" variant="info">
						<AlertTitle>
							<h2 class="text-lg">Tip</h2>
						</AlertTitle>
						<AlertDescription>
							From the above page you need to download one of each of these models to use all of the app's features,
							<br />
							but at least the 1st:
							<br />
							Text Generation
							<br />
							Image Generation
							<br />
							Speech Recognition
							<br />
							Text-To-Speech
						</AlertDescription>
					</Alert>
					<p class="mt-2">
						<span class="step">3.</span>
						After the downloads are finished, open the file you first downloaded (KoboldCpp) and pick each of the files you downloaded:
						<ul class="list-disc">
							<li>Set Text Generation model in <b>Model Files</b> -&gt; <b>Text Model</b></li>
							<li>Set Image Generation model in <b>Image Gen</b> -&gt; <b>Stable Diffusion Model</b></li>
							<li>Set Text-To-Speech models in <b>Audio</b>. Pick the according <b>OuteTTS</b> and <b>WavTokenizer</b> models that you downloaded</li>
							<li>Set Speech Recognition models in <b>Audio</b> -&gt; <b>Whisper Model</b></li>
						</ul>
					</p>
					<p class="mt-2">
						<span class="step">4.</span>
						Once you've completed this, can click <b>Launch</b> at the bottom of the Kobold window. Then, come back here and click below to test your connection.
					</p>
					<KoboldCppSetup @connected="koboldConnected = true" @offline="koboldConnected = false" />

					<Button v-if="koboldConnected" type="button" @click="emits('completed')">
						Next
					</Button>
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
