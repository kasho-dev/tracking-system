<script setup lang="ts">

import Vite from "../assets/vite.svg";
import Vue from "../assets/vue.svg";

import { ref } from "vue";
import { Icon } from 'lucide-vue-next';
import { Download, Trash, Ellipsis } from 'lucide-vue-next';

const documents = ref([
  {
    id: 1,
    orderNumber: "Processing Order #1",
    trackingId: "223161262326264",
    handledBy: "Juan Dela Cruz",
    createdBy: "Juan Dela Cruz",
    dateCreated: "March 13, 2025, 09:00:30 AM",
  },
  {
    id: 2,
    orderNumber: "Processing Order #2",
    trackingId: "15345632789182",
    handledBy: "Coco Hardin",
    createdBy: "Coco Hardin",
    dateCreated: "March 13, 2025, 09:00:30 AM",
  },
  // Add more data as needed...
]);

</script>

<template>

  

<div class="p-6">
    <h1 class="text-2xl font-bold mb-4">ALL DOCUMENTS</h1>

    <!-- Action Buttons with Lucide Icons -->
    <div class="flex space-x-4 mb-4">
      <button class="p-2 bg-gray-100 rounded">
        <Download />
      </button>
      <button class="p-2 bg-gray-100 rounded">
        <Trash />
      </button>
      <button class="p-2 bg-gray-100 rounded">
        <Ellipsis />
      </button>
    </div>

    <!-- Data Table -->
    <div class="border rounded-lg shadow-sm overflow-hidden">
      <table class="w-full border-collapse">
        <thead class="bg-gray-100 text-left">
          <tr class="text-gray-600 text-sm">
            <th class="p-3"><input type="checkbox" class="w-4 h-4" /></th>
            <th class="p-3">Order #</th>
            <th class="p-3">Handled by</th>
            <th class="p-3">Created by</th>
            <th class="p-3">Date Created</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="doc in documents"
            :key="doc.id"
            class="border-b hover:bg-gray-50 text-sm"
          >
            <td class="p-3">
              <input type="checkbox" class="w-4 h-4" />
            </td>
            <td class="p-3">
              <a href="#" class="text-blue-600">{{ doc.orderNumber }}</a>
              <div class="text-xs text-gray-500">{{ doc.trackingId }}</div>
            </td>
            <td class="p-3 font-semibold">{{ doc.handledBy }}</td>
            <td class="p-3 font-semibold">{{ doc.createdBy }}</td>
            <td class="p-3">{{ doc.dateCreated }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</template>

<style scoped>

</style>