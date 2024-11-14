import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/lib/router';
import App from './settings.vue';

const appDiv = document.getElementById('app');

if (!appDiv) {
	throw new Error('Could not find #app element');
}

const pinia = createPinia();

const app = createApp(App);
app.use(pinia);
app.use(router);

app.mount(appDiv);
