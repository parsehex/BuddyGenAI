<script setup lang="ts">
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
</script>

<template>
	<Popover>
		<PopoverTrigger as-child>
			<div
				class="flex items-center bg-primary-foreground rounded-b-lg w-full justify-center cursor-pointer"
			>
				<span class="p-2"> Images </span>
			</div>
		</PopoverTrigger>
		<PopoverContent
			class="min-w-[33vw] max-w-[50vw] bg-primary-foreground"
			:hide-when-detached="true"
			side="bottom"
		>
			<ScrollArea
				id="scrollArea"
				@mousedown="mouseDown"
				@mouseleave="leave"
				@mouseup="up"
				@mousemove="move"
			>
				<div class="flex flex-row">
					<div v-for="image in props.images" :key="image.url" class="p-1">
						<img :src="image.url" class="min-w-[150px] object-cover" />
					</div>
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</PopoverContent>
	</Popover>
</template>
