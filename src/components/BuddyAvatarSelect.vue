<script setup lang="ts">
import { ref, toRefs, watch } from 'vue';
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from './ui/collapsible';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import urls from '@/lib/api/urls';
import type { BuddyVersionMerged } from '../lib/api/types-db';

const props = defineProps<{
	persona: BuddyVersionMerged;
	allProfilePics: string[];
}>();
const { persona, allProfilePics } = toRefs(props);

const emit = defineEmits(['selectProfilePic']);

const allPicsOpen = ref(false);
</script>

<template>
	<Collapsible
		v-if="allProfilePics.length > 1"
		v-model:open="allPicsOpen"
		class="space-y-2 my-2 rounded-lg border-2 border-gray-300 dark:border-gray-700"
	>
		<CollapsibleTrigger as-child>
			<div
				class="text-md flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t-lg p-1"
			>
				Other Profile Pictures
				<Button variant="ghost" size="sm" class="w-9 p-0 hover:bg-transparent">
					<ChevronDown v-if="!allPicsOpen" />
					<ChevronUp v-else />
				</Button>
			</div>
		</CollapsibleTrigger>
		<CollapsibleContent>
			<ScrollArea class="mx-auto">
				<div
					class="flex flex-row flex-wrap items-center justify-center max-w-96 max-h-64"
				>
					<img
						v-for="pic in allProfilePics"
						:key="pic"
						:src="urls.buddy.getProfilePic(`${persona?.id}/${pic}`)"
						@click="emit('selectProfilePic', pic)"
						class="cursor-pointer w-[64px] h-[64px] m-1 rounded-full hover:shadow-lg hover:scale-105 hover:opacity-90"
					/>
				</div>
				<ScrollBar />
			</ScrollArea>
		</CollapsibleContent>
	</Collapsible>
</template>
