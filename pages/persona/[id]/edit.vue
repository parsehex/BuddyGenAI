<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-vue-next';
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
import { useTitle } from '@vueuse/core';
import { useAppStore } from '@/stores/main';
import type { ProfilePicQuality } from '@/lib/api/types-api';
import { descriptionFromKeywords } from '@/lib/prompt/persona';
import {
	genderFromName,
	keywordsFromNameAndDescription,
} from '~/lib/prompt/sd';

// TODO idea: when remixing, if theres already a description then revise instead of write anew

const { toast } = useToast();
const { complete } = useCompletion({ api: urls.message.completion() });
const { updateBuddies } = useAppStore();
const store = useAppStore();

const route = useRoute();
const id = route.params.id as string;

const persona = ref(null as BuddyVersionMerged | null);

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
	persona.value = await api.buddy.getOne(id);
	profilePictureValue.value = urls.buddy.getProfilePic(
		`${persona.value?.id}/${pic}`
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
	persona.value = await api.buddy.getOne(id);
	if (persona.value) {
		nameValue.value = persona.value.name;
		descriptionValue.value = persona.value.description || '';
	}
	if (persona.value?.profile_pic) {
		profilePictureValue.value = urls.buddy.getProfilePic(
			`${persona.value.id}/${persona.value.profile_pic}`
		);
	}
	if (persona.value?.profile_pic_prompt) {
		profilePicturePrompt.value = persona.value.profile_pic_prompt;
	}
	useTitle(`Edit ${persona.value?.name || 'Buddy'} | BuddyGen`);

	allProfilePics.value = await api.buddy.profilePic.getAll(id);
});

const handleSave = async () => {
	await api.buddy.updateOne({
		id,
		name: nameValue.value,
		description: descriptionValue.value,
	});
	await navigateTo(`./view`);
};

const picQuality = ref(2 as ProfilePicQuality);
const picQual = computed({
	get: () => picQuality.value + '',
	set: (val: string) => {
		picQuality.value = parseInt(val) as ProfilePicQuality;
	},
});

const refreshProfilePicture = async () => {
	if (!persona.value) {
		return;
	}
	updatingProfilePicture.value = true;
	await api.buddy.updateOne({
		id,
		profile_pic_prompt: profilePicturePrompt.value,
	});
	const genderPrompt = genderFromName(
		persona.value.name,
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

	persona.value = await api.buddy.getOne(id);

	profilePictureValue.value = urls.buddy.getProfilePic(
		`${persona.value?.id}/${res.output}`
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
		persona.value?.name || '',
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
	const descVal = persona.value?.description || '';
	const promptStr = keywordsFromNameAndDescription(
		persona.value?.name || '',
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
			<NuxtLink class="ml-4" :to="`/persona/${id}/view`">View</NuxtLink>
			<!-- <NuxtLink class="ml-4" :to="`/persona/${id}/history`">
				Version History
			</NuxtLink> -->
		</div>
		<Card class="whitespace-pre-wrap w-full">
			<CardContent>
				<div class="flex flex-col items-center">
					<Input
						v-model="nameValue"
						placeholder="Persona name"
						size="lg"
						class="mb-2 w-2/5"
					/>
					<BuddyAvatar v-if="persona" :persona="persona" size="lg" />

					<!-- TODO BuddyAvatarSelect :persona @select-pic -->
					<Collapsible
						v-if="allProfilePics.length > 1"
						v-model:open="allPicsOpen"
						class="space-y-2 w-full my-2 border-2 border-gray-200 rounded-lg"
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
										@click="handleSelectProfilePic(pic)"
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
					<Label for="profile-picture" class="flex flex-col items-center">
						<span class="text-lg">Appearance</span>
					</Label>
					<div class="flex w-full items-center gap-1.5">
						<Input
							id="profile-picture"
							v-model="profilePicturePrompt"
							class="p-2 border border-gray-300 rounded"
							placeholder="tan suit, sunglasses"
						/>

						<Popover
							:open="keywordsPopover"
							@update:open="
								($event) => {
									if (creatingKeywords || !store.chatServerRunning) {
										return;
									}
									keywordsPopover = $event;
								}
							"
						>
							<PopoverTrigger as-child>
								<Button
									type="button"
									class="magic"
									title="Suggest keywords"
									:disabled="creatingKeywords || !store.chatServerRunning"
								>
									<Sparkles />
								</Button>
							</PopoverTrigger>
							<PopoverContent
								side="top"
								:avoid-collisions="true"
								align="start"
								class="flex flex-col px-2 py-4"
							>
								<div>
									Suggest:
									<Button
										class="p-2 bg-blue-500 text-white rounded"
										@click="suggestKeywords('more')"
									>
										More
									</Button>
									<Button
										class="p-2 bg-blue-500 text-white rounded"
										@click="suggestKeywords('new')"
									>
										New Keywords
									</Button>
								</div>

								<Spinner v-if="creatingKeywords" />

								<p v-if="createdKeywords" class="my-4">
									<span class="text-sm">AI Suggestion:</span>
									<br />
									<span class="font-bold">{{ createdKeywords }}</span>
								</p>
								<Button
									v-if="createdKeywords"
									class="p-2 success text-white rounded"
									@click="acceptKeywords"
								>
									Accept & Make Picture
								</Button>
							</PopoverContent>
						</Popover>
					</div>

					<div class="flex flex-col items-center justify-center my-1">
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
					</div>
					<div class="flex flex-col items-center justify-center">
						<Progress v-if="gen" :model-value="prog * 100" class="mt-2" />
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
							:placeholder="`${persona?.name} is...`"
							class="w-full min-h-48"
						/>
					</label>
					<Button @click="handleSave">Save</Button>
				</div>
				<Card class="w-full mt-4">
					<CardHeader>
						<h2 class="font-bold">Description Wizard</h2>
						<p class="text-sm text-gray-500">
							Create a new description for {{ persona?.name }} using the AI Description
							Wizard.
						</p>
					</CardHeader>
					<CardContent>
						<Label>
							<span class="text-lg">Keywords that describe {{ persona?.name }}</span>
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
