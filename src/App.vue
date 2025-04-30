<script setup lang="ts">
import {ConfirmDialog,Toast} from "primevue";
import TopNav from "./components/TopNav.vue";
import { useRoute } from "vue-router";
import { ref } from "vue";

const route = useRoute();
const selectedDoc = ref(null);

const openModal = (doc: any) => {
  selectedDoc.value = doc;
};
</script>

<template class="app-root">
  <Toast />
  <ConfirmDialog />
  <TopNav @openModal="openModal" />
  <RouterView :selectedDoc="selectedDoc" />
</template>

<style scoped>

</style>
