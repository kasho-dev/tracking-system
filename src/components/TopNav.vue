<script setup lang="ts">
// import {useDark} from "@vueuse/core";
import { useSearchStore } from "/workspaces/tracking-system/src/stores/searchStore.ts";
import { Toolbar } from "primevue";

// import { Button} from "primevue";
// import { RouterLink } from "vue-router";
// import Vue from "../assets/vue.svg";

// const isDark = useDark({
//     valueDark: "app-light"
// });
// const toggle = () => isDark.value = !isDark.value;

const searchStore = useSearchStore();
</script>

<template>
  <Toolbar class="rounded-none border-x-0 border-t-0 bg-[#0A0E1A] text-white">
    <template #start>
      <div class="flex gap-6">
        <div class="flex gap-3">
          <div class="flex items-center gap-2 p-4">
            <!-- <img src="" alt="Marka Logo" class="w-8 h-8">  -->
            <h1 class="text-lg font-bold">MARKA</h1>
          </div>
        </div>
      </div>
    </template>
    <template #end>
      <!-- Search Input -->
      <div class="relative">
        <input
          v-model="searchStore.searchQuery"
          type="text"
          placeholder="Search..."
          class="bg-gray-100 text-black px-4 py-2 rounded-lg w-64 focus:outline-none pr-10"
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
    </template>
  </Toolbar>
</template>

<style scoped></style>
