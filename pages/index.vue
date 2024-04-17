<script setup lang="ts">
// TODO convert this into a page that user can go to later (name: Persona Wizard)
import { getThreads, createThread } from '@/lib/api/thread';
import { useCompletion } from 'ai/vue';
import { useToast } from '~/components/ui/toast';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import type { PersonaVersionMerged } from '~/server/database/types';
import Spinner from '~/components/Spinner.vue';
import { getPersonas } from '~/lib/api/persona';

const { toast } = useToast();
const { complete } = useCompletion();

const { value: threads } = await getThreads();
const { value: personas } = await getPersonas();

const userNameValue = ref('');
const personaName = ref('');
const personaKeywords = ref('');
const createdDescription = ref('');

const acceptedPersona = ref(false);
const newPersona = ref(null as PersonaVersionMerged | null);
const updatingProfilePicture = ref(false);

const relationshipToBuddy = ref('');

// TODO figure out temporary pics
const profilePictureValue = ref('');

const newHere = ref(false);
if (!threads.length || !personas.length) {
	newHere.value = true;
}

onBeforeMount(async () => {
	const settings = await $fetch('/api/setting?keys=user_name');
	if (settings.user_name) {
		userNameValue.value = settings.user_name;
	}
});

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
	const relationship = relationshipToBuddy.value ? `${personaName.value}'s relation to ${userNameValue.value}: ${relationshipToBuddy.value}` : '';
	const desc = personaKeywords.value;
	const prompt = `The following input is a description of someone named ${personaName.value}. Briefly expand upon the input to provide a succinct description of ${personaName.value} using common language.
${relationship}\nInput:\n`;
	const value = await complete(prompt + desc, { body: { max_tokens: 100, temperature: 0.75 } });
	if (!value) {
		toast({ variant: 'destructive', description: 'Error remixing description. Please try again.' });
		return;
	}
	createdDescription.value = value;
};

const acceptPersona = async (descriptionOrKeywords: 'description' | 'keywords') => {
	let personaDescription = createdDescription.value;
	if (descriptionOrKeywords === 'keywords') {
		personaDescription = personaKeywords.value;
	}
	const p = await $fetch(`/api/persona`, {
		method: 'POST',
		body: JSON.stringify({
			name: personaName.value,
			description: personaDescription,
		}),
		headers: { 'Content-Type': 'application/json' },
	});
	newPersona.value = p;

	acceptedPersona.value = true;
};
</script>

<template>
	<!-- TODO remaining FTE -->
	<!-- allow editing description (or something to fix broken generations) -->
	<div class="container flex flex-col items-center">
		<h1 class="text-4xl font-bold">
			{{ newHere ? 'Welcome to ' : '' }}
			BuddyGen
		</h1>
		<Avatar v-if="newHere && !acceptedPersona" size="lg" class="my-2">
			<img src="/assets/logo.png" alt="BuddyGen Logo" />
		</Avatar>
		<Card class="whitespace-pre-wrap w-full md:w-1/2 p-2 pt-6">
			<CardContent class="flex flex-col items-center">
				<h2 v-if="newHere" class="text-lg mt-4 text-center underline">What should we call you?</h2>
				<Input v-model="userNameValue" class="mt-3 p-2 border border-gray-300 rounded text-center" placeholder="John" @keyup.enter="handleSave" />

				<!-- make read only once accepted -->
				<Card v-if="!acceptedPersona" class="mt-4 p-2 w-full">
					<CardContent>
						<h2 class="text-lg mt-4 text-center underline">
							{{ personas.length ? 'Create a Buddy' : 'Create your first Buddy' }}
						</h2>
						<Input v-model="personaName" class="my-2 p-2 border border-gray-300 rounded" placeholder="Name" />
						<div class="flex flex-row items-center space-x-2 w-full">
							<!-- add tooltip with tips on good values -->
							<Label class="block grow">
								Keywords
								<Input
									id="persona-keywords"
									v-model="personaKeywords"
									class="mt-2 p-2 border border-gray-300 rounded"
									placeholder="friendly, helpful, funny"
									@keyup.enter="createDescription"
								/>
							</Label>
							<Label class="block">
								Relationship To Buddy
								<Input v-model="relationshipToBuddy" class="w-40 mt-2 p-2 border border-gray-300 rounded" placeholder="friend" />
							</Label>

							<Button @click="createDescription" class="mt-4 p-2 bg-blue-500 text-white rounded">Create</Button>
						</div>
						<p class="mt-4" v-if="createdDescription">
							Created Description:
							<br />
							<span class="text-lg ml-3">{{ createdDescription }}</span>
						</p>
						<Button v-if="createdDescription && !acceptedPersona" @click="acceptPersona('description')" class="mt-4 mr-2 p-2 bg-blue-500 text-white rounded">Accept Description</Button>
						<Button v-if="createdDescription && !acceptedPersona" @click="acceptPersona('keywords')" class="mt-4 p-2 bg-blue-500 text-white rounded">Use Keywords</Button>
					</CardContent>
				</Card>
				<Card v-else class="mt-4 p-2 w-full">
					<CardContent>
						<h2 class="text-lg mt-4 text-center underline">Your first Buddy</h2>
						<p class="mt-3 text-center">
							<span class="text-lg ml-3">{{ personaName }}</span>
						</p>
						<div class="flex flex-col items-center">
							<Avatar size="lg" class="mt-2">
								<AvatarImage v-if="profilePictureValue" :src="profilePictureValue" />
								<img v-else src="/assets/logo.png" alt="BuddyGen Logo" />
							</Avatar>
							<!-- TODO add extraPrompt input -->
							<Spinner v-if="updatingProfilePicture" class="mt-2" />
							<Button @click="refreshProfilePicture" class="mt-4 p-2 bg-blue-500 text-white rounded">New Profile Picture</Button>
						</div>
						<p class="mt-2"
							>Description:
							<span class="text-lg ml-3">{{ createdDescription }}</span>
						</p>
					</CardContent>
				</Card>

				<Button v-if="acceptedPersona && profilePictureValue" @click="handleSave" class="mt-4 p-2 bg-blue-500 text-white rounded">Save</Button>
				<Alert class="mt-4 p-2" variant="info">
					<AlertTitle>Tip</AlertTitle>
					<AlertDescription> You can create a Custom chat with no Buddy from the sidebar. </AlertDescription>
				</Alert>
			</CardContent>
		</Card>
	</div>
</template>

<style lang="scss"></style>
