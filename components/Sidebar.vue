<script setup lang="ts">
// TODO add Persona tab
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import ThreadsList from './ThreadsList.vue';
</script>

<template>
	<Tabs default-value="threads" class="fixed">
		<TabsList class="w-full">
			<TabsTrigger value="threads">Threads</TabsTrigger>
			<TabsTrigger value="personas">Personas</TabsTrigger>
		</TabsList>
		<TabsContent value="threads">
			<ThreadsList />
		</TabsContent>
		<TabsContent value="personas">
			<div class="sidebar">
				<div class="flex w-full mb-4">
					<Input placeholder="Persona name" />
					<Button>+</Button>
				</div>
				<ul>
					<li :class="['cursor-pointer', 'hover:bg-gray-200', 'p-1', 'rounded']"> Persona Name </li>
				</ul>
			</div>
		</TabsContent>
	</Tabs>
</template>

<style>
.sidebar {
	width: 200px;
	height: 100vh;
	background-color: #f5f5f5;
	padding: 20px;
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
