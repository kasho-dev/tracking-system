<script setup lang="ts">
import { ref } from 'vue';
import { ConfirmDialog, Toast } from "primevue";
import TopNav from "./components/TopNav.vue";

const showNav = ref(true);

// Event handlers for navigation visibility
const hideNav = () => {
  showNav.value = false;
};

const showNavigation = () => {
  showNav.value = true;
};
</script>

<template class="app-root">
  <Toast />
  <ConfirmDialog />
  <TopNav v-if="showNav" />
  <RouterView @hide-nav="hideNav" @show-nav="showNavigation" />
</template>

<style scoped>

</style>
