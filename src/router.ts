// router.ts
import { createRouter, createWebHistory } from 'vue-router';
import PocketBase from 'pocketbase'; // Add this import
import HomeView from './pages/HomeView.vue';
import Login from './pages/Login.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/home',
      name: 'Home',
      component: HomeView,
      meta: { requiresAuth: true }
    }
  ]
});

router.beforeEach((to, from, next) => {
  // Initialize PocketBase inside the guard
  const pb = new PocketBase('http://127.0.0.1:8090');
  
  if (to.meta.requiresAuth && !pb.authStore.isValid) {
    next('/login');
  } else {
    next();
  }
});

export default router;