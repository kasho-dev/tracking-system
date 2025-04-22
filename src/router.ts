import { createWebHistory, createRouter } from "vue-router";

import HomeViewView from "./pages/HomeView.vue";
import CounterViewView from "./pages/CounterView.vue";
import LoginView from "./pages/LoginView.vue";
import SettingsView from "./pages/SettingsView.vue";
import SignupView from "./pages/SignupView.vue";


const routes = [
    { path: "/", component: HomeViewView },
    { path: "/counter", component: CounterViewView },
    { path: '/login', component: LoginView },
    { path: '/signup', component: SignupView },
    { path: '/settings', component: SettingsView }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;