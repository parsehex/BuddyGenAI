<script setup lang="ts">
import { ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import KoboldCppSetup from '@/src/components/setup/KoboldCppSetup.vue';
</script>
<template>
	<KoboldCppSetup />
	<!-- TODO allow switching Cfg if feature enabled in koboldcpp
	 check with store.lastKoboldVersionResult (`admin` === 0 if disabled)
	 -->
</template>
