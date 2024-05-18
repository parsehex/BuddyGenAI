<script setup lang="ts">
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { BuddyVersionMerged } from '~/lib/api/types-db';
import { useAppStore } from '~/stores/main';

const buddies = useAppStore().buddies as BuddyVersionMerged[];

const model = defineModel<string>({ required: false });

defineProps({
	modelValue: {
		type: String,
		required: false,
	},
	includeAi: {
		type: Boolean,
		default: false,
	},
});
</script>

<template>
	<Select v-model:model-value="model" class="my-2">
		<SelectTrigger>
			<SelectValue placeholder="Start a chat with..." />
		</SelectTrigger>
		<SelectContent>
			<SelectLabel>Buddies</SelectLabel>
			<SelectGroup>
				<SelectItem v-if="includeAi" value="ai"> AI Assistant </SelectItem>
				<SelectItem v-for="buddy in buddies" :key="buddy.id" :value="buddy.id">
					{{ buddy.name }}
				</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>
</template>
