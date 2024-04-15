<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ThreadsList from './ThreadsList.vue';
import PersonaList from './PersonaList.vue';

const route = useRoute();

const modelValue = ref(route.path.includes('/persona') ? 'buddies' : 'chats');

watch(
	() => route.path,
	(path) => {
		if (path.includes('/persona')) {
			modelValue.value = 'buddies';
		} else {
			modelValue.value = 'chats';
		}
	}
);
</script>

<template>
	<Tabs v-model:model-value="modelValue" class="fixed">
		<TabsList class="w-full">
			<TabsTrigger value="chats">Chats</TabsTrigger>
			<TabsTrigger value="buddies">Buddies</TabsTrigger>
		</TabsList>
		<TabsContent value="chats">
			<ThreadsList />
		</TabsContent>
		<TabsContent value="buddies">
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
