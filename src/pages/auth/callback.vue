<template>
  <div>
    <p v-if="loading">Processing...</p>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {AppSettings} from '@/lib/api/AppSettings';

const router = useRouter();
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    // Get code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) {
      throw new Error('No code received');
    }

    // Get stored code verifier
    const codeVerifier = localStorage.getItem('oauth_code_verifier');

    // Exchange code for API key
    const response = await fetch('https://openrouter.ai/api/v1/auth/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        code_challenge_method: 'S256',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for API key');
    }

    const data = await response.json();

		AppSettings.set('openrouter_api_key', data.key);

    // Clean up
    localStorage.removeItem('oauth_code_verifier');

    // Redirect to success page or home
    router.push('/');

  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>
