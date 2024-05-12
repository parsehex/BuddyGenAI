<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import ThreadsList from './ThreadsList.vue';
import BuddyList from './BuddyList.vue';
import SettingsPanel from './SettingsPanel.vue';
import ColorMode from './ColorMode.vue';

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
	<Tabs v-model:model-value="modelValue">
		<TabsList class="w-full dark:bg-gray-800">
			<TabsTrigger value="chat">Chat</TabsTrigger>
			<TabsTrigger value="buddy">Buddy</TabsTrigger>
			<TabsTrigger value="settings">Settings</TabsTrigger>
			<ColorMode />
		</TabsList>
		<ScrollArea class="h-screen">
			<TabsContent value="chat">
				<ThreadsList />
			</TabsContent>
			<TabsContent value="buddy">
				<BuddyList />
			</TabsContent>
			<TabsContent value="settings">
				<SettingsPanel />
			</TabsContent>
		</ScrollArea>
	</Tabs>
</template>

<style></style>
