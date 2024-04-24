<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// import { getPersona, updatePersona } from '@/lib/api/persona';
import type { Persona, PersonaVersionMerged } from '@/lib/api/types-db';
import Spinner from '@/components/Spinner.vue';
import { useToast } from '@/components/ui/toast';
// import $f from '@/lib/api/$fetch';
import api from '@/lib/api/db';
import urls from '@/lib/api/urls';

// TODO idea: when remixing, if theres already a description then revise instead of write anew

const { toast } = useToast();
const { complete } = useCompletion({ api: urls.message.completion() });

const route = useRoute();
const id = route.params.id as string;

const persona = ref(null as PersonaVersionMerged | null);

const nameValue = ref('');
const descriptionValue = ref('');
const profilePictureValue = ref('');
const profilePicturePrompt = ref('');

const wizInput = ref('');

const updatingProfilePicture = ref(false);

const remixedDescription = ref('');

// TODO overhaul refreshing profile picture
// basically, allow the user to refresh the pic, but don't update until they save (+ do versioning on pics)
// how it'll actually work:
// page stays like it is until user clicks Refresh, at which point:
// show new elements showing the old avatar and the newly generated one which will get saved onSave
// (possibly have a generation history viewer)
// we can clean up pics that werent used

onBeforeMount(async () => {
	persona.value = await api.persona.getOne(id);
	if (persona.value) {
		nameValue.value = persona.value.name;
		descriptionValue.value = persona.value.description || '';
	}
	if (persona.value?.profile_pic) {
		profilePictureValue.value = urls.persona.getProfilePic(
			persona.value.profile_pic
		);
	}
	if (persona.value?.profile_pic_prompt) {
		profilePicturePrompt.value = persona.value.profile_pic_prompt;
	}
});

const handleSave = async () => {
	await api.persona.updateOne({
		id,
		name: nameValue.value,
		description: descriptionValue.value,
	});
	await navigateTo(`./view`);
};

const refreshProfilePicture = async () => {
	updatingProfilePicture.value = true;
	await api.persona.updateOne({
		id,
		profile_pic_prompt: profilePicturePrompt.value,
	});
	toast({ variant: 'info', description: 'Generating new profile picture...' });
	const res = await api.persona.profilePic.createOne(id);

	profilePictureValue.value = urls.persona.getProfilePic(res.output);
	updatingProfilePicture.value = false;
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
	<div class="container flex flex-col items-center">
		<h1 class="text-2xl font-bold">Edit Buddy</h1>
		<div>
			<NuxtLink class="ml-4" :to="`/persona/${id}/view`">View</NuxtLink>
			<NuxtLink class="ml-4" :to="`/persona/${id}/history`">
				Version History
			</NuxtLink>
		</div>
		<Card class="whitespace-pre-wrap w-full md:w-1/2 p-2 pt-6">
			<CardContent>
				<div class="flex flex-col items-center">
					<Input
						v-model="nameValue"
						placeholder="Persona name"
						size="lg"
						class="mb-2"
					/>
					<Avatar size="lg">
						<AvatarImage :src="profilePictureValue" />
						<AvatarFallback>
							<img src="/assets/logo.png" alt="Default Buddy icon" />
						</AvatarFallback>
					</Avatar>
					<Label>
						<!-- TODO describe better -->
						<span class="text-lg">Extra keywords for prompt</span>
						<Input
							v-model="profilePicturePrompt"
							placeholder="tan suit, sunglasses"
						/>
					</Label>
					<div class="flex flex-col items-center justify-center">
						<Button type="button" @click="refreshProfilePicture">
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
						/>
					</label>
					<Button @click="handleSave">Save</Button>
				</div>
				<Card>
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
