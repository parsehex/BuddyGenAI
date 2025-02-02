<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/main';
import { AppSettings } from '@/lib/api/AppSettings';

const emits = defineEmits(['connected', 'offline']);

const store = useAppStore();
const hostInput = ref(store.settings.koboldcpp_host || 'http://localhost:5001');
const isTestingConnection = ref(false);
const connectionStatus = ref<'none' | 'testing' | 'success' | 'error'>('none');
const errorMessage = ref('');
const features = ref<{
  llm: boolean;
  txt2img: boolean;
  tts: boolean;
  transcribe: boolean;
}>({
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

async function testConnection() {
  connectionStatus.value = 'testing';
  isTestingConnection.value = true;
  errorMessage.value = '';

  try {
    const response = await fetch(`${hostInput.value}/api/extra/version`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json() as KoboldVersion;

    // Update features and version
    features.value = {
      llm: data.llm,
      txt2img: data.txt2img,
      tts: data.tts,
      transcribe: data.transcribe,
    };
    version.value = data.version;

    // Update store and save settings
    store.settings.selected_provider_chat = 'local';
    store.settings.koboldcpp_host = hostInput.value;
    await AppSettings.saveSettings();
    emits('connected');

    connectionStatus.value = 'success';
  } catch (error) {
    connectionStatus.value = 'error';
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Failed to connect to KoboldCpp server';
      emits('offline')
  } finally {
    isTestingConnection.value = false;
  }
}

// Auto-test when host input changes (with debounce)
let timeout: NodeJS.Timeout;
watch(hostInput, (newValue) => {
  clearTimeout(timeout);
  // Reset status if input is empty
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
});
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <label class="text-sm font-medium">KoboldCpp Host</label>
      <div class="flex gap-2">
        <Input
          v-model="hostInput"
          placeholder="http://localhost:5001"
          :class="{
            'border-green-500': connectionStatus === 'success',
            'border-red-500': connectionStatus === 'error'
          }"
        />
        <Button
          @click="testConnection"
          :disabled="isTestingConnection"
          variant="outline"
        >
          {{ isTestingConnection ? 'Testing...' : 'Test Connection' }}
        </Button>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="connectionStatus !== 'none'" class="text-sm">
      <div v-if="connectionStatus === 'testing'" class="text-blue-500">
        Testing connection...
      </div>
      <div v-if="connectionStatus === 'success'" class="text-green-400">
        <div class="font-medium inline-block">Connected successfully!</div>
        <div class="mt-1 text-gray-600 inline-block ml-2">KoboldCpp Version: {{ version }}</div>
        <div class="mt-2">
          <div class="font-medium inline-block">Available features:</div>
          <ul class="inline-flex gap-2 ml-2 text-green-600 underline">
            <li v-if="features.llm">Chat</li>
            <li v-if="features.txt2img">Image Generation</li>
            <li v-if="features.tts">Text to Speech</li>
            <li v-if="features.transcribe">Speech to Text</li>
          </ul>
        </div>
      </div>
      <div v-if="connectionStatus === 'error'" class="text-red-500">
        Connection failed: {{ errorMessage }}
      </div>
    </div>
  </div>
</template>
