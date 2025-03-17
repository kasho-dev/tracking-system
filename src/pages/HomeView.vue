<script setup lang="ts">

import Vite from "../assets/vite.svg";
import Vue from "../assets/vue.svg";

</script>

<template>
  <div class="card flex flex-col gap-4 m-auto">
    <div class="flex gap-4 mx-auto">
      <img
        :src="Vite"
        alt=""
        class="h-14"
      >
      <p class="my-auto text-2xl font-bold">
        +
      </p>
      <img
        :src="Vue"
        alt=""
        class="h-14"
      >
    </div>
    <h3 class="text-xl font-bold">
      Welcome to Vite + Vue
    </h3>
  </div>
</template>

<style scoped>

</style>