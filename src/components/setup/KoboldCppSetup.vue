<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/main';
import { AppSettings } from '@/lib/api/AppSettings';
import { useChatAI } from '@/src/composables/ai/useChatAI';

const emits = defineEmits(['connected', 'offline']);

const store = useAppStore();
const chatAI = useChatAI();
const hostInput = ref(store.settings.koboldcpp_host || 'http://localhost:5001');
const isTestingConnection = ref(false);
const connectionStatus = ref<'none' | 'testing' | 'success' | 'error'>('none');
const errorMessage = ref('');
const features = ref({
  llm: false,
  txt2img: false,
  tts: false,
  transcribe: false,
});
const version = ref<string>('');

interface KoboldVersion {
  version: string;
  llm: boolean;
  txt2img: boolean;
  tts: boolean;
  transcribe: boolean;
}

let currentController: AbortController | null = null;

async function testConnection() {
  // Cancel any ongoing request before starting a new one
  if (currentController) {
    currentController.abort();
  }
  currentController = new AbortController();

  connectionStatus.value = 'testing';
  isTestingConnection.value = true;
  errorMessage.value = '';

  try {
    const response = await fetch(`${hostInput.value}/api/extra/version`, {
      signal: currentController.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as KoboldVersion;

    // If we reach here, cancel any other ongoing requests
    currentController.abort();

    features.value = {
      llm: data.llm,
      txt2img: data.txt2img,
      tts: data.tts,
      transcribe: data.transcribe,
    };
    version.value = data.version;

    // auto-enable disabled features which koboldcpp has available
    if (data.llm && !store.settings.selected_provider_chat)
      store.settings.selected_provider_chat = 'koboldcpp';
    if (data.txt2img && !store.settings.selected_provider_image)
      store.settings.selected_provider_image = 'koboldcpp';
    if (data.tts && !store.settings.selected_provider_tts)
      store.settings.selected_provider_tts = 'koboldcpp';
    if (data.transcribe && ~store.settings.selected_provider_stt)
      store.settings.selected_provider_stt = 'koboldcpp';

    store.settings.koboldcpp_host = hostInput.value;

    emits('connected');
    connectionStatus.value = 'success';
  } catch (error) {
    if ((error as any).name === 'AbortError') {
      // Request was aborted — silently ignore
      return;
    }
    connectionStatus.value = 'error';
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Failed to connect to KoboldCpp server';
    emits('offline');
  } finally {
    isTestingConnection.value = false;
  }
}

// Debounce host changes
let timeout: NodeJS.Timeout;
watch(hostInput, (newValue) => {
  clearTimeout(timeout);
  if (!newValue) {
    connectionStatus.value = 'none';
    return;
  }
  timeout = setTimeout(() => {
    testConnection();
  }, 1000);
});

onMounted(() => {
  testConnection();
});

onUnmounted(() => {
  clearTimeout(timeout);
  if (currentController) {
    currentController.abort();
  }
});

const delimiterCls = `[&>li:not(:first-child)]:before:content-['·'] [&>li:not(:first-child)]:before:mx-2`;
const itemCls = (active: boolean) => active ? `text-green-600 font-bold` : 'text-gray-400';
</script>
<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <!-- TODO: .kcppt template generator -->
      <!-- user checks off different features and chooses model(s) or sets custom -->
      <!-- user downloads the .kcppt and runs with KCPP which downloads the models -->
      <!-- can remove a lot of the setup info -->
      <label class="text-sm font-medium">KoboldCpp Host</label>
      <div class="flex gap-2">
        <Input v-model="hostInput" placeholder="http://localhost:5001" :class="{
          'border-green-500': connectionStatus === 'success',
          'border-red-500': connectionStatus === 'error'
        }" />
        <Button @click="testConnection" :disabled="isTestingConnection" variant="outline"> {{ isTestingConnection ?
          'Testing...' : 'Test' }} </Button>
      </div>
    </div>
    <!-- Status Messages -->
    <div v-if="connectionStatus !== 'none'" class="text-sm">
      <div v-if="connectionStatus === 'testing'" class="text-blue-500"> Testing connection... </div>
      <div v-if="connectionStatus === 'success'">
        <div class="font-medium inline-block text-green-400"> Connected successfully! <span
            class="text-gray-600 ml-2">KoboldCpp v{{ version }}</span>
        </div>
        <div>
          <div class="font-medium inline-block text-green-400">Available features:</div>
          <ul :class="`inline-flex ml-2 ${delimiterCls}`">
            <li :class="itemCls(features.llm && chatAI.provider === 'koboldcpp')">Chat</li>
            <li :class="itemCls(features.txt2img)">Images</li>
            <li :class="itemCls(features.tts)">Speech</li>
            <li :class="itemCls(features.transcribe)">Voice Input</li>
          </ul>
        </div>
      </div>
      <div v-if="connectionStatus === 'error'" class="text-red-500"> Connection failed: {{ errorMessage }} </div>
    </div>
  </div>
</template>
