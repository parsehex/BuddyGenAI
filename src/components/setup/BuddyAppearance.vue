<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue';
import { useAppStore } from '@/stores/main';
import type { AppearanceCategory } from '@/lib/ai/appearance-options';
import Spinner from '../Spinner.vue';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { useToast } from '../ui/toast';
import { api } from '@/src/lib/api';
import { genderFromName } from '@/src/lib/prompt/sd';
import { complete } from '@/src/lib/ai/complete';
import router from '@/src/lib/router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BuddyAppearanceOptions from '../BuddyAppearanceOptions.vue';
import BuddyAvatar from '../BuddyAvatar.vue';
import { getImage } from '@/src/lib/api/images';

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
const buddyName = ref('');
const picQuality = ref('2');

const generatedAppearanceOptions = ref({} as Record<AppearanceCategory, string[]>);
const selectedAppearanceOptions = ref({} as Record<AppearanceCategory, string>);

// image generation progress
const imageLoading = ref(false);
const progress = ref(0);
watch(
	() => [store.imgGenerating, store.imgProgress],
	() => {
		imageLoading.value = store.imgGenerating;
		progress.value = store.imgProgress;
	}
);

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
	const imgData = await api.buddy.profilePic.createOne(
		id,
		+picQuality.value,
		gender
	);
	const res = await api.buddy.profilePic.addOne(id, imgData);

	newBuddy.value.profile_pic = await getImage(res.output);
	updatingProfilePicture.value = false;
};

const handleProfilePicUpload = (event: Event) => {
	const input = event.target as HTMLInputElement;
	if (input.files && input.files[0]) {
		const reader = new FileReader();
		reader.onload = async (e) => {
			const base64 = e.target?.result as string;
			const res = await api.buddy.profilePic.addOne(newBuddy.value.id, base64);
			newBuddy.value = await api.buddy.getOne(newBuddy.value.id);
			newBuddy.value.profile_pic = await getImage(res.output);
			updatingProfilePicture.value = false;
		};

		reader.readAsDataURL(input.files[0]);
	}
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

const imgProvider = computed(() => store.settings.selected_provider_image === '0' ? '' : store.settings.selected_provider_image);
</script>
<template>
	<Card class="mt-4 p-2 w-full">
		<CardContent>
			<h2 v-if="store.newHere" class="text-lg mt-4 text-center"> {{ `Customize ${buddyName || 'your buddy'}'s
				appearance` }} </h2>
			<p class="my-2 text-center">
				<span class="text-lg">{{ buddyName }}</span>
			</p>
			<div class="flex flex-col items-center">
				<BuddyAvatar v-if="newBuddy" :buddy="newBuddy" :no-default="true" size="lg" class="text-3xl" />
				<p v-if="newBuddy && imgProvider" class="text-sm text-gray-500 select-none"> Images are created using AI and may
					have unexpected results. </p>
				<div class="flex flex-col items-center my-2">
					<Label for="profile-pic-upload" class="text-md mb-2">Upload Profile Picture</Label>
					<Input id="profile-pic-upload" type="file" accept="image/*" @change="handleProfilePicUpload"
						class="w-full max-w-xs" />
				</div>
				<BuddyAppearanceOptions v-if="newBuddy && imgProvider" :buddy="newBuddy"
					:profile-pic-prompt="profilePicturePrompt" @update-profile-pic-prompt="profilePicturePrompt = $event"
					@refresh-profile-picture="refreshProfilePicture" v-model:appearance-options="generatedAppearanceOptions"
					v-model:selected-appearance-options="selectedAppearanceOptions" />
				<Spinner v-if="updatingProfilePicture" />
				<Progress v-if="imageLoading && progress > 0" :model-value="progress * 100" class="mt-2" />
				<Button @click="refreshProfilePicture" class="mt-4 p-2 bg-blue-500 text-white rounded"> New Profile Picture
				</Button>
			</div>
			<Button @click="handleSave" class="mt-4 p-2 success rounded"> Save </Button>
		</CardContent>
	</Card>
</template>
