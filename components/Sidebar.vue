<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ThreadsList from './ThreadsList.vue';
import BuddyList from './BuddyList.vue';

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
			<BuddyList />
		</TabsContent>
	</Tabs>
</template>

<style>
#page-container {
	/* putting this here to keep nearby */
	margin-left: 250px;
}
.sidebar {
	width: 250px;
	height: 100vh;
	background-color: #f5f5f5;

	/* why does removing this line break the file? */
	padding-top: 5px;
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
