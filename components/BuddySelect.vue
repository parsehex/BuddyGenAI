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

const model = defineModel<string>({ required: true });
</script>

<template>
	<Select v-model:model-value="model" class="my-2">
		<SelectTrigger>
			<SelectValue placeholder="Buddy" />
		</SelectTrigger>
		<SelectContent>
			<SelectLabel>Buddies</SelectLabel>
			<SelectGroup>
				<SelectItem v-for="buddy in buddies" :key="buddy.id" :value="buddy.id + ''">
					{{ buddy.name }}
				</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>
</template>
