import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'buddyGenAI Docs',
	description: '',
	themeConfig: {
		logo: '/logo.png',

		// https://vitepress.dev/reference/default-theme-config
		nav: [{ text: 'Home', link: '/' }],

		// sidebar: [
		// 	{
		// 		text: 'Examples',
		// 		items: [
		// 			{ text: 'Markdown Examples', link: '/markdown-examples' },
		// 		],
		// 	},
		// ],

		socialLinks: [
			{ icon: 'github', link: 'https://github.com/parsehex/buddyGenAI' },
		],
	},
});
