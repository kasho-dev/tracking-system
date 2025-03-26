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