<script setup lang="ts">
import { ref, watch } from 'vue';
import { v4 } from 'uuid';
import {
	Button
} from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/src/stores/main';
import OptionSection from './OptionSection.vue';

const store = useAppStore();

const userName = ref(store.settings.user_name);
const userImage = ref(store.settings.user_image);
const userImageFile = ref<File | null>(null);
const userDescription = ref(store.settings.user_description);
const userDescriptionAssistant = ref(store.settings.user_description_assistant);
const userDescriptionBuddies = ref(store.settings.user_description_buddies);

const updateName = async () => {
	if (store.settings.user_name === userName.value) return;
	store.settings.user_name = userName.value;
};

const updateImage = async () => {
	if (store.settings.user_image === userImage.value) return;
	store.settings.user_image = userImage.value;
};

const handleImageUpload = async (event: Event) => {
	const target = event.target as HTMLInputElement;
	if (target.files && target.files[0]) {
		userImageFile.value = target.files[0];
		const reader = new FileReader();
		reader.onload = async (e) => {
			const base64Image = e.target?.result as string;
			store.settings.user_image = base64Image;
		};
		reader.readAsDataURL(userImageFile.value);
	}
};

watch(
	() => store.settings.user_image,
	(newVal) => {
		userImage.value = newVal;
	}
);

// NOTE these dont trigger a system message refresh so they take effect on next message/reload
const updateDescription = async () => {
	if (store.settings.user_description === userDescription.value) return;
	store.settings.user_description = userDescription.value;
};

const updateDescriptionAssistant = async () => {
	store.settings.user_description_assistant = userDescriptionAssistant.value;
};

const updateDescriptionBuddies = async () => {
	store.settings.user_description_buddies = userDescriptionBuddies.value;
};
</script>
<template>
	<div>
		<OptionSection label="Your Name" labelName="name" orientation="vertical">
			<Input v-model="userName" @blur="updateName()" id="name"
				class="border border-gray-300 dark:border-gray-700 rounded-md p-2" type="text" />
		</OptionSection>
		<OptionSection label="Profile Image" labelName="profile-image" orientation="vertical">
			<div class="flex items-center space-x-2">
				<Input v-model="userImage" @blur="updateImage()" id="profile-image"
					class="border border-gray-300 dark:border-gray-700 rounded-md p-2 flex-grow" type="text"
					placeholder="Enter image URL or upload" />
				<label for="file-upload">
					<Button> Upload Image </Button>
				</label>
				<input id="file-upload" type="file" accept="image/*" @change="handleImageUpload" class="hidden" />
			</div>
			<div v-if="userImage" class="mt-4">
				<img :src="userImage" alt="User Profile Image" class="w-32 h-32 object-cover rounded-full" />
			</div>
		</OptionSection>
		<OptionSection label="Your Description" labelName="user-description" orientation="vertical">
			<Textarea v-model="userDescription" @blur="updateDescription()" id="user-description"
				class="border border-gray-300 dark:border-gray-700 rounded-md p-2" />
		</OptionSection>
		<OptionSection label="Show description to Assistant" labelName="show-desc-assistant" orientation="horizontal">
			<Switch v-model:checked="userDescriptionAssistant" @update:checked="updateDescriptionAssistant()"
				id="show-desc-assistant" />
		</OptionSection>
		<OptionSection label="Show description to Buddies" labelName="show-desc-buddies" orientation="horizontal">
			<Switch v-model:checked="userDescriptionBuddies" @update:checked="updateDescriptionBuddies()"
				id="show-desc-buddies" />
		</OptionSection>
	</div>
</template>
