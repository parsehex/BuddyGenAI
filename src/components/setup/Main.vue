<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import UserSetup from './UserSetup.vue';
import BuddyBasicInfo from './BuddyBasicInfo.vue';
import BuddyAppearance from './BuddyAppearance.vue';
import AIProviderSetup from './AIProviderSetup.vue';
import { useAppStore } from '@/src/stores/main';
import AppTitle from '../AppTitle.vue';
import { AppSettings } from '@/src/lib/api/AppSettings';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { isFeatureAvailable } from '@/src/lib/ai/support';

const store = useAppStore();

type SetupStep = 'ai-provider' | 'user-setup' | 'buddy-info' | 'appearance';

const currentStep = ref('ai-provider' as SetupStep);
const newBuddy = ref(null as any);

onMounted(() => {
  if (isFeatureAvailable('chat')) {
    currentStep.value = 'user-setup'
  }
  const userName = AppSettings.get('user_name') as string;
  if (userName && userName.toLowerCase() !== 'user') {
    currentStep.value = 'buddy-info';
  }
});

const handleStepComplete = (step: SetupStep, data?: any) => {
  switch (step) {
    case 'ai-provider':
      currentStep.value = 'user-setup';
      break;
    case 'user-setup':
      currentStep.value = 'buddy-info';
      break;
    case 'buddy-info':
      currentStep.value = 'appearance';
      newBuddy.value = data;
      break;
    case 'appearance':
      break;
  }
};

const canSkipSetup = computed(() => {
  if (!isFeatureAvailable('chat')) return false;
  return true;
});
const handleSkipSetup = () => {
  store.settings.skip_setup = true;
  store.saveSettings(store.settings);
};

// TODO user isn't able to set AI Provider or options for it after first time setup
</script>
<template>
  <ScrollArea class="h-screen">
    <div class="flex flex-col items-center w-full md:w-5/6 mx-auto">
      <span>
        <AppTitle :new-here="store.newHere" />
      </span>
      <AIProviderSetup v-if="currentStep === 'ai-provider'" @complete="handleStepComplete('ai-provider')" />
      <UserSetup v-if="currentStep === 'user-setup'" @complete="handleStepComplete('user-setup')" />
      <BuddyBasicInfo v-if="currentStep === 'buddy-info'" @complete="handleStepComplete('buddy-info', $event)" />
      <BuddyAppearance v-if="currentStep === 'appearance'" :new-buddy="newBuddy"
        @complete="handleStepComplete('appearance')" />
      <Button v-if="canSkipSetup" type="button" variant="secondary" class="mt-2" @click="handleSkipSetup">Skip
        Setup</Button>
    </div>
  </ScrollArea>
</template>
