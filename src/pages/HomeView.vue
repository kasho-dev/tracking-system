<script setup lang="ts">
import Vite from "../assets/vite.svg";
import Vue from "../assets/vue.svg";
import Button from "primevue/button";
import { ref } from "vue";
import {
  Check,
  Clock,
  User,
  File,
  TriangleAlert,
  Download,
  Trash,
  Ellipsis,
  Icon,
} from "lucide-vue-next";

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
const showModal = ref(false);
const poNumber = ref("");

const openModal = () => {
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  poNumber.value = ""; // Reset input field when closed
};

const submitPO = () => {
  console.log("Submitted PO Number:", poNumber.value);
  closeModal();
};

const activeButton = ref("Completed"); // Default active button

const setActive = (buttonName: string) => {
  activeButton.value = buttonName;
};

//Documents Data
const documents = ref<Document[]>([
  {
    id: 1,
    orderNumber: "Processing Order #1",
    trackingId: "983472983742983",
    handledBy: "Juan Dela Cruz",
    createdBy: "Maria Santos",
    dateCreated: "March 10, 2025, 08:45:00 AM",
  },
  {
    id: 2,
    orderNumber: "Processing Order #2",
    trackingId: "349857293847593",
    handledBy: "Coco Hardin",
    createdBy: "Juan Dela Cruz",
    dateCreated: "March 11, 2025, 02:30:15 PM",
  },
  {
    id: 3,
    orderNumber: "Processing Order #3",
    trackingId: "234978234789234",
    handledBy: "Liam Johnson",
    createdBy: "Olivia Brown",
    dateCreated: "March 12, 2025, 11:15:45 AM",
  },
  {
    id: 4,
    orderNumber: "Processing Order #4",
    trackingId: "987238947238947",
    handledBy: "Sophia Garcia",
    createdBy: "Mia Martinez",
    dateCreated: "March 13, 2025, 06:50:30 PM",
  },
  {
    id: 5,
    orderNumber: "Processing Order #5",
    trackingId: "238947923847928",
    handledBy: "Noah Smith",
    createdBy: "Emma Wilson",
    dateCreated: "March 14, 2025, 07:20:10 AM",
  },
  {
    id: 6,
    orderNumber: "Processing Order #6",
    trackingId: "874923847238492",
    handledBy: "Ava Thomas",
    createdBy: "Lucas White",
    dateCreated: "March 15, 2025, 04:10:22 PM",
  },
  {
    id: 7,
    orderNumber: "Processing Order #7",
    trackingId: "349823748923749",
    handledBy: "James Davis",
    createdBy: "Charlotte Lee",
    dateCreated: "March 16, 2025, 09:05:33 AM",
  },
  {
    id: 8,
    orderNumber: "Processing Order #8",
    trackingId: "923847238947238",
    handledBy: "Ella Harris",
    createdBy: "Henry Walker",
    dateCreated: "March 17, 2025, 03:45:18 PM",
  },
  {
    id: 9,
    orderNumber: "Processing Order #9",
    trackingId: "394872384798234",
    handledBy: "William Lewis",
    createdBy: "Sophia Robinson",
    dateCreated: "March 18, 2025, 12:30:00 PM",
  },
  {
    id: 10,
    orderNumber: "Processing Order #10",
    trackingId: "128374982374982",
    handledBy: "Benjamin Carter",
    createdBy: "Lucas Hall",
    dateCreated: "March 19, 2025, 10:10:45 AM",
  },
]);
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
      <button
        @click="openModal"
        class="w-full flex items-center justify-center gap-2 bg-[#6A5CFE] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#7C6CFF] transition"
      >
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
          <path d="M13.234 20.252 21 12.3" />
          <path
            d="m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486"
          />
        </svg>
        Add PO Number
      </button>
      <!--test-->

      <div class="mt-4 space-y-2">
        <!-- Completed -->
        <div
          @click="setActive('Completed')"
          class="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer font-semibold"
          :class="
            activeButton === 'Completed'
              ? 'bg-[#2E3347] text-green-400'
              : 'text-green-400 hover:bg-[#2E3347]'
          "
        >
          <span class="flex items-center gap-2">
            <Check />
            Completed
          </span>
          <span class="text-white">0</span>
        </div>

        <!-- Pending -->
        <div
          @click="setActive('Pending')"
          class="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer"
          :class="
            activeButton === 'Pending'
              ? 'bg-[#2E3347] text-purple-400'
              : 'text-purple-400 hover:bg-[#2E3347]'
          "
        >
          <span class="flex items-center gap-2">
            <Clock />
            Pending
          </span>
          <span class="text-white">0</span>
        </div>

        <!-- Lapsed -->
        <div
          @click="setActive('Lapsed')"
          class="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer"
          :class="
            activeButton === 'Lapsed'
              ? 'bg-[#2E3347] text-yellow-400'
              : 'text-yellow-400 hover:bg-[#2E3347]'
          "
        >
          <span class="flex items-center gap-2">
            <TriangleAlert />
            <span class="relative">
              <span
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full"
                >!</span
              >
            </span>
            Lapsed
          </span>
          <span class="text-white">0</span>
        </div>

        <!-- Needs Action -->
        <div
          @click="setActive('Needs Action')"
          class="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer"
          :class="
            activeButton === 'Needs Action'
              ? 'bg-[#2E3347] text-red-500'
              : 'text-red-500 hover:bg-[#2E3347]'
          "
        >
          <span class="flex items-center gap-2">
            <User />
            <span class="relative">
              <span
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full"
                >!</span
              >
            </span>
            Needs action
          </span>
          <span class="text-white">0</span>
        </div>

        <!-- Documents -->
        <div
          @click="setActive('Documents')"
          class="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer"
          :class="
            activeButton === 'Documents'
              ? 'bg-[#2E3347] text-purple-400'
              : 'text-purple-400 hover:bg-[#2E3347]'
          "
        >
          <span class="flex items-center gap-2">
            <File />
            Documents <span class="text-red-500">🔔</span>
          </span>
          <span class="text-white">0</span>
        </div>
      </div>
    </div>

    <div class="p-6 flex-grow bg-white rounded-lg shadow-md">
      <h1 class="text-2xl font-bold mb-4">ALL DOCUMENTS</h1>

      <!-- Action Buttons with Lucide Icons -->
      <div class="flex space-x-4 mb-4">
        <button class="p-2 bg-gray-100 rounded hover:bg-gray-300 transition">
          <Download />
        </button>
        <button class="p-2 bg-gray-100 rounded hover:bg-gray-300 transition">
          <Trash />
        </button>
        <button class="p-2 bg-gray-100 rounded hover:bg-gray-300 transition">
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
              class="border-b hover:bg-gray-50 text-sm transition"
            >
              <td class="p-3"><input type="checkbox" class="w-4 h-4" /></td>
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

    <!-- PO Number Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <div class="bg-[#0B132B] p-6 rounded-lg shadow-md w-96">
        <h2 class="text-lg font-semibold mb-4 text-white text-center">
          Enter PO Number
        </h2>

        <input
          v-model="poNumber"
          type="text"
          placeholder="eg.2418203490"
          class="w-full p-2 border rounded-md mb-4"
        />

        <div class="flex justify-end gap-2">
          <button
            @click="closeModal"
            class="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            @click="submitPO"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  </body>
</template>

<style scoped>
</style>

//test