import { createWebHistory, createRouter } from "vue-router";

import HomeViewView from "./pages/HomeView.vue";
import CounterViewView from "./pages/CounterView.vue";
import LoginView from "./pages/LoginView.vue"


const routes = [
    { path: "/", component: HomeViewView },
    { path: "/counter", component: CounterViewView },
    { path: '/login', component: LoginView 
      }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;