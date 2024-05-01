<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
// import { getPersona, updatePersona } from '@/lib/api/persona';
import type { Buddy, BuddyVersionMerged } from '@/lib/api/types-db';
import Spinner from '@/components/Spinner.vue';
import { useToast } from '@/components/ui/toast';
// import $f from '@/lib/api/$fetch';
import api from '@/lib/api/db';
import urls from '@/lib/api/urls';
import BuddyAvatar from '~/components/BuddyAvatar.vue';
import { useTitle } from '@vueuse/core';
import { useAppStore } from '~/stores/main';

// TODO idea: when remixing, if theres already a description then revise instead of write anew

const { toast } = useToast();
const { complete } = useCompletion({ api: urls.message.completion() });
const { updateBuddies } = useAppStore();

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

const refreshProfilePicture = async () => {
	updatingProfilePicture.value = true;
	await api.buddy.updateOne({
		id,
		profile_pic_prompt: profilePicturePrompt.value,
	});
	toast({ variant: 'info', description: 'Generating new profile picture...' });
	const res = await api.buddy.profilePic.createOne(id);

	persona.value = await api.buddy.getOne(id);

	profilePictureValue.value = urls.buddy.getProfilePic(
		`${persona.value?.id}/${res.output}`
	);
	updatingProfilePicture.value = false;

	allProfilePics.value = await api.buddy.profilePic.getAll(id);
	updateBuddies();
};

const remixDescription = async () => {
	const desc = wizInput.value;
	const prompt = `The following input is a description of someone named ${persona.value?.name}. Provide a succinct description of them using common language.\n\nInput:\n`;
	const value = await complete(prompt + desc, {
		body: { max_tokens: 100, temperature: 1 },
	});
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
</script>

<template>
	<div class="flex flex-col items-center">
		<h1 class="text-2xl font-bold">Edit Buddy</h1>
		<div class="flex items-center mb-2">
			<NuxtLink class="ml-4" :to="`/persona/${id}/view`">View</NuxtLink>
			<NuxtLink class="ml-4" :to="`/persona/${id}/history`">
				Version History
			</NuxtLink>
		</div>
		<Card class="whitespace-pre-wrap w-full md:w-5/6 p-2 pt-6">
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
						class="space-y-2 w-full my-2 border border-gray-200 rounded-lg"
					>
						<CollapsibleTrigger as-child>
							<div
								class="text-md flex items-center justify-center cursor-pointer hover:bg-gray-100"
							>
								Other Profile Pictures
								<Button variant="ghost" size="sm" class="w-9 p-0 hover:bg-transparent">
									<ChevronDown v-if="!allPicsOpen" />
									<ChevronUp v-else />
								</Button>
							</div>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<ScrollArea class="w-full mx-auto">
								<div class="flex flex-wrap justify-center w-max">
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
					<Label class="flex flex-col items-center space-y-2">
						<span class="text-lg">Appearance</span>
						<Input
							v-model="profilePicturePrompt"
							placeholder="tan suit, sunglasses"
							@keydown.enter="refreshProfilePicture"
						/>
					</Label>
					<div class="flex flex-col items-center justify-center">
						<Button type="button" @click="refreshProfilePicture" class="mt-2">
							{{ profilePictureValue ? 'Refresh Picture' : 'Create Profile Picture' }}
						</Button>
						<Spinner
							:style="{ visibility: updatingProfilePicture ? 'visible' : 'hidden' }"
						/>
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
						<Button @click="remixDescription">Create Description</Button>
						<div v-if="remixedDescription">
							<p class="text-lg">Remixed Description:</p>
							<p class="text-lg">{{ remixedDescription }}</p>
							<Button @click="acceptRemixedDescription">Accept</Button>
						</div>
					</CardContent>
				</Card>
			</CardContent>
		</Card>
	</div>
</template>

<style>
/*  */
</style>
