import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import PrimVue from "primevue/config";
import router from "./router.ts";
import {ConfirmationService, ToastService} from "primevue";
import {createPinia} from "pinia";

const pinia = createPinia();
const app = createApp(App);

app.use(PrimVue, {
    theme: 'none'
});

app.use(pinia);
app.use(router);
app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
