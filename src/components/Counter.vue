<script setup lang="ts">
import {Button} from "primevue";
import { ref } from "vue";

const count = ref(0);

const increment = () => count.value++;
</script>

<template>
  <div class="card flex flex-col gap-4 m-auto">
    <h3 class="mx-auto text-xl font-bold">
      Counter
    </h3>
    <Button @click="increment">
      Clicked {{ count }} times
    </Button>
  </div>
</template>

<style scoped>

</style>
