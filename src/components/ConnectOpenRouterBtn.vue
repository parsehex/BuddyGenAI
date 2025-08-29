<script setup lang="ts">
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/api/utils';

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
</script>
<template>
	<button type="button" class="bg-gray-200 px-2 py-3 rounded-sm text-gray-800 flex items-center"
		@click="startOAuthFlow"> Connect to <img src="/assets/openrouter-logo.svg" class="h-10" />
	</button>
</template>
