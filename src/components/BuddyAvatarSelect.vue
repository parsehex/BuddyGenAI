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
}>();
const { persona } = toRefs(props);

const emit = defineEmits(['selectProfilePic']);

const allPicsOpen = ref(false);
const allProfilePics = ref<string[]>([]);
</script>

<template>
	<Collapsible
		v-if="allProfilePics.length > 1"
		v-model:open="allPicsOpen"
		class="space-y-2 w-full my-2 rounded-lg border-2 border-gray-300 dark:border-gray-700"
	>
		<CollapsibleTrigger as-child>
			<div
				class="text-md flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t-lg p-1 w-full"
			>
				Other Pictures
				<Button variant="ghost" size="sm" class="w-9 p-0 hover:bg-transparent">
					<ChevronDown v-if="!allPicsOpen" />
					<ChevronUp v-else />
				</Button>
			</div>
		</CollapsibleTrigger>
		<CollapsibleContent>
			<ScrollArea class="w-full mx-auto">
				<div class="flex flex-wrap justify-center w-max pb-2">
					<div
						v-for="pic in allProfilePics"
						:key="pic"
						@click="emit('selectProfilePic', pic)"
						class="cursor-pointer w-16 h-16 m-2 rounded-full hover:shadow-lg hover:scale-105 hover:opacity-90"
						:style="{
							backgroundImage: `url(${urls.buddy.getProfilePic(
								`${persona?.id}/${pic}`
							)})`,
							backgroundSize: 'cover',
							userSelect: 'none',
						}"
					></div>
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</CollapsibleContent>
	</Collapsible>
</template>
