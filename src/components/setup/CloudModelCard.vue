<script setup lang="ts">
import { onBeforeMount, onMounted } from 'vue';
import useElectron from '@/composables/useElectron';
import { useAppStore } from '@/stores/main';
import { Card, CardContent } from '@/components/ui/card';
import {
	Collapsible,
	CollapsibleContent,
} from '@/components/ui/collapsible';
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/api/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
	isOpen: boolean;
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
	<Collapsible :open="isOpen">
		<CollapsibleContent>
			<Card class="whitespace-pre-wrap w-full p-2 pt-4">
				<CardContent>
					<p>
						If you don't already have an account with OpenRouter then you'll need to sign up.
					</p>
					<Alert class="my-4 p-2" variant="info">
						<AlertTitle>
							<h2 class="text-lg">Tip</h2>
						</AlertTitle>
						<AlertDescription>
							Set a Credit limit when you connect the app below to prevent over-spending!
						</AlertDescription>
					</Alert>
					<button type="button" class="bg-gray-200 px-2 py-3 rounded-sm text-gray-800 flex items-center" @click="startOAuthFlow">
						Connect
						<img src="/assets/openrouter-logo.svg" class="h-10" />
					</button>
				</CardContent>
			</Card>
		</CollapsibleContent>
	</Collapsible>
</template>

<style lang="scss"></style>
