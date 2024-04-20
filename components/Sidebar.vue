<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ThreadsList from './ThreadsList.vue';
import PersonaList from './PersonaList.vue';

const route = useRoute();

const modelValue = ref(route.path.includes('/persona') ? 'buddy' : 'chat');

watch(
	() => route.path,
	(path) => {
		if (path.includes('/persona')) {
			modelValue.value = 'buddy';
		} else {
			modelValue.value = 'chat';
		}
	}
);
</script>

<template>
	<Tabs v-model:model-value="modelValue" class="fixed">
		<TabsList class="w-full">
			<TabsTrigger value="chat">Chat</TabsTrigger>
			<TabsTrigger value="buddy">Buddy</TabsTrigger>
		</TabsList>
		<TabsContent value="chat">
			<ThreadsList />
		</TabsContent>
		<TabsContent value="buddy">
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
