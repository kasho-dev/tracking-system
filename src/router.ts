import { createWebHistory, createRouter } from "vue-router";
import PocketBase from "pocketbase";

import HomeViewView from "./pages/HomeView.vue";
import LoginView from "./pages/LoginView.vue";
import SettingsView from "./pages/SettingsView.vue";
import SignupView from "./pages/SignupView.vue";
import ForgotPasswordView from "./pages/ForgotPasswordView.vue";

const pb = new PocketBase('http://127.0.0.1:8090');

const routes = [
    { path: "/", redirect: "/login" },
    { 
        path: "/home", 
        component: HomeViewView, 
        meta: { requiresAuth: true } 
    },
    { path: '/login', component: LoginView },
    { path: '/signup', component: SignupView },
    { path: '/forgot-password', component: ForgotPasswordView },
    { 
        path: '/settings', 
        component: SettingsView, 
        meta: { requiresAuth: true } 
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
    // Check if the route requires authentication
    if (to.matched.some(record => record.meta.requiresAuth)) {
        // Check if user is authenticated
        if (!pb.authStore.isValid) {
            // Redirect to login page if not authenticated
            next({ path: '/login' });
        } else {
            // Proceed to the route if authenticated
            next();
        }
    } else {
        // Always allow access to public routes
        next();
    }
});

export default router;