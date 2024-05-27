<script setup lang="ts">
import { toRefs } from 'vue';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from './ui/collapsible';
import ImageWithPreview from './ImageWithPreview.vue';

const props = defineProps<{
	threads: { name: string; images: { url: string }[] }[];
}>();
const { threads } = toRefs(props);

let isDown = false;
let startX: number;
let scrollLeft: number;

function getScrollArea() {
	return document.querySelector('#all-threads-images > div') as HTMLElement;
}

const mouseDown = (e: MouseEvent) => {
	const scrollArea = getScrollArea();
	if (!scrollArea) return;
	isDown = true;
	startX = e.pageX - scrollArea.offsetLeft;
	scrollLeft = scrollArea.scrollLeft;
};

const leave = () => {
	isDown = false;
};

const up = () => {
	isDown = false;
};

const move = (e: MouseEvent) => {
	if (!isDown) return;
	const scrollArea = getScrollArea();
	if (!scrollArea) return;
	console.log('move');
	e.preventDefault();
	const x = e.pageX - scrollArea.offsetLeft;
	const walk = x - startX;
	scrollArea.scrollLeft = scrollLeft - walk;
};

const scrollFactor = 3;
const wheel = (e: WheelEvent) => {
	const scrollArea = getScrollArea();
	if (!scrollArea) return;
	e.preventDefault();
	const newScrollPosition = scrollArea.scrollLeft + e.deltaY * scrollFactor;
	scrollArea.scrollTo({
		left: newScrollPosition,
		behavior: 'smooth',
	});
	console.log('wheel');
};

console.log('threads', threads.value);
</script>

<template>
	<!-- TODO convert to accordion -->
	<div class="flex flex-col items-center mb-8">
		<h2 class="text-xl font-bold mt-4 flex items-center">Chat Images</h2>
		<Collapsible
			v-for="thread in threads"
			:key="thread.images[0].url"
			class="p-1 min-w-[40vw] mt-2 rounded-lg border border-gray-300 dark:border-gray-700"
		>
			<CollapsibleTrigger as-child>
				<div
					class="flex items-center bg-primary-foreground rounded-b-lg w-full justify-center cursor-pointer"
				>
					<span class="p-2"> {{ thread.name }} </span>
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<ScrollArea @wheel="wheel" id="all-threads-images">
					<div class="p-1 flex flex-row">
						<ImageWithPreview
							v-for="image in thread.images"
							:key="image.url"
							:img-url="image.url"
							class="min-w-fit min-h-[250px] max-h-[250px] object-cover mx-1"
						/>
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</CollapsibleContent>
		</Collapsible>
	</div>
</template>
