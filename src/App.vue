<script setup lang="ts">
import {ConfirmDialog,Toast} from "primevue";
import TopNav from "./components/TopNav.vue";
import { useRoute } from "vue-router";
import { ref, computed } from "vue";

const route = useRoute();
const selectedDoc = ref(null);

const openModal = (doc: any) => {
  selectedDoc.value = doc;
};

// Compute whether to show the TopNav based on the route
const showTopNav = computed(() => {
  return !route.path.includes('/forgot-password');
});
</script>

<template class="app-root">
  <Toast />
  <ConfirmDialog />
  <TopNav v-if="showTopNav" @openModal="openModal" />
  <RouterView :selectedDoc="selectedDoc" />
</template>

<style scoped>

</style>
