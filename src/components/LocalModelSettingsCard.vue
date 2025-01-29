<script setup lang="ts">
import { onBeforeMount, onMounted } from 'vue';
import useElectron from '@/composables/useElectron';
import { useAppStore } from '@/stores/main';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
	SelectValue,
} from '@/components/ui/select';
import ImportModel from '@/components/ImportModel.vue';
import useLlamaCpp from '../composables/useLlamaCpp';
import ImportModelPack from './ImportModelPack.vue';
import { Button } from './ui/button';
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/api/utils';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

async function startOAuthFlow() {
  // Generate and store code verifier
  const codeVerifier = generateCodeVerifier();
  // Store this in localStorage or your IndexedDB for later use
  localStorage.setItem('oauth_code_verifier', codeVerifier);

  // Generate code challenge
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Construct OAuth URL
  const params = new URLSearchParams({
    callback_url: `${window.location.origin}/auth/callback`,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  // Redirect to OpenRouter auth page
  window.location.href = `https://openrouter.ai/auth?${params.toString()}`;
}

const { openExternalLink } = useElectron();

const props = defineProps<{
	firstTime: boolean;
}>();

const emits = defineEmits(['openModelDirectory']);

const { updateModels } = useAppStore();
const store = useAppStore();

onMounted(() => {
	// updateModels();
	setTimeout(() => {
		updateModels();
	}, 250);
});
</script>

<template>
	<Card class="whitespace-pre-wrap w-full p-2 pt-4">
		<CardHeader class="text-lg pt-0 pb-2 flex flex-row justify-between">
			Setup
		</CardHeader>
		<CardContent>
			<p>
				To use BuddyGenAI, you must connect the app to a language model AI, which you can do via OpenRouter.
				<br />
				If you don't already have an account with OpenRouter then you'll need to sign up.
			</p>
			<Alert class="my-4 p-2" variant="info">
				<AlertTitle>
					<h2 class="text-lg">Tip</h2>
				</AlertTitle>
				<AlertDescription>
					Set a Credit limit when you connect this app below to prevent over-spending!
				</AlertDescription>
			</Alert>
			<button type="button" class="bg-gray-200 px-2 py-3 rounded-md text-gray-800 flex items-center" @click="startOAuthFlow">
				Connect
				<img src="/assets/openrouter-logo.svg" class="h-10" />
			</button>
		</CardContent>
	</Card>
</template>

<style lang="scss"></style>
