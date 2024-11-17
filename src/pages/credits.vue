<script setup lang="ts">
import { ScrollArea } from '@/components/ui/scroll-area';
import useElectron from '@/composables/useElectron';
const { openExternalLink } = useElectron();

const deps = [
	{
		name: '(Vercel) ai',
		link: 'https://sdk.vercel.ai/docs/introduction',
		author: 'Vercel, Inc.',
		license: 'Apache-2.0',
	},
	{
		name: 'axios',
		link: 'https://axios-http.com',
		author: 'Matt Zabriskie & Collaborators',
		license: 'MIT',
	},
	{
		name: 'better-sqlite3',
		link: 'https://github.com/WiseLibs/better-sqlite3',
		author: 'Joshua Wise',
		license: 'MIT',
	},
	{
		name: 'class-variance-authority',
		link: 'https://github.com/joe-bell/cva#readme',
		author: 'Joe Bell',
		license: 'Apache-2.0',
	},
	{
		name: 'clsx',
		link: 'https://github.com/lukeed/clsx#readme',
		author: 'Luke Edwards',
		license: 'MIT',
	},
	{
		name: 'concurrently',
		link: 'https://github.com/open-cli-tools/concurrently#readme',
		author: 'Kimmo Brunfeldt',
		license: 'MIT',
	},
	{
		name: 'cors',
		link: 'https://github.com/expressjs/cors#readme',
		author: 'Troy Goode',
		license: 'MIT',
	},
	{
		name: 'date-fns',
		link: 'https://github.com/date-fns/date-fns#readme',
		author: 'Sasha Koss and Lesha Koss',
		license: 'MIT',
	},
	{
		name: 'electron',
		link: 'https://github.com/electron/electron#readme',
		author: 'Electron contributors, GitHub Inc.',
		license: 'MIT',
	},
	{
		name: 'electron-builder',
		link: 'https://github.com/electron-userland/electron-builder',
		author: 'Loopline Systems',
		license: 'MIT',
	},
	{
		name: 'electron-log',
		link: 'https://github.com/megahertz/electron-log#readme',
		author: 'Alexey Prokhorov',
		license: 'MIT',
	},
	{
		name: 'electron-nuxt3',
		link: 'https://github.com/EternalC0der/electron-nuxt3',
		author: 'EternalC0der',
		license: 'Unknown',
		note: 'BuddyGenAI is a fork of electron-nuxt3',
	},
	{
		name: 'electron-updater',
		link: 'https://github.com/electron-userland/electron-builder',
		author: 'Loopline Systems',
		license: 'MIT',
	},
	{
		name: 'eslint',
		link: 'https://eslint.org',
		author: 'OpenJS Foundation and other contributors',
		license: 'MIT',
	},
	{
		name: 'eslint-config-prettier',
		link: 'https://github.com/prettier/eslint-config-prettier#readme',
		author: 'Simon Lydell and contributors',
		license: 'MIT',
	},
	{
		name: 'eslint-plugin-prettier',
		link: 'https://github.com/prettier/eslint-plugin-prettier#readme',
		author: 'Andres Suarez and Teddy Katz',
		license: 'MIT',
	},
	{
		name: 'express',
		link: 'https://github.com/expressjs/express',
		author: 'TJ Holowaychuk, Roman Shtylman, Douglas Christopher Wilson',
		license: 'MIT',
	},
	{
		name: 'fs-extra',
		link: 'https://github.com/jprichardson/node-fs-extra',
		author: 'JP Richardson',
		license: 'MIT',
	},
	{
		name: 'llama.cpp',
		link: 'https://github.com/ggerganov/llama.cpp',
		author: 'The ggml authors',
		license: 'MIT',
		licenseLink: 'https://github.com/ggerganov/llama.cpp/blob/master/LICENSE',
	},
	{
		name: 'lucide-vue-next',
		link: 'https://lucide.dev',
		author: 'Lucide Contributors, Cole Bemis',
		license: 'ISC, MIT',
	},
	{
		name: 'nuxt',
		link: 'https://nuxt.com',
		author: 'Nuxt Team',
		license: 'MIT',
	},
	{
		name: '@nuxtjs/eslint-config-typescript',
		link: 'https://github.com/nuxt/eslint#readme',
		author: 'Nuxt Project',
		license: 'MIT',
	},
	{
		name: '@nuxtjs/color-mode',
		link: 'https://github.com/nuxt-modules/color-mode',
		author: 'Nuxt Team',
		license: 'MIT',
	},
	{
		name: '@nuxtjs/i18n',
		link: 'https://github.com/nuxt-modules/i18n',
		author:
			'Nuxt Community, Rafał Chłodnicki, Paul Gascou-Vaillancourt, Kazuya Kawaguchi',
		license: 'MIT',
	},
	{
		name: '@nuxtjs/tailwindcss',
		link: 'https://github.com/nuxt-modules/tailwindcss#readme',
		author: 'Nuxt Community',
		license: 'MIT',
	},
	{
		name: 'openai-node',
		link: 'https://github.com/openai/openai-node',
		author: 'OpenAI',
		license: 'Apache-2.0',
	},
	{
		name: '@pinia/nuxt',
		link: 'https://github.com/vuejs/pinia/tree/v2/packages/nuxt#readme',
		author: 'Eduardo San Martin Morote',
		license: 'MIT',
	},
	{
		name: 'Piper TTS',
		link: 'https://github.com/rhasspy/piper',
		author: 'Michael Hansen',
		license: 'MIT',
		licenseLink: 'https://github.com/rhasspy/piper/blob/master/LICENSE.md',
	},
	{
		name: 'prettier',
		link: 'https://github.com/prettier/prettier',
		author: 'James Long and contributors',
		license: 'MIT',
	},
	{
		name: 'radix-vue',
		link: 'https://github.com/radix-vue/radix-vue',
		author: 'radix-vue',
		license: 'MIT',
	},
	{
		name: 'dart-sass',
		link: 'https://github.com/sass/dart-sass',
		author: 'Google Inc.',
		license: 'MIT',
	},
	{
		name: 'sass-loader',
		link: 'https://github.com/webpack-contrib/sass-loader',
		author: 'JS Foundation and other contributors',
		license: 'MIT',
	},
	{
		name: 'shadcn-nuxt',
		link: 'https://github.com/radix-vue/shadcn-vue#readme',
		author: 'radix-vue',
		license: 'MIT',
	},
	{
		name: 'shadcn-vue',
		link: 'https://github.com/radix-vue/shadcn-vue#readme',
		author: 'radix-vue',
		license: 'MIT',
	},
	{
		name: 'stable-diffusion.cpp',
		link: 'https://github.com/leejet/stable-diffusion.cpp',
		author: 'leejet',
		license: 'MIT',
		licenseLink:
			'https://github.com/leejet/stable-diffusion.cpp/blob/master/LICENSE',
	},
	{
		name: 'tailwindcss',
		link: 'https://github.com/tailwindlabs/tailwindcss',
		author: 'Tailwind Labs, Inc.',
		license: 'MIT',
	},
	{
		name: 'tailwind-merge',
		link: 'https://github.com/dcastil/tailwind-merge',
		author: 'Dany Castillo',
		license: 'MIT',
	},
	{
		name: 'tailwindcss-animate',
		link: 'https://github.com/jamiebuilds/tailwindcss-animate',
		author: 'Jamie Kyle',
		license: 'MIT',
	},
	{
		name: 'tsc-watch',
		link: 'https://github.com/gilamran/tsc-watch#readme',
		author: 'Gil Amran',
		license: 'MIT',
	},
	{
		name: 'typescript',
		link: 'https://github.com/microsoft/TypeScript/#readme',
		author: 'Microsoft Corporation, TypeScript contributors',
		license: 'Apache-2.0',
	},
	{
		name: 'uuid',
		link: 'https://github.com/uuidjs/uuid#readme',
		author: 'Robert Kieffer and other contributors',
		license: 'MIT',
	},
	{
		name: '@vueuse/core',
		link: 'https://github.com/vueuse/vueuse#readme',
		author: 'Anthony Fu',
		license: 'MIT',
	},
	{
		name: 'wait-on',
		link: 'https://github.com/jeffbski/wait-on#readme',
		author: 'Jeff Barczewski',
		license: 'MIT',
	},
	{
		name: 'whisper.cpp',
		link: 'https://github.com/ggerganov/whisper.cpp',
		author: 'The ggml authors',
		license: 'MIT',
		licenseLink: 'https://github.com/ggerganov/whisper.cpp/blob/master/LICENSE',
	},
	{
		name: 'zod',
		link: 'https://github.com/colinhacks/zod',
		author: 'Colin McDonnell',
		license: 'MIT',
	},
];

const aiModels = [
	{
		name: 'Distil-Whisper',
		link:
			'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/hfc_female/medium',
		author: 'Distil-Whisper',
		license: 'MIT',
		licenseLink:
			'https://huggingface.co/datasets/choosealicense/licenses/blob/main/markdown/mit.md',
	},
	{
		name: '(TTS Voice) hfc_female_medium',
		link:
			'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/hfc_female/medium',
		author: 'Michael Henson',
		license: 'CC BY-NC-SA 4.0 DEED',
		licenseLink: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en',
	},
	{
		name: '(TTS Voice) hfc_male_medium',
		link:
			'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/hfc_male/medium',
		author: 'Michael Henson',
		license: 'CC BY-NC-SA 4.0 DEED',
		licenseLink: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en',
	},
	{
		name: 'Llama 3',
		link: 'https://llama.meta.com/llama3/',
		author: 'Meta Platforms, Inc.',
		license: 'llama-3',
		licenseLink: 'https://llama.meta.com/llama3/license',
	},
	{
		name: 'Toonify Remastered',
		link: 'https://civitai.com/models/36281?modelVersionId=244831',
		author: 'Robin Rombach and Patrick Esser and contributors',
		license: 'CreativeML Open RAIL-M',
		licenseLink: 'https://civitai.com/models/license/244831',
	},
];

const openLink = (link: string) => {
	if (!openExternalLink)
		return console.error('openExternalLink is not available');
	openExternalLink(link);
};
</script>

<template>
	<ScrollArea class="h-screen">
		<div class="container flex flex-col items-center pb-8">
			<h1 class="text-2xl font-bold">BuddyGenAI Credits</h1>

			<div class="mt-4">
				<p class="text-md mt-2">
					BuddyGenAI was made using the following software projects and AI models:
				</p>
				<ul class="list-disc list-inside mt-2">
					<li v-for="dep in deps" :key="dep.name">
						<span @click="openLink(dep.link)" class="text-blue-500 cursor-pointer">
							{{ dep.name }}
						</span>
						by
						<b>{{ dep.author }}</b>
						<span
							v-for="license in dep.license.split(',')"
							@click="dep.licenseLink && openLink(dep.licenseLink)"
							:key="license"
							:class="
								'text-sm px-2 rounded-full ml-2 bg-gray-200 dark:bg-gray-800' +
								(dep.licenseLink ? ' cursor-pointer' : '')
							"
						>
							{{ license }}&nbsp;license</span
						>
						<span v-if="dep.note">
							{{ ' - ' + dep.note }}
						</span>
					</li>
				</ul>

				<p class="text-lg mt-4">
					<span
						class="text-blue-500 cursor-pointer"
						@click="openLink('https://github.com/parsehex/BuddyGenAI')"
					>
						BuddyGenAI
					</span>
					is a project by
					<b>Thomas Mays</b>
					(
					<span
						class="text-blue-500 cursor-pointer"
						@click="openLink('https://github.com/parsehex')"
					>
						parsehex
					</span>
					)
					<span
						class="text-sm px-2 rounded-full ml-1 bg-gray-200 dark:bg-gray-800"
						@click="
							openLink('https://github.com/parsehex/BuddyGenAI/blob/main/LICENSE')
						"
					>
						MIT license
					</span>
				</p>
				<p class="text-lg mt-2">
					<span
						class="text-blue-500 underline cursor-pointer"
						@click="openLink('https://buddygenai.com')"
					>
						BuddyGenAI.com
					</span>
				</p>
			</div>
		</div>
	</ScrollArea>
</template>

<style lang="scss"></style>
