<script setup lang="ts">
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
		name: 'zod',
		link: 'https://github.com/colinhacks/zod',
		author: 'Colin McDonnell',
		license: 'MIT',
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
			<h1 class="text-2xl font-bold">BuddyGen AI Credits</h1>

			<div class="mt-4">
				<p class="text-lg">BuddyGen AI was made using the following software:</p>
				<ul class="list-disc list-inside mt-2">
					<li v-for="dep in deps" :key="dep.name">
						<span @click="openLink(dep.link)" class="text-blue-500 cursor-pointer">
							{{ dep.name }}
						</span>
						by
						<b>{{ dep.author }}</b>
						{{ ' - ' }}
						<span
							v-for="license in dep.license.split(',')"
							:key="license"
							class="text-sm bg-gray-200 px-2 rounded-full ml-1"
						>
							{{ license }}&nbsp;license
						</span>
					</li>
				</ul>

				<p class="text-lg mt-4">
					<span
						class="text-blue-500 cursor-pointer"
						@click="openLink('https://github.com/parsehex/BuddyGenAI')"
					>
						BuddyGen AI
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
					<span class="text-sm bg-gray-200 px-2 rounded-full ml-1">
						AGPL-3.0 license
					</span>
				</p>
			</div>
		</div>
	</ScrollArea>
</template>

<style lang="scss"></style>
