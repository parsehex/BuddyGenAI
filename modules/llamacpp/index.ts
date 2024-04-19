import { createResolver, defineNuxtModule, addServerHandler } from 'nuxt/kit';

export default defineNuxtModule({
	meta: {
		name: 'llama.cpp-server',
	},
	setup() {
		const { resolve } = createResolver(import.meta.url);

		const addRoute = (name: string) => {
			addServerHandler({
				route: `/api/llama.cpp/${name}`,
				handler: resolve(`./runtime/${name}`),
			});
		};

		addRoute('start');
		addRoute('stop');
		addRoute('status');
		// TODO interrupt?
	},
});
