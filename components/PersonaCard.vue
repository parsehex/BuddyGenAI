<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import type { Persona } from '~/server/database/knex.d';
import { getPersona } from '~/lib/api/persona';
import { formatDistanceToNow, format } from 'date-fns';

const props = defineProps<{
	personaId: string;
}>();

const persona = ref({} as Persona);

const time_label = ref('Created' as 'Created' | 'Updated');
const time_at = ref('');

onMounted(async () => {
	persona.value = await getPersona(props.personaId);
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
			<Button variant="link" size="lg">{{ persona.name }}</Button>
		</HoverCardTrigger>
		<HoverCardContent class="w-80">
			<div class="flex justify-between space-x-4">
				<Avatar>
					<!-- TODO -->
					<AvatarImage src="https://github.com/vuejs.png" />
					<AvatarFallback>VC</AvatarFallback>
				</Avatar>
				<div class="space-y-1">
					<h4 class="text-sm font-semibold">{{ persona.name }}</h4>
					<p class="text-sm">{{ persona.description }}</p>
					<div class="flex items-center pt-2">
						<span class="text-xs text-muted-foreground"> {{ time_label }} {{ time_at }} </span>
					</div>
				</div>
			</div>
		</HoverCardContent>
	</HoverCard>
</template>
