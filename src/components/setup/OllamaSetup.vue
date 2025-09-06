<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/main';
import { AppSettings } from '@/lib/api/AppSettings';

const emits = defineEmits(['connected', 'offline']);

const store = useAppStore();
const hostInput = ref(store.settings.ollama_host || 'http://localhost:11434');
const isTestingConnection = ref(false);
const connectionStatus = ref<'none' | 'testing' | 'success' | 'error'>('none');
const errorMessage = ref('');
const features = ref({
  llm: false,
});
const version = ref<string>('');

interface OllamaVersion {
  version: string;
}

let currentController: AbortController | null = null;

async function testConnection() {
  if (currentController) currentController.abort();
  currentController = new AbortController();

  connectionStatus.value = 'testing';
  isTestingConnection.value = true;
  errorMessage.value = '';

  try {
    const response = await fetch(`${hostInput.value}/api/version`, {
      signal: currentController.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as OllamaVersion;

    currentController.abort();

    features.value = { llm: true };
    version.value = data.version;

    store.settings.selected_provider_chat = 'ollama';
    store.settings.ollama_host = hostInput.value;

    emits('connected');
    connectionStatus.value = 'success';
  } catch (error) {
    if ((error as any).name === 'AbortError') return;
    connectionStatus.value = 'error';
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Failed to connect to Ollama server';
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
</script>
<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <label class="text-sm font-medium">Ollama Host</label>
      <div class="flex gap-2">
        <Input v-model="hostInput" placeholder="http://localhost:11434" :class="{
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
      <div v-if="connectionStatus === 'success'" class="text-green-400">
        <div class="font-medium inline-block"> Connected successfully! <span class="text-gray-600 ml-2">Ollama v{{
          version }}</span>
        </div>
        <div>
          <div class="font-medium inline-block">Available features:</div>
          <ul class="inline-flex ml-2 text-green-600 font-bold">
            <li>Chat</li>
          </ul>
        </div>
      </div>
      <div v-if="connectionStatus === 'error'" class="text-red-500"> Connection failed: {{ errorMessage }} </div>
    </div>
  </div>
</template>
