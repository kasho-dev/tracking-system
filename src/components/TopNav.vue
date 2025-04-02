<script setup lang="ts">
import { useSearchStore } from "/workspaces/tracking-system/src/stores/searchStore.ts";
import Toolbar from 'primevue/toolbar'
import PocketBase from 'pocketbase';
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Settings, LogOut } from 'lucide-vue-next';

const pb = new PocketBase('http://127.0.0.1:8090');
const searchStore = useSearchStore();
const router = useRouter();
const route = useRoute();

// Check if current route is login page
const isLoginPage = computed(() => route.path === '/login');

// Check authentication status
const isAuthenticated = computed(() => pb.authStore.isValid);

// Only show nav when authenticated AND not on login page
const showNav = computed(() => isAuthenticated.value && !isLoginPage.value);

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

        <!-- Search Input -->
        <div class="relative mt-3 group">
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
            class="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition cursor-pointer"
            @click="toggleDropdown"
          >
            <User class="w-5 h-5" />
          </div>

          <!-- Dropdown menu -->
          <div 
            v-if="isDropdownOpen"
            class="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
          >
            <a 
              href="#"
              @click.prevent="navigateToSettings"
              class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Settings class="w-4 h-4 mr-2" />
              Settings
            </a>
            <a 
              href="#"
              @click.prevent="handleLogout"
              class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut class="w-4 h-4 mr-2" />
              Logout
            </a>
          </div>
        </div>
      </div>
    </template>
  </Toolbar>
</template>