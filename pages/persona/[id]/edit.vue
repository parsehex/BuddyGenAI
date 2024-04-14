<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { getPersona, updatePersona } from '~/lib/api/persona';
import type { Persona, PersonaVersionMerged } from '~/server/database/types';
import Spinner from '~/components/Spinner.vue';

const route = useRoute();
const id = route.params.id as string;

const persona = ref(null as PersonaVersionMerged | null);

const nameValue = ref('');
const descriptionValue = ref('');
const profilePictureValue = ref('');

const updatingProfilePicture = ref(false);

const ppIsOpen = ref(false);

onBeforeMount(async () => {
	persona.value = (await getPersona(id)).value;
	nameValue.value = persona.value?.name ?? '';
	descriptionValue.value = persona.value?.description ?? '';
	if (persona.value?.profile_pic) {
		profilePictureValue.value = `/api/profile-pic?persona_id=${persona.value.id}`;
	}
});

const handleSave = async () => {
	await $fetch(`/api/persona`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			id,
			name: nameValue.value,
			description: descriptionValue.value,
		}),
	});
	await navigateTo(`./view`);
};

const refreshProfilePicture = async () => {
	updatingProfilePicture.value = true;
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
</script>

<template>
	<div class="container flex flex-col items-center">
		<h1 class="text-2xl font-bold"> Edit Persona </h1>
		<div>
			<NuxtLink class="ml-4" :to="`/persona/${id}/view`">View</NuxtLink>
			<NuxtLink class="ml-4" :to="`/persona/${id}/history`">Version History</NuxtLink>
		</div>
		<Collapsible class="my-2" v-model:open="ppIsOpen" :defaultOpen="false">
			<CollapsibleTrigger>
				<Button type="button" size="sm">{{ ppIsOpen ? 'Hide' : 'Show' }} Profile Picture</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<Card class="whitespace-pre-wrap">
					<CardContent>
						<div>
							<img v-if="profilePictureValue" :src="profilePictureValue" alt="Profile Picture" class="w-1/2 mx-auto" />
							<div class="flex items-center justify-center">
								<Button type="button" @click="refreshProfilePicture">
									{{ profilePictureValue ? 'Refresh' : 'Create' }}
								</Button>
								<Spinner v-if="updatingProfilePicture" />
							</div>
						</div>
					</CardContent>
				</Card>
			</CollapsibleContent>
		</Collapsible>
		<div class="w-full md:w-1/2 mb-4">
			<Input v-model="nameValue" placeholder="Persona name" />
		</div>
		<Card class="w-full md:w-1/2">
			<CardHeader class="text-lg">Description</CardHeader>
			<CardContent>
				<Textarea v-model="descriptionValue" placeholder="Persona description" />
			</CardContent>
		</Card>
		<!-- TODO add option whether to update all threads with this persona -->
		<Button @click="handleSave">Save</Button>
	</div>
</template>

<style>
#electron-status {
	position: absolute;
	font-size: 2rem;
	font: bold;
}
</style>
