<script setup lang="ts">

import {useDark} from "@vueuse/core";
import {Button,Toolbar} from "primevue";
import {RouterLink} from "vue-router";
import Vue from "../assets/vue.svg";

const isDark = useDark({
    valueDark: "app-dark"
});

const toggle = () => isDark.value = !isDark.value;
</script>

<template>
  <Toolbar class="rounded-none border-x-0 border-t-0">
    <template #start>
      <div class="flex gap-6">
        <div class="flex gap-3">
          <img
            :src="Vue"
            alt=""
            class="h-6"
          >
          <h2 class="text-md opacity-80">
            MinimalVue Template
          </h2>
        </div>
        <div class="flex gap-3">
          <RouterLink
            active-class="p-button-text"
            to="/"
          >
            Home
          </RouterLink>
          <RouterLink
            active-class="p-button-text"
            to="/counter"
          >
            Counter
          </RouterLink>
        </div>
      </div>
    </template>
    <template #end>
      <Button
        class="p-2 flex"
        @click="toggle"
        variant="text"
        severity="secondary"
      >
        <template v-if="isDark">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-sun"
          ><circle
            cx="12"
            cy="12"
            r="4"
          /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
        </template>
        <template v-else>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-moon"
          ><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
        </template>
      </Button>
    </template>
  </Toolbar>
</template>

<style scoped>

</style>