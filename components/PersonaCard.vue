<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import type { Persona } from '~/server/database/knex.d';
import { getPersona } from '~/lib/api/persona';

const props = defineProps<{
	personaId: string;
}>();

const persona = ref({} as Persona);

onMounted(async () => {
	persona.value = await getPersona(props.personaId);
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
						<!-- TODO show created -->
						<CalendarDays class="mr-2 h-4 w-4 opacity-70" />
						<span class="text-xs text-muted-foreground"> Joined January 2014 </span>
					</div>
				</div>
			</div>
		</HoverCardContent>
	</HoverCard>
</template>
