// vite.config.ts
import { defineConfig } from 'vite';
import Vue from '@vitejs/plugin-vue';
import VueRouter from 'unplugin-vue-router/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
	css: {
		postcss: {
			plugins: [tailwind(), autoprefixer()],
		},
	},
	plugins: [
		VueRouter({
			/* options */
		}),
		// ⚠️ Vue must be placed after VueRouter()
		Vue(),
		tsconfigPaths(),
	],
	// https://stackoverflow.com/a/72095753
	resolve: {
		dedupe: ['vue'],
	},
	build: {
		sourcemap: true,
	},
});
