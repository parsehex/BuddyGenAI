<script setup lang="ts">
// TODO convert this into a page that user can go to later (name: Persona Wizard)
import { getThreads, createThread } from '@/lib/api/thread';
import { useCompletion } from 'ai/vue';
import { useToast } from '~/components/ui/toast';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import type { PersonaVersionMerged } from '~/server/database/types';
import Spinner from '~/components/Spinner.vue';

const { toast } = useToast();
const { complete } = useCompletion();

const { value: threads } = await getThreads();
let thread = threads[0];
if (threads.length) {
	// TODO get and go to latest? (need sort option)
	await navigateTo(`/chat/${thread.id}`);
}

const userNameValue = ref('');
const personaName = ref('');
const personaKeywords = ref('');
const createdDescription = ref('');

const acceptedPersona = ref(false);
const newPersona = ref(null as PersonaVersionMerged | null);
const updatingProfilePicture = ref(false);

// TODO figure out temporary pics
const profilePictureValue = ref('');

const handleSave = async () => {
	if (!userNameValue.value) {
		toast({ variant: 'destructive', description: 'Please fill out your name.' });
		return;
	}
	if (!personaName.value || !personaKeywords.value) {
		toast({ variant: 'destructive', description: "Please fill out your partner's Name and Keywords." });
		return;
	}
	if (!newPersona.value) {
		toast({ variant: 'destructive', description: 'Please create a persona first.' });
		return;
	}
	const settings = {
		user_name: userNameValue.value,
	};
	await $fetch(`/api/setting`, {
		method: 'PUT',
		body: JSON.stringify({ values: settings }),
	});

	const { id, name } = newPersona.value;
	const newThread = await $fetch(`/api/thread`, {
		method: 'POST',
		body: JSON.stringify({ name: `Chat with ${name}`, mode: 'persona', persona_id: id }),
		headers: { 'Content-Type': 'application/json' },
	});

	await navigateTo(`/chat/${newThread.id}`);
};

const refreshProfilePicture = async () => {
	if (!newPersona.value) {
		toast({ variant: 'destructive', description: 'Please create a persona first.' });
		return;
	}
	if (updatingProfilePicture.value) {
		return;
	}
	const id = newPersona.value.id;
	updatingProfilePicture.value = true;
	toast({ variant: 'info', description: 'Generating new profile picture...' });
	await $fetch(`/api/profile-pic-from-persona?persona_id=${id}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	const cacheVal = Math.random() * 1000;
	profilePictureValue.value = `/api/profile-pic?persona_id=${id}&cache=${cacheVal}`;
	updatingProfilePicture.value = false;
};

const createDescription = async () => {
	if (!personaName.value || !personaKeywords.value) {
		toast({ variant: 'destructive', description: 'Please fill out Name and Keywords.' });
		return;
	}
	const desc = personaKeywords.value;
	const prompt = `The following input is a description of someone named ${personaName.value}. Expand upon the original and provide a succinct description of ${personaName.value} using common language.\n\nInput:\n`;
	const value = await complete(prompt + desc, { body: { max_tokens: 100, temperature: 1 } });
	if (!value) {
		toast({ variant: 'destructive', description: 'Error remixing description. Please try again.' });
		return;
	}
	createdDescription.value = value;
};

const acceptPersona = async () => {
	// save
	const p = await $fetch(`/api/persona`, {
		method: 'POST',
		body: JSON.stringify({
			name: personaName.value,
			description: createdDescription.value,
		}),
		headers: { 'Content-Type': 'application/json' },
	});
	newPersona.value = p;

	acceptedPersona.value = true;

	// generate pic
	toast({ variant: 'info', description: 'Generating profile picture...' });
	await refreshProfilePicture();
};
</script>

<template>
	<div class="container flex flex-col items-center">
		<h1 class="text-4xl font-bold">Welcome to AI Persona</h1>
		<Card class="whitespace-pre-wrap w-full md:w-1/2 p-2 pt-6">
			<CardContent class="flex flex-col items-center">
				<p class="text-lg mt-4">What should we call you?</p>
				<Input v-model="userNameValue" class="mt-2 p-2 border border-gray-300 rounded" placeholder="John" @keyup.enter="handleSave" />

				<!-- make read only once accepted -->
				<Card v-if="!acceptedPersona" class="mt-4 p-2 w-full">
					<CardContent>
						<p class="text-lg mt-4">Describe your first chat partner</p>
						<Input v-model="personaName" class="mt-2 p-2 border border-gray-300 rounded" placeholder="Name" />
						<div class="flex flex-row items-center space-x-2 w-full">
							<Label for="persona-keywords">Keywords</Label>
							<Input
								id="persona-keywords"
								v-model="personaKeywords"
								class="mt-2 p-2 border border-gray-300 rounded"
								placeholder="friendly, helpful, funny"
								@keyup.enter="createDescription"
							/>
							<!-- TODO add more options to create description -->

							<Button @click="createDescription" class="mt-4 p-2 bg-blue-500 text-white rounded">Create</Button>
						</div>
						<p class="mt-4" v-if="createdDescription">
							Created Description:
							<br />
							<span class="text-lg ml-3">{{ createdDescription }}</span>
						</p>
						<Button v-if="createdDescription && !acceptedPersona" @click="acceptPersona" class="mt-4 p-2 bg-blue-500 text-white rounded">Accept Description</Button>
					</CardContent>
				</Card>
				<Card v-else class="mt-4 p-2 w-full">
					<CardContent>
						<p class="text-lg mt-4">Your first chat partner</p>
						<p class="mt-2 text-center">
							<span class="text-lg ml-3">{{ personaName }}</span>
						</p>
						<div class="flex flex-col items-center">
							<Avatar v-if="profilePictureValue" size="lg" class="mt-2">
								<AvatarImage :src="profilePictureValue" />
							</Avatar>
							<Spinner v-if="updatingProfilePicture" class="mt-2" />
							<Button @click="refreshProfilePicture" class="mt-4 p-2 bg-blue-500 text-white rounded">Refresh</Button>
						</div>
						<p class="mt-2"
							>Description:
							<span class="text-lg ml-3">{{ createdDescription }}</span>
						</p>
					</CardContent>
				</Card>

				<Button v-if="acceptedPersona && profilePictureValue" @click="handleSave" class="mt-4 p-2 bg-blue-500 text-white rounded">Save</Button>
			</CardContent>
		</Card>
	</div>
</template>

<style lang="scss"></style>
