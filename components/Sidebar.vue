<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ThreadsList from './ThreadsList.vue';
import PersonaList from './PersonaList.vue';

const route = useRoute();

const modelValue = ref(route.path.includes('/persona') ? 'personas' : 'threads');

watch(
	() => route.path,
	(path) => {
		if (path.includes('/persona')) {
			modelValue.value = 'personas';
		} else {
			modelValue.value = 'threads';
		}
	}
);
</script>

<template>
	<Tabs v-model:model-value="modelValue" class="fixed">
		<TabsList class="w-full">
			<TabsTrigger value="threads">Threads</TabsTrigger>
			<TabsTrigger value="personas">Personas</TabsTrigger>
		</TabsList>
		<TabsContent value="threads">
			<ThreadsList />
		</TabsContent>
		<TabsContent value="personas">
			<PersonaList />
		</TabsContent>
	</Tabs>
</template>

<style>
.sidebar {
	width: 200px;
	height: 100vh;
	background-color: #f5f5f5;
	padding-top: 20px;
}

.sidebar ul {
	list-style-type: none;
	padding: 0;
}

.sidebar a {
	text-decoration: none;
	color: #333;
}
</style>
