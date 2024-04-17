<script setup lang="ts">
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import uF from '~/lib/api/useFetch';

const model = defineModel<string>({ required: true });
const personas = await uF.persona.getAll();
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
