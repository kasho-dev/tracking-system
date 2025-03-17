<script setup lang="ts">
import {ConfirmDialog,Toast} from "primevue";
import TopNav from "./components/TopNav.vue";
</script>

<template class="app-root">
  <Toast />
  <ConfirmDialog />
  <TopNav />
  <RouterView />
</template>

<style scoped>

</style>
