<script setup lang="ts">
import { useSearchStore } from "../stores/searchStore";
import { Toolbar } from "primevue";
import PocketBase from 'pocketbase';
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Settings, LogOut, LayoutDashboard } from 'lucide-vue-next';

const pb = new PocketBase('http://127.0.0.1:8090');
const searchStore = useSearchStore();
const router = useRouter();
const route = useRoute();

// User avatar URL
const userAvatarUrl = computed(() => {
  if (pb.authStore.model?.avatar) {
    return pb.files.getUrl(pb.authStore.model, pb.authStore.model.avatar);
  }
  return null;
});

// Check if current route is login page
const isLoginPage = computed(() => route.path === '/login');

// Check if current route is signup page
const isSignupPage = computed(() => route.path === '/signup');

// Check if current route is settings page
const isSettingsPage = computed(() => route.path === '/settings');

// Check if current route is dashboard/home page
const isDashboardPage = computed(() => route.path === '/');

// Check authentication status
const isAuthenticated = computed(() => pb.authStore.isValid);

// Only show nav when authenticated AND not on login or signup pages
const showNav = computed(() => isAuthenticated.value && !isLoginPage.value && !isSignupPage.value);

// Only show search when not on settings page
const showSearch = computed(() => !isSettingsPage.value);

// User dropdown state
const isDropdownOpen = ref(false);
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

// Close dropdown when clicking outside
const closeDropdown = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.user-icon')) {
    isDropdownOpen.value = false;
  }
};

// Handle logout
const handleLogout = async () => {
  try {
    pb.authStore.clear();
    isDropdownOpen.value = false;
    router.push('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

// Handle navigation to dashboard/home
const navigateToDashboard = () => {
  router.push('/');
  isDropdownOpen.value = false;
};

// Handle settings navigation
const navigateToSettings = () => {
  router.push('/settings');
  isDropdownOpen.value = false;
};

// Add click outside listener
onMounted(() => {
  document.addEventListener('click', closeDropdown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown);
});
</script>

<template>
  <Toolbar
    v-if="showNav"
    class="rounded-none border-x-0 border-t-0 border-b-0 bg-[#0A0E1A] text-white"
  >
    <template #start>
      <div class="flex gap-6">
        <div class="flex gap-3">
          <div class="flex items-center gap-2 p-4 pb-1">
            <h1 class="text-lg font-bold">MARKA</h1>
          </div>
        </div>
      </div>
    </template>
    <template #end>
      <div class="flex items-center gap-4">
        <!-- Welcome text -->
        <div class="text-white font-bold text-lg font-size-150px pt-4">
          Welcome, {{ pb.authStore.model?.name || 'User' }}!
        </div>

        <!-- Search Input - Hidden on settings page -->
        <div v-if="showSearch" class="relative mt-3 group">
          <input
            v-model="searchStore.searchQuery"
            type="text"
            placeholder="Search..."
            class="bg-gray-100 text-black px-3 py-2 rounded-lg w-64 focus:outline-none pr-10 placeholder:opacity-100 placeholder:transition-all placeholder:duration-300 group-hover:placeholder:opacity-100 group-hover:placeholder:translate-x-2"
          />
          <span class="absolute right-3 top-2 text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
        </div>

        <!-- User icon with dropdown -->
        <div class="relative user-icon">
          <div 
            class="cursor-pointer"
            @click="toggleDropdown"
          >
            <!-- Show profile image if available, otherwise show User icon -->
            <div v-if="userAvatarUrl" class="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-white transition">
              <img :src="userAvatarUrl" alt="Profile" class="w-full h-full object-cover" />
            </div>
            <div v-else class="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition">
              <User class="w-5 h-5" />
            </div>
          </div>

          <!-- Dropdown menu -->
          <transition 
            name="dropdown"
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <div 
              v-if="isDropdownOpen"
              class="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
            >
              <a 
                href="#"
                @click.prevent="navigateToDashboard"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                :class="{ 'bg-gray-50': isDashboardPage }"
              >
                <LayoutDashboard class="w-4 h-4 mr-2" />
                Dashboard
              </a>
              <a 
                href="#"
                @click.prevent="navigateToSettings"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                :class="{ 'bg-gray-50': isSettingsPage }"
              >
                <Settings class="w-4 h-4 mr-2" />
                Settings
              </a>
              <div class="border-t border-gray-100 my-1"></div>
              <a 
                href="#"
                @click.prevent="handleLogout"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut class="w-4 h-4 mr-2" />
                Logout
              </a>
            </div>
          </transition>
        </div>
      </div>
    </template>
  </Toolbar>
</template>