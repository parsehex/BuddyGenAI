<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-vue-next';
import { ref, onBeforeMount, watch, computed } from 'vue';
import { useRoute } from 'vue-router/auto';
import router from '@/lib/router';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Buddy, BuddyVersionMerged } from '@/lib/api/types-db';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import urls from '@/lib/api/urls';
import BuddyAvatar from '@/components/BuddyAvatar.vue';
import Spinner from '@/components/Spinner.vue';
import { useAppStore } from '@/stores/main';
import type { ProfilePicQuality } from '@/lib/api/types-api';
import { descriptionFromKeywords } from '@/src/lib/prompt/buddy';
import {
	genderFromName,
	keywordsFromNameAndDescription,
	appearanceOptionsFromNameAndDescription,
} from '@/lib/prompt/sd';
import {
	appearanceToPrompt,
	getPartialSchema,
	jsonSchema,
} from '@/src/lib/prompt/appearance';
import DevOnly from '@/src/components/DevOnly.vue';
import BuddyAvatarSelect from '@/src/components/BuddyAvatarSelect.vue';
import BuddyAppearanceOptions from '@/src/components/BuddyAppearanceOptions.vue';

// TODO idea: when remixing, if theres already a description then revise instead of write anew

const { toast } = useToast();
const { complete } = useCompletion({ api: urls.message.completion() });
const { updateBuddies } = useAppStore();
const store = useAppStore();

const route = useRoute();
const id = route.params.id as string;

const buddy = ref(null as BuddyVersionMerged | null);

const nameValue = ref('');
const descriptionValue = ref('');
const profilePictureValue = ref('');
const profilePicturePrompt = ref('');

const wizInput = ref('');

const updatingProfilePicture = ref(false);

const remixedDescription = ref('');

const allProfilePics = ref([] as string[]);
const allPicsOpen = ref(false);

const gen = ref(false);
const prog = ref(0);
watch(
	() => [store.imgGenerating, store.imgProgress],
	() => {
		gen.value = store.imgGenerating;
		prog.value = store.imgProgress;
	}
);

const handleSelectProfilePic = async (pic: string) => {
	await api.buddy.updateOne({
		id,
		profile_pic: pic,
	});
	buddy.value = await api.buddy.getOne(id);
	profilePictureValue.value = urls.buddy.getProfilePic(
		`${buddy.value?.id}/${pic}`
	);

	updateBuddies();
};

// TODO overhaul refreshing profile picture
// basically, allow the user to refresh the pic, but don't update until they save (+ do versioning on pics)
// how it'll actually work:
// page stays like it is until user clicks Refresh, at which point:
// show new elements showing the old avatar and the newly generated one which will get saved onSave
// (possibly have a generation history viewer)
// we can clean up pics that werent used

onBeforeMount(async () => {
	buddy.value = await api.buddy.getOne(id);
	if (buddy.value) {
		nameValue.value = buddy.value.name;
		descriptionValue.value = buddy.value.description || '';
	}
	if (buddy.value?.profile_pic) {
		profilePictureValue.value = urls.buddy.getProfilePic(
			`${buddy.value.id}/${buddy.value.profile_pic}`
		);
	}
	if (buddy.value?.profile_pic_prompt) {
		profilePicturePrompt.value = buddy.value.profile_pic_prompt;
	}

	allProfilePics.value = await api.buddy.profilePic.getAll(id);
});

const handleSave = async () => {
	// TODO validate name

	await api.buddy.updateOne({
		id,
		name: nameValue.value,
		description: descriptionValue.value,
	});
	await router.push(`./view`);
};

const picQuality = ref(3 as ProfilePicQuality);
const picQual = computed({
	get: () => picQuality.value + '',
	set: (val: string) => {
		picQuality.value = parseInt(val) as ProfilePicQuality;
	},
});

const refreshProfilePicture = async () => {
	if (!buddy.value) {
		return;
	}
	updatingProfilePicture.value = true;
	await api.buddy.updateOne({
		id,
		profile_pic_prompt: profilePicturePrompt.value,
	});
	const genderPrompt = genderFromName(
		buddy.value.name,
		profilePicturePrompt.value
	);
	let gender = '';
	const completion = await complete(genderPrompt, {
		body: { max_tokens: 5, temperature: 0.01 },
	});
	console.log(genderPrompt, completion);
	if (completion) {
		gender = completion;
	}
	const res = await api.buddy.profilePic.createOne(id, picQuality.value, gender);

	buddy.value = await api.buddy.getOne(id);

	profilePictureValue.value = urls.buddy.getProfilePic(
		`${buddy.value?.id}/${res.output}`
	);
	updatingProfilePicture.value = false;

	allProfilePics.value = await api.buddy.profilePic.getAll(id);
	updateBuddies();
};

const generating = ref(false);
const remixDescription = async () => {
	if (!store.chatServerRunning) {
		toast({
			variant: 'destructive',
			description: 'Please go to the Chat tab and start the server first.',
		});
		return;
	}
	const promptStr = descriptionFromKeywords(
		buddy.value?.name || '',
		wizInput.value
	);
	generating.value = true;
	const value = await complete(promptStr, {
		body: { max_tokens: 100, temperature: 1 },
	});
	generating.value = false;
	if (!value) {
		toast({
			variant: 'destructive',
			description: 'Error remixing description. Please try again.',
		});
		return;
	}
	remixedDescription.value = value;
};
const acceptRemixedDescription = () => {
	descriptionValue.value = remixedDescription.value;
	remixedDescription.value = '';
};

let chosenType = 'more';

const keywordsPopover = ref(false);
const createdKeywords = ref('');
const creatingKeywords = ref(false);
const suggestKeywords = async (type: 'more' | 'new') => {
	chosenType = type;
	const descVal = buddy.value?.description || '';
	const promptStr = keywordsFromNameAndDescription(
		buddy.value?.name || '',
		descVal,
		type === 'more' ? profilePicturePrompt.value : undefined
	);
	let value = '';
	try {
		creatingKeywords.value = true;
		value = (await complete(promptStr, {
			body: { max_tokens: 75, temperature: 0.75 },
		})) as string;
		creatingKeywords.value = false;
	} catch (e) {
		creatingKeywords.value = false;
		console.error(e);
		value = '';
	}
	value = value || '';
	value = value.trim();
	if (!value) {
		toast({
			variant: 'destructive',
			description: 'Error generating keywords. Please try again.',
		});
		return;
	}
	createdKeywords.value = value;
};

const acceptKeywords = () => {
	const existingKeywords = profilePicturePrompt.value;
	if (chosenType === 'more') {
		if (existingKeywords) {
			profilePicturePrompt.value = `${existingKeywords}, ${createdKeywords.value}`;
		} else {
			profilePicturePrompt.value = createdKeywords.value;
		}
	} else {
		profilePicturePrompt.value = createdKeywords.value;
	}
	createdKeywords.value = '';
	keywordsPopover.value = false;

	refreshProfilePicture();
};
</script>

<template>
	<ScrollArea class="h-screen flex flex-col items-center">
		<h1 class="text-2xl font-bold text-center">Edit Buddy</h1>
		<div class="flex items-center justify-center mb-2">
			<Button
				type="button"
				@click="router.push(`/buddy/${id}/view`)"
				variant="outline"
			>
				View
			</Button>
			<!-- <RouterLink class="ml-4" :to="`/buddy/${id}/history`">
				Version History
			</RouterLink> -->
		</div>
		<Card class="whitespace-pre-wrap w-full">
			<CardContent>
				<div class="flex flex-col items-center">
					<Input
						v-model="nameValue"
						placeholder="Buddy name"
						size="lg"
						class="my-2 w-2/5"
					/>
					<BuddyAvatar v-if="buddy" :buddy="buddy" size="lg" />

					<p class="text-sm text-gray-500 select-none">
						Images are created using AI and may have unexpected results.
					</p>

					<BuddyAvatarSelect
						v-if="buddy"
						:buddy="buddy"
						:all-profile-pics="allProfilePics"
						@select-profile-pic="handleSelectProfilePic"
					/>

					<BuddyAppearanceOptions
						v-if="buddy"
						:buddy="buddy"
						:profile-pic-prompt="profilePicturePrompt"
						@refresh-profile-pic="refreshProfilePicture"
						@update-profile-pic-prompt="profilePicturePrompt = $event"
					/>

					<!-- <div
						class="flex flex-col items-center justify-center my-1"
						v-if="!store.isExternalProvider"
					>
						<Label class="text-lg">Picture Quality</Label>
						<Select v-model:model-value="picQual" class="my-2">
							<SelectTrigger>
								<SelectValue placeholder="Buddy" />
							</SelectTrigger>
							<SelectContent>
								<SelectLabel>Quality</SelectLabel>
								<SelectGroup>
									<SelectItem value="1">Low</SelectItem>
									<SelectItem value="2">Medium</SelectItem>
									<SelectItem value="3">High</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div> -->
					<div class="flex flex-col items-center justify-center w-full">
						<Progress v-if="gen" :model-value="prog * 100" class="my-2" />
						<Button type="button" @click="refreshProfilePicture" class="mt-2">
							{{ profilePictureValue ? 'Refresh Picture' : 'Create Profile Picture' }}
						</Button>
					</div>
				</div>
				<div class="flex flex-col items-center space-y-4">
					<label class="text-lg w-full text-center">
						Description
						<Textarea
							v-model="descriptionValue"
							:placeholder="`${buddy?.name} is...`"
							class="w-full min-h-48"
						/>
					</label>
					<Button @click="handleSave">Save</Button>
				</div>
				<Card class="w-full mt-4">
					<CardHeader>
						<h2 class="font-bold">Description Wizard</h2>
						<p class="text-sm text-gray-500">
							Create a new description for {{ buddy?.name }} using the AI Description
							Wizard.
						</p>
					</CardHeader>
					<CardContent>
						<Label>
							<span class="text-lg">Keywords that describe {{ buddy?.name }}</span>
							<Input
								v-model="wizInput"
								placeholder="helpful, approachable, talkative..."
								@keydown.enter="remixDescription"
							/>
						</Label>
						<div class="flex items-center">
							<Button class="mt-2" @click="remixDescription">Remix Description</Button>
							<Spinner v-if="generating" />
						</div>
						<div v-if="remixedDescription">
							<p class="text-lg">New Description:</p>
							<p class="text-lg">{{ remixedDescription }}</p>
							<Button class="mt-2 success" @click="acceptRemixedDescription">
								Accept
							</Button>
						</div>
					</CardContent>
				</Card>
			</CardContent>
		</Card>
	</ScrollArea>
</template>

<style>
/*  */
</style>
