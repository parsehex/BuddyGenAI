import { defineConfig } from 'vite';
import Vue from '@vitejs/plugin-vue';
import VueRouter from 'unplugin-vue-router/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const isDev = process.env.NODE_ENV === 'development';
const isElectron = process.env.IS_ELECTRON === 'true';

export default defineConfig({
	// Electron is served via file:// so use relative base
	base: isElectron ? './' : '/',
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
		nodePolyfills(),
	],
	// https://stackoverflow.com/a/72095753
	resolve: {
		dedupe: ['vue'],
	},
	build: {
		sourcemap: isDev,
		outDir: './.output/public',
	},
});
