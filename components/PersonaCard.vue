<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import type { Persona } from '~/server/database/types';
import { getPersona } from '~/lib/api/persona';
import { formatDistanceToNow, format } from 'date-fns';

const props = defineProps<{
	personaId: string;
}>();

const persona = ref({} as Persona);

const time_label = ref('Created' as 'Created' | 'Updated');
const time_at = ref('');

onBeforeMount(async () => {
	persona.value = (await getPersona(props.personaId)).value;
	if (persona.value.updated) {
		time_label.value = 'Updated';
		time_at.value = formatDistanceToNow(new Date(persona.value.updated), { addSuffix: true });
	} else {
		time_label.value = 'Created';
		time_at.value = formatDistanceToNow(new Date(persona.value.created), { addSuffix: true });
	}
});
</script>

<template>
	<HoverCard>
		<HoverCardTrigger as-child>
			<div class="flex items-center bg-primary-foreground p-2 rounded-lg">
				<Avatar>
					<!-- TODO -->
					<AvatarImage src="https://github.com/vuejs.png" />
					<AvatarFallback>VC</AvatarFallback>
				</Avatar>
				<Button variant="link" size="lg">{{ persona.name }}</Button>
			</div>
		</HoverCardTrigger>
		<HoverCardContent class="w-80">
			<div class="flex justify-between space-x-4">
				<Avatar>
					<!-- TODO -->
					<AvatarImage src="https://github.com/vuejs.png" />
					<AvatarFallback>VC</AvatarFallback>
				</Avatar>
				<div class="space-y-1">
					<div class="flex justify-around">
						<NuxtLink :to="`/persona/${persona.id}/edit`">Edit</NuxtLink>
						<NuxtLink :to="`/persona/${persona.id}/view`">View</NuxtLink>
					</div>
					<p class="text-sm">{{ persona.description }}</p>
					<div class="flex items-center pt-2">
						<span class="text-xs text-muted-foreground"> {{ time_label }} {{ time_at }} </span>
					</div>
				</div>
			</div>
		</HoverCardContent>
	</HoverCard>
</template>
