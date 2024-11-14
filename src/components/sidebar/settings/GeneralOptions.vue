<script setup lang="ts">
import { ref } from 'vue';
import {
	AccordionTrigger,
	AccordionItem,
	AccordionContent,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/src/stores/main';
import OptionSection from './OptionSection.vue';
const store = useAppStore();

const userName = ref(store.settings.user_name);

const updateName = async () => {
	if (store.settings.user_name === userName.value) return;
	store.settings.user_name = userName.value;
};
</script>

<template>
	<AccordionItem value="general-options">
		<AccordionTrigger>General Options</AccordionTrigger>
		<AccordionContent>
			<OptionSection label="Your Name" labelName="name" orientation="vertical">
				<Input
					v-model="userName"
					@blur="updateName()"
					id="name"
					class="border border-gray-300 dark:border-gray-700 rounded-md p-2"
					type="text"
				/>
			</OptionSection>
		</AccordionContent>
	</AccordionItem>
</template>
