<script setup lang="ts">

import Vite from "../assets/vite.svg";
import Vue from "../assets/vue.svg";
import Button from "primevue/button";
import { ref } from "vue";
import { Check, Clock, User, File, TriangleAlert, Download, Trash, Ellipsis, X } from "lucide-vue-next";

// Define the type for documents
interface Document {
  id: number;
  orderNumber: string;
  trackingId: string;
  handledBy: string;
  createdBy: string;
  dateCreated: string;
}

// Document data
const documents = ref<Document[]>([
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
]);
// Modal state
const selectedOrder = ref<Document | null>(null);
const isModalOpen = ref(false);

// Open modal function
const openModal = (order: Document) => {
  selectedOrder.value = order;
  isModalOpen.value = true;
};

// Close modal function
const closeModal = () => {
  isModalOpen.value = false;
  selectedOrder.value = null;
};

</script>

<template>

<body class="bg-[#0A0E1A] flex h-screen p-4">
<div class="w-64 bg-[#0A0E1A] text-white mr-4 rounded-lg">

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

  
  <div class="p-6 flex-grow bg-white rounded-lg shadow-md">
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
    <div class="border rounded-lg overflow-hidden w-full bg-white">
      <table class="w-full border-collapse bg-white">
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
              <a href="#" class="text-blue-600 cursor-pointer" @click.prevent="openModal(doc)">
    {{ doc.orderNumber }}
  </a>
  <div class="text-xs text-gray-500">{{ doc.trackingId }}</div>

            </td>
            <td class="p-3 font-semibold">{{ doc.handledBy }}</td>
            <td class="p-3 font-semibold">{{ doc.createdBy }}</td>
            <td class="p-3">{{ doc.dateCreated }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex justify-end">
    <div class="w-96 bg-[#1A1F36] text-white p-6 shadow-lg relative">
      <!-- Close Button -->
      <button class="absolute top-4 right-4 text-gray-400 hover:text-white" @click="closeModal">
        <X />
      </button>

      <h2 class="text-lg font-bold">{{ selectedOrder?.orderNumber }}</h2>
      <p class="text-sm text-gray-400">Order Details</p>

      <!-- Order Details -->
      <div class="mt-4 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-400">Created at</span>
          <span>{{ selectedOrder?.dateCreated }}</span>
        </div>
        <div class="flex justify-between mt-2">
          <span class="text-gray-400">Status</span>
          <span class="px-2 py-1 bg-yellow-500 text-black text-xs font-semibold rounded">In progress</span>
        </div>
      </div>

      <!-- Handler Info -->
      <div class="mt-6">
        <h3 class="font-semibold">Handled By:</h3>
        <p class="text-sm">{{ selectedOrder?.handledBy }}</p>
        <p class="text-sm text-blue-400 underline">juandelacruz@gmail.com</p>
        <p class="text-sm">09384874855</p>

      </div>

      <!-- Timeline -->
      <div class="mt-6">
        <h3 class="font-semibold">Timeline</h3>
        <ul class="mt-2 space-y-2 text-sm">
          <li class="flex items-start gap-2">
            <Check class="text-green-400" />
            <span>
              <strong>The Document is being verified</strong>
              <p class="text-gray-400">Pending</p>
            </span>
          </li>
          <li class="flex items-start gap-2">
            <Clock class="text-yellow-400" />
            <span>
              <strong>Document checked by supplier</strong>
              <p class="text-gray-400">In progress</p>
            </span>
          </li>
          <li class="flex items-start gap-2">
            <Check class="text-green-400" />
            <span>
              <strong>Document was received</strong>
              <p class="text-gray-400">Document was received by supplier <span class="text-blue-400">John Doe</span></p>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
  </div>



</body>
</template>


<style scoped>

</style>

