<script setup lang="ts">
// the persona is our v-model
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ref } from 'vue';

const model = defineModel<string>({ required: true });
const personas = await $fetch('/api/personas');
</script>

<template>
	<Select v-model:model-value="model" class="my-2">
		<SelectTrigger>
			<SelectValue placeholder="Persona" />
		</SelectTrigger>
		<SelectContent>
			<SelectLabel>Personas</SelectLabel>
			<SelectGroup>
				<SelectItem v-for="persona in personas" :key="persona.id" :value="persona.id + ''">{{ persona.name }}</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>
</template>
