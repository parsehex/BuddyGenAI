<script setup lang="ts">
import { computed } from 'vue';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useAIStatus } from '@/src/composables/ai/useAIStatus';

const aiStatus = useAIStatus();

const props = defineProps({
	glowColor: {
		type: String,
		default: 'none',
	},
	handleClickChat: {
		type: Function as any,
		required: true,
	},
});
</script>
<template>
	<HoverCard :open-delay="200">
		<HoverCardTrigger as-child>
			<img src="/assets/logo.png" class="hidden lg:block w-6 h-6 m-1 mx-2 cursor-pointer select-none ai-status-logo"
				:style="{ filter: `drop-shadow(${props.glowColor})` }" @click="props.handleClickChat" />
		</HoverCardTrigger>
		<HoverCardContent class="w-72" side="right">
			<div class="space-y-2">
				<p class="text-sm font-semibold">Overall AI Status: <span :class="`text-${aiStatus.overallStatus.value}-500`">{{
					aiStatus.overallStatus.value.charAt(0).toUpperCase() + aiStatus.overallStatus.value.slice(1) }}</span></p>
				<div v-if="aiStatus.activeFeatures.value.length > 0">
					<p class="text-sm font-semibold">Active Features:</p>
					<ul class="list-disc list-inside text-sm text-gray-500">
						<li v-for="feature in aiStatus.activeFeatures.value" :key="feature">{{ feature }}</li>
					</ul>
				</div>
				<p v-else class="text-sm text-gray-500">All AI features are disabled or unavailable.</p>
			</div>
		</HoverCardContent>
	</HoverCard>
</template>
