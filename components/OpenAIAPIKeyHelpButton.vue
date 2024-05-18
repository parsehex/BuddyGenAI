<script setup lang="ts">
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CircleHelp } from 'lucide-vue-next';

const { openExternalLink } = useElectron();
</script>

<template>
	<Popover>
		<PopoverTrigger as-child>
			<Button variant="default" title="How to get an API key?" size="sm">
				<CircleHelp class="w-4 h-4" />
			</Button>
		</PopoverTrigger>
		<PopoverContent class="w-80">
			<div class="grid gap-4">
				<div class="space-y-2">
					<h4 class="font-medium leading-none">How to get an OpenAI API key?</h4>
					<p class="text-sm text-muted-foreground">
						<span
							class="text-blue-400 cursor-pointer underline"
							@click="
								openExternalLink &&
									openExternalLink('https://platform.openai.com/signup')
							"
						>
							{{ 'Sign Up' }}
						</span>
						or
						<span
							class="text-blue-400 cursor-pointer underline"
							@click="
								openExternalLink &&
									openExternalLink('https://platform.openai.com/login')
							"
						>
							{{ 'Sign In' }}
						</span>
						to your OpenAI account
					</p>
					<p class="text-sm text-muted-foreground">
						Next, go to the
						<span
							class="text-blue-400 cursor-pointer underline"
							@click="
								openExternalLink &&
									openExternalLink('https://platform.openai.com/account/api-keys')
							"
						>
							{{ 'API keys' }}
						</span>
						page and click
						<b>Create new secret key</b>
						(set a name like "BuddyGenAI" if you'd like).
					</p>
					<p class="text-sm text-muted-foreground">
						Finally, copy the key and paste it into the box below.
					</p>
				</div>
			</div>
		</PopoverContent>
	</Popover>
</template>
