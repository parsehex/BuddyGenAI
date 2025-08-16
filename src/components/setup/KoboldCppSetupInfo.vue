<script setup lang="ts">
import useElectron from '@/composables/useElectron';

const { openExternalLink } = useElectron();
</script>
<template>
	<h2 class="ml-4 text-2xl">Setting Up KoboldCpp</h2>
	<p>
		<span class="step">1.</span> To run on your PC, you'll need to install <span
			class="text-blue-500 cursor-pointer hover:underline"
			@click="openExternalLink('https://github.com/LostRuins/koboldcpp')">KoboldCpp</span>, an open source project to
		run several kinds of AI models from a single self-contained app.
	</p>
	<p class="text-center"> To download the latest version of KoboldCpp, see <span
			class="text-blue-500 cursor-pointer hover:underline"
			@click="openExternalLink('https://github.com/LostRuins/koboldcpp/releases')">here</span>. </p>
	<p class="mt-2">
		<span class="step">2.</span> Next, download models to use with Kobold. For some examples and links, see the bottom
		of <span class="text-blue-500 cursor-pointer hover:underline"
			@click="openExternalLink('https://github.com/LostRuins/koboldcpp?tab=readme-ov-file#where-can-i-download-ai-model-files')">this
			page</span>.
	</p>
	<Alert class="my-4 p-2" variant="info">
		<AlertTitle>
			<h2 class="text-lg">Tip</h2>
		</AlertTitle>
		<AlertDescription> From the above page you need to download one of each of these models to use all of the app's
			features, <br /> but at least the 1st: <br /> Text Generation <br /> Image Generation <br /> Speech Recognition
			<br /> Text-To-Speech </AlertDescription>
	</Alert>
	<p class="mt-2">
		<span class="step">3.</span> After the downloads are finished, open the file you first downloaded (KoboldCpp) and
		pick each of the files you downloaded:
	<ul class="list-disc">
		<li>Set Text Generation model in <b>Model Files</b> -&gt; <b>Text Model</b></li>
		<li>Set Image Generation model in <b>Image Gen</b> -&gt; <b>Stable Diffusion Model</b></li>
		<li>Set Text-To-Speech models in <b>Audio</b>. Pick the according <b>OuteTTS</b> and <b>WavTokenizer</b> models that
			you downloaded</li>
		<li>Set Speech Recognition models in <b>Audio</b> -&gt; <b>Whisper Model</b></li>
	</ul>
	</p>
	<p class="mt-2">
		<span class="step">4.</span> Once you've completed this, can click <b>Launch</b> at the bottom of the Kobold window.
		Then, come back here and click below to test your connection.
	</p>
</template>
