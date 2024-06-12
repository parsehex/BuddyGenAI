<script setup lang="ts">
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import ImageWithPreview from '../ImageWithPreview.vue';
import { onMounted } from 'vue';
import { delay } from '@/src/lib/utils';

const props = defineProps<{
	images: { url: string }[];
}>();

let isDown = false;
let startX: number;
let scrollLeft: number;

function getScrollArea() {
	return document.querySelector('#scrollArea > div') as HTMLElement;
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

const scrollFactor = 2;
const wheel = (e: WheelEvent) => {
	const scrollArea = getScrollArea();
	if (!scrollArea) return;
	e.preventDefault();
	const newScrollPosition = scrollArea.scrollLeft + e.deltaY * scrollFactor;
	scrollArea.scrollTo({
		left: newScrollPosition,
		behavior: 'smooth',
	});
};

const scrollRight = async () => {
	await delay(5);
	const scrollArea = getScrollArea();
	console.log('scrollArea', scrollArea);
	if (!scrollArea) return;
	scrollArea.scrollTo({
		left: scrollArea.scrollWidth,
		behavior: 'smooth',
	});
};
</script>

<template>
	<Popover @update:open="scrollRight">
		<PopoverTrigger as-child>
			<div
				class="flex items-center bg-primary-foreground rounded-lg justify-center cursor-pointer"
			>
				<span class="p-2 select-none"> Images in this Chat </span>
			</div>
		</PopoverTrigger>
		<PopoverContent
			class="min-w-[40vw] bg-primary-foreground"
			:hide-when-detached="true"
			side="bottom"
		>
			<!-- TODO download zip -->
			<!-- TODO image controls -->
			<ScrollArea
				id="scrollArea"
				@mousedown="mouseDown"
				@mouseleave="leave"
				@mouseup="up"
				@mousemove="move"
				@wheel="wheel"
			>
				<div class="flex flex-row">
					<div v-for="image in props.images" :key="image.url" class="p-1">
						<ImageWithPreview :img-url="image.url" class="min-w-[200px]" />
					</div>
				</div>
				<p v-if="!props.images.length" class="p-2 select-none">
					No images in this chat.
				</p>
			</ScrollArea>
		</PopoverContent>
	</Popover>
</template>
