<script setup lang="ts">
import { useColorMode } from '@vueuse/core';
import { Sun, Moon } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mode = useColorMode();
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button variant="outline" size="xs" class="ml-1 p-2 py-4">
				<Sun v-if="mode === 'light'" />
				<Moon v-else />
				<span class="sr-only">Toggle theme</span>
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem @click="mode = 'light'">Light</DropdownMenuItem>
			<DropdownMenuItem @click="mode = 'dark'">Dark</DropdownMenuItem>
			<DropdownMenuItem @click="mode = 'auto'">System</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
