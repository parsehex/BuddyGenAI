<script setup lang="ts">
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarShortcut,
	MenubarTrigger,
} from '@/components/ui/menubar';
import useElectron from '@/composables/useElectron';

const { toggleDevTools } = useElectron();

const reload = () => {
	window.location.reload();
};

const goToCredits = async () => {
	await navigateTo('/credits');
};

const goHome = async () => {
	await navigateTo('/');
};

(window as any).latestKeyDownHandlerId = Math.random();
const handleKeyDown = ((id) => async (e: KeyboardEvent) => {
	const holdingCtrl = e.metaKey || e.ctrlKey;
	const holdingShift = e.altKey || e.shiftKey;
	if (id !== (window as any).latestKeyDownHandlerId) return;
	if (e.key === 'r' && holdingCtrl && !holdingShift) {
		e.preventDefault();
		reload();
	} else if (e.key === 'i' && holdingCtrl && holdingShift && toggleDevTools) {
		e.preventDefault();
		toggleDevTools();
	}
})((window as any).latestKeyDownHandlerId);

window.addEventListener('keydown', handleKeyDown);
</script>

<template>
	<Menubar class="pr-0" size="sm">
		<MenubarMenu>
			<MenubarTrigger>File</MenubarTrigger>
			<MenubarContent>
				<MenubarItem @select="goHome">Home Page</MenubarItem>
				<MenubarItem @select="reload">
					Reload
					<MenubarShortcut>Ctrl + R</MenubarShortcut>
				</MenubarItem>
				<MenubarItem @select="toggleDevTools">DevTools</MenubarItem>
				<MenubarSeparator />
				<MenubarItem @select="goToCredits">Credits</MenubarItem>
			</MenubarContent>
		</MenubarMenu>
	</Menubar>
</template>

<style>
/*  */
</style>
