<script setup lang="ts">
import { ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import KoboldCppSetup from '@/src/components/setup/KoboldCppSetup.vue';

const saveEnabled = ref(false);
</script>
<template>
	<KoboldCppSetup @connected="saveEnabled = true" @offline="saveEnabled = false" />
	<!-- Above component saves on connected -->
	<Button type="button" :disabled="!saveEnabled" @click="saveEnabled = false">Save</Button>
	<!-- TODO allow switching Cfg if feature enabled in koboldcpp -->
</template>
