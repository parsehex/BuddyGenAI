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

// TODO overhaul refreshing profile picture
// basically, allow the user to refresh the pic, but don't update until they save (+ do versioning on pics)
// how it'll actually work:
// page stays like it is until user clicks Refresh, at which point:
// show new elements showing the old avatar and the newly generated one which will get saved onSave
// (possibly have a generation history viewer)
// we can clean up pics that werent used

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
		<Card class="whitespace-pre-wrap w-full md:w-1/2 p-2 pt-6">
			<CardContent>
				<div class="flex flex-col items-center">
					<Input v-model="nameValue" placeholder="Persona name" size="lg" />
					<Avatar v-if="profilePictureValue && profilePictureValue.length > 9" size="lg">
						<AvatarImage :src="profilePictureValue" />
						<AvatarFallback>VC</AvatarFallback>
					</Avatar>
					<div class="flex flex-col items-center justify-center">
						<Button type="button" @click="refreshProfilePicture">
							{{ profilePictureValue ? 'Refresh' : 'Create' }}
						</Button>
						<Spinner :style="{ visibility: updatingProfilePicture ? 'visible' : 'hidden' }" />
					</div>
				</div>
				<div class="flex flex-col items-center space-y-4">
					<label class="text-lg w-full text-center">
						Description
						<Textarea v-model="descriptionValue" :placeholder="`${persona?.name} is...`" />
					</label>
					<Button @click="handleSave">Save</Button>
				</div>
			</CardContent>
		</Card>
	</div>
</template>

<style>
/*  */
</style>
