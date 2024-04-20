<script setup lang="ts">
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '~/stores/main';

const { personas } = useAppStore();

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
				<SelectItem v-for="persona in personas" :key="persona.id" :value="persona.id + ''">{{ persona.name }}</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>
</template>
