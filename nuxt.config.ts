// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
	typescript: {
		shim: false,
	},
	ssr: false,
	devtools: {
		enabled: true,
	},
	modules: [
		'@nuxtjs/tailwindcss',
		'@nuxtjs/color-mode',
		'shadcn-nuxt',
		'@pinia/nuxt',
	],
	shadcn: {
		/**
		 * Prefix for all the imported component
		 */
		prefix: '',
		/**
		 * Directory that the component lives in.
		 * @default "./components/ui"
		 */
		componentDir: './components/ui',
	},
	nitro: {
		preset: 'static',
	},
});
