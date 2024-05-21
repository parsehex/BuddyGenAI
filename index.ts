import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './app.vue';
import router from '@/lib/router';

const appDiv = document.getElementById('app');

if (!appDiv) {
	throw new Error('Could not find #app element');
}
console.log('appDiv', appDiv, App);

const pinia = createPinia();

const app = createApp(App);
app.use(pinia);
app.use(router);

app.mount(appDiv);
