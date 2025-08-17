<script setup lang="ts">
import { useAppStore } from '@/stores/main';
import CloudModelCard from './CloudModelCard.vue';
import LocalModelCard from './LocalModelCard.vue';
import WebLLMModelCard from './WebLLMModelCard.vue';
import useElectron from '@/composables/useElectron';
import { ref } from 'vue';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

// TODO update to work with setting multiple providers

type ProviderToSelect = '' | 'cloud' | 'local' | 'webllm';

const { openExternalLink } = useElectron();
const store = useAppStore();

const selectedProvider = ref('' as ProviderToSelect);

const emits = defineEmits(['complete']);

// Note that these files should be in public/ to workaround vite
const features = {
  chat: {
    icon: '/message.svg',
    tooltip: 'Chat Support'
  },
  image: {
    icon: '/photo.svg',
    tooltip: 'Image Generation'
  },
  tts: {
    icon: '/volume.svg',
    tooltip: 'Text-to-Speech'
  },
  stt: {
    icon: '/microphone.svg',
    tooltip: 'Speech-to-Text'
  }
} as const;

const providerFeatures = {
  cloud: ['chat'] as const,
  local: ['chat', 'image', 'tts', 'stt'] as const,
  webllm: ['chat'] as const
};
</script>
<template>
  <div class="max-w-4xl mx-auto p-4">
    <p class="text-center text-lg mb-6"> To use BuddyGenAI, you have to connect the app to an AI provider. </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Local AI Card -->
      <Card class="cursor-pointer transition-all duration-200 hover:shadow-lg" :class="{
        'ring-2 ring-primary': selectedProvider === 'local',
        'hover:border-primary/50': selectedProvider !== 'local'
      }" @click="selectedProvider = 'local'">
        <CardHeader class="flex items-center justify-center relative">
          <h3 class="text-xl font-semibold">Local <small class="opacity-70">(recommended)</small></h3>
        </CardHeader>
        <CardContent class="text-muted-foreground flex flex-col items-center gap-2 relative">
          <div class="flex items-center"> powered by <img src="/assets/kobolddiscordgear.png"
              class="w-12 h-12 opacity-70 mx-2" alt="KoboldCpp" /> KoboldCpp </div>
          <p class="text-sm text-center">Run AI locally on your own hardware</p>
          <div class="flex gap-1">
            <template v-for="featureKey in providerFeatures.local" :key="featureKey">
              <Tooltip>
                <TooltipTrigger>
                  <div
                    :style="`-webkit-mask-image: url(${features[featureKey].icon}); mask-image: url(${features[featureKey].icon});`"
                    class="w-6 h-6 bg-primary hover:bg-primary/80" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ features[featureKey].tooltip }}</p>
                </TooltipContent>
              </Tooltip>
            </template>
          </div>
        </CardContent>
      </Card>
      <!-- WebLLM AI Card -->
      <Card class="cursor-pointer transition-all duration-200 hover:shadow-lg" :class="{
        'ring-2 ring-primary': selectedProvider === 'webllm',
        'hover:border-primary/50': selectedProvider !== 'webllm'
      }" @click="selectedProvider = 'webllm'">
        <CardHeader class="flex items-center justify-center relative">
          <h3 class="text-xl font-semibold">In-Browser <small class="opacity-80">(Chrome or Edge only)</small></h3>
        </CardHeader>
        <CardContent class="text-muted-foreground flex flex-col items-center gap-2 relative">
          <div class="flex items-center"> powered by <img src="/assets/mlc-logo.png"
              class="w-12 h-12 opacity-70 mx-2 rounded-lg" alt="WebLLM" /> MLC WebLLM </div>
          <p class="text-sm text-center">Run chat AI directly in your browser</p>
          <div class="flex gap-1">
            <template v-for="featureKey in providerFeatures.webllm" :key="featureKey">
              <Tooltip>
                <TooltipTrigger>
                  <div
                    :style="`-webkit-mask-image: url(${features[featureKey].icon}); mask-image: url(${features[featureKey].icon});`"
                    class="w-6 h-6 bg-primary hover:bg-primary/80" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ features[featureKey].tooltip }}</p>
                </TooltipContent>
              </Tooltip>
            </template>
          </div>
        </CardContent>
      </Card>
      <!-- Cloud AI Card -->
      <Card class="cursor-pointer transition-all duration-200 hover:shadow-lg bg-card" :class="{
        'ring-2 ring-primary': selectedProvider === 'cloud',
        'hover:border-primary/50': selectedProvider !== 'cloud'
      }" @click="selectedProvider = 'cloud'">
        <CardHeader class="flex items-center justify-center bg-card rounded">
          <h3 class="text-xl font-semibold">Cloud</h3>
        </CardHeader>
        <CardContent class="text-muted-foreground flex flex-col items-center gap-2 bg-card rounded">
          <div class="flex items-center"> powered by <div class="bg-white opacity-70 rounded-lg p-1 mx-2">
              <img src="/assets/openrouter-logo.svg" class="h-10" alt="OpenRouter" />
            </div>
          </div>
          <p class="text-sm text-center">Use powerful chat AI models hosted in the cloud</p>
          <div class="flex gap-1">
            <template v-for="featureKey in providerFeatures.cloud" :key="featureKey">
              <Tooltip>
                <TooltipTrigger>
                  <div
                    :style="`-webkit-mask-image: url(${features[featureKey].icon}); mask-image: url(${features[featureKey].icon});`"
                    class="w-6 h-6 bg-primary hover:bg-primary/80" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ features[featureKey].tooltip }}</p>
                </TooltipContent>
              </Tooltip>
            </template>
          </div>
        </CardContent>
      </Card>
    </div>
    <div class="mt-4">
      <CloudModelCard v-if="selectedProvider === 'cloud'" :first-time="store.newHere" :is-open="true" />
      <LocalModelCard v-if="selectedProvider === 'local'" :first-time="store.newHere" :is-open="true"
        @completed="emits('complete')" />
      <WebLLMModelCard v-if="selectedProvider === 'webllm'" @completed="emits('complete')" />
    </div>
  </div>
</template>
<style scoped>
/* Dark mode specific styles if needed */
:deep(.dark) .card {
  @apply bg-gray-800 border-gray-700;
}
</style>
