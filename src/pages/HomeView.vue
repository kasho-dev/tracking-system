<script setup lang="ts">

import Vite from "../assets/vite.svg";
import Vue from "../assets/vue.svg";
import Button from 'primevue/button';
import { ref } from "vue";
import { Check, Clock, User, File, TriangleAlert, Download, Trash, Ellipsis, Icon } from 'lucide-vue-next';

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

<body class="bg-[#0A0E1A] flex h-screen p-4">
<div class="w-64 bg-[#0A0E1A] text-white">

  <button class="w-full flex items-center justify-center gap-2 bg-[#6A5CFE] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#7C6CFF] transition">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13.234 20.252 21 12.3"/>
        <path d="m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486"/>
    </svg>
    Add PO Number
</button>
<!--test-->

  <div class="mt-4 space-y-2">
            <!-- Completed -->
            <div class="flex items-center justify-between bg-[#2E3347] text-green-400 font-semibold px-4 py-3 rounded-lg">
                <span class="flex items-center gap-2">
                    <Check />
                    Completed
                </span>
                <span class="text-white">0</span>
            </div>

            <!-- Pending -->
            <div class="flex items-center justify-between text-purple-400 px-4 py-3 hover:bg-[#2E3347] rounded-lg cursor-pointer">
                <span class="flex items-center gap-2">
                    <Clock />
                    Pending
                </span>
                <span class="text-white">0</span>
            </div>

            <!-- Lapsed -->
            <div class="flex items-center justify-between text-yellow-400 px-4 py-3 hover:bg-[#2E3347] rounded-lg cursor-pointer">
                <span class="flex items-center gap-2">
                    <TriangleAlert /><span class="relative">
                        <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">!</span>
                    </span>Lapsed
                </span>
                <span class="text-white">0</span>
            </div>

            <!-- Needs Action -->
            <div class="flex items-center justify-between text-red-500 px-4 py-3 hover:bg-[#2E3347] rounded-lg cursor-pointer">
                <span class="flex items-center gap-2">
                    <User /><span class="relative">
                        <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">!</span>
                    </span> Needs action
                </span>
                <span class="text-white">0</span>
            </div>

            <!-- Documents -->
            <div class="flex items-center justify-between text-purple-400 px-4 py-3 hover:bg-[#2E3347] rounded-lg cursor-pointer">
                <span class="flex items-center gap-2">
                    <File />Documents <span class="text-red-500">🔔</span>
                </span>
                <span class="text-white">0</span>
            </div>

    </div>
  </div>

  
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



</body>
</template>


<style scoped>

</style>