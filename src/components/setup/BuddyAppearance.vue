<script setup lang="ts">
import { ref, toRefs, watch } from 'vue';
import { useAppStore } from '@/stores/main';
import type { AppearanceCategory } from '@/lib/ai/appearance-options';
import Spinner from '../Spinner.vue';
import { useToast } from '../ui/toast';
import { api } from '@/src/lib/api';
import { genderFromName } from '@/src/lib/prompt/sd';
import { complete } from '@/src/lib/ai/complete';
import router from '@/src/lib/router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BuddyAppearanceOptions from '../BuddyAppearanceOptions.vue';
import BuddyAvatar from '../BuddyAvatar.vue';

const props = defineProps({
	newBuddy: {
		type: Object as any,
		required: true,
	},
});
const { newBuddy } = toRefs(props);

const store = useAppStore();
const { toast } = useToast();
const updatingProfilePicture = ref(false);
const profilePicturePrompt = ref('');
const imageLoading = ref(false);
const buddyName = ref('');
const picQuality = ref('2');

const generatedAppearanceOptions = ref({} as Record<AppearanceCategory, string[]>);
const selectedAppearanceOptions = ref({} as Record<AppearanceCategory, string>);

const refreshProfilePicture = async () => {
	if (updatingProfilePicture.value) {
		return;
	}
	if (profilePicturePrompt.value.split(',').length < 4) {
		toast({
			variant: 'destructive',
			description: 'Please select all appearance options first.',
		});
		return;
	}
	console.log(generatedAppearanceOptions.value);
	const appOptStr = JSON.stringify(generatedAppearanceOptions.value);
	const selectedAppOptStr = JSON.stringify(selectedAppearanceOptions.value);
	await api.buddy.updateOne({
		id: newBuddy.value.id,
		profile_pic_prompt: profilePicturePrompt.value,
		appearance_options: appOptStr,
		selected_appearance_options: selectedAppOptStr,
	});
	const genderPrompt = genderFromName(
		buddyName.value,
		profilePicturePrompt.value
	);
	let gender = '';
	const completion = await complete(genderPrompt);
	console.log(genderPrompt, completion);
	if (completion) {
		gender = completion;
	}
	const id = newBuddy.value.id;
	updatingProfilePicture.value = true;
	const res = await api.buddy.profilePic.createOne(
		id,
		+picQuality.value,
		gender
	);

	newBuddy.value.profile_pic = res.output;
	updatingProfilePicture.value = false;
};

const handleSave = async () => {
	if (!newBuddy.value) {
		toast({
			variant: 'destructive',
			description: 'Please create a Buddy first.',
		});
		return;
	}

	const { id, name } = newBuddy.value;
	const newThread = await api.thread.createOne({
		name: `Chat with ${name}`,
		mode: 'persona',
		persona_id: id,
	});

	await store.updateThreads();

	await router.push(`/chat/${newThread.id}`);
};

defineEmits(['complete']);
</script>

<template>
  <Card class="mt-4 p-2 w-full">
		<CardContent>
			<h2 v-if="store.newHere" class="text-lg mt-4 text-center">
				{{ `Customize ${buddyName || 'your buddy'}'s appearance` }}
			</h2>
			<p class="my-2 text-center">
				<span class="text-lg">{{ buddyName }}</span>
			</p>
			<div class="flex flex-col items-center">
				<BuddyAvatar
					v-if="newBuddy"
					:buddy="newBuddy"
					:no-default="true"
					size="lg"
					class="text-3xl"
				/>
				<p
					class="text-sm text-gray-500 select-none"
					v-if="newBuddy"
				>
					Images are created using AI and may have unexpected results.
				</p>
				<BuddyAppearanceOptions
					v-if="newBuddy"
					:buddy="newBuddy"
					:profile-pic-prompt="profilePicturePrompt"
					@update-profile-pic-prompt="profilePicturePrompt = $event"
					@refresh-profile-picture="refreshProfilePicture"
					v-model:appearance-options="generatedAppearanceOptions"
					v-model:selected-appearance-options="selectedAppearanceOptions"
				/>

				<Spinner v-if="imageLoading" />
				<Button
					@click="refreshProfilePicture"
					class="mt-4 p-2 bg-blue-500 text-white rounded"
				>
					New Profile Picture
				</Button>
			</div>
			<p v-if="newBuddy.description" class="mt-2">
				Description:
				<span class="text-lg ml-3">{{ newBuddy.description }}</span>
			</p>
			<Button
				@click="handleSave"
				class="mt-4 p-2 success rounded"
			>
				Save
			</Button>
		</CardContent>
	</Card>
</template>
