<script setup lang="ts">
// import Vite from "../assets/vite.svg";
// import Vue from "../assets/vue.svg";
// import Button from "primevue/button";
// import { defineStore } from "pinia";
import { onMounted, ref, computed, watch } from "vue";
import { useSearchStore } from "/workspaces/tracking-system/src/stores/searchStore.ts"; // Import the Pinia store
import * as XLSX from "xlsx";

import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');




const searchStore = useSearchStore(); // ✅ Initialize store

import {
  Check,
  Clock,
  User,
  File,
  TriangleAlert,
  Download,
  Trash,
  X,
} from "lucide-vue-next";

// Define the type for documents
interface Document {
  id: string; // Changed from number to string
  orderNumber: string;
  trackingId: string;
  handledBy: string;
  createdBy: string;
  dateCreated: string;
  status: string;
  fileType?: string; // ✅ Add this to allow undefined values
}

// Store the user data
const tassadarUser = ref<any>(null); 

// Fetch the user by email or ID
const fetchTassadarUser = async () => {
  try {
    // METHOD 1: Get by email (if you know it)
    tassadarUser.value = await pb.collection('users').getFirstListItem(
      'email="logangster86@gmail.com"'
    );
    
    // OR METHOD 2: Get by ID (from your screenshot)
    // tassadarUser.value = await pb.collection('users').getOne("Rigm2021984p");
    
    console.log("Fetched user:", tassadarUser.value);
  } catch (error) {
    console.error("Error fetching user:", error);
    // Fallback to hardcoded name if fetch fails
    tassadarUser.value = { name: "tassadar" }; 
  }
};

// Call this when your component mounts
fetchTassadarUser();

// Search Query
const searchQuery = ref("");

// Document data
const showModal = ref(false);
const poNumber = ref("");

// Add PO Document Modal
const openModalAdd = () => {
  showModal.value = true;
};

const closeModalAdd = () => {
  showModal.value = false;
  poNumber.value = ""; // Reset input field when closed
};

// Code block for fetching data from PocketBase
onMounted(() => {
  fetchDocuments();
});

const fetchDocuments = async () => {
  try {
    // Fetch all records from Collection_1
    const records = await pb.collection("Collection_1").getFullList({
      sort: "-created", // Sort by creation date (newest first)
    });

    // Map the records to the Document interface format
    documents.value = records.map((record) => ({
      id: record.id,
      orderNumber: `Processing Order #${record.Order_No}`,
      trackingId: record.trackingId,
      handledBy: record.handledBy,
      createdBy: record.createdBy,
      dateCreated: new Date(record.created).toLocaleString(),
      status: record.status,
      fileType: "xlsx", // Assuming all documents are XLSX files
    }));
  } catch (error) {
    console.error("Error fetching documents:", error);
    alert("Failed to load documents. Please try again.");
  }
};

// Submit PO to Database
const submitPO = async () => {
  if (!poNumber.value) {
    alert("Please enter an order number.");
    return;
  }

  const data = {
    Order_No: poNumber.value, // Use the PO number entered by the user
    trackingId: `seq${Math.floor(Math.random() * 1000000)}`, // Generate a random tracking ID
    handledBy: "System", // Default handler
    createdBy: "Admin", // Default creator
    status: "Pending", // Default status
  };

  try {
    const record = await pb.collection('Collection_1').create(data);
    
    documents.value.push({
      id: record.id,
      orderNumber: `${record.Order_No}`,
      trackingId: record.trackingId,
      handledBy: record.handledBy,
      createdBy: record.createdBy, // Will show "tassadar"
      dateCreated: new Date(record.created).toLocaleString(),
      status: record.status,
      fileType: "xlsx", // Add this line
    });

    closeModalAdd();
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to create order.");
  }
};

const activeButton = ref("Documents"); // Default active button

const setActive = (status: string) => {
  activeButton.value = status;

  // Ensure "Documents" triggers download function
};

/// MODAL 2
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

//Documents Data
const documents = ref<Document[]>([]);

//Checkbox Function
const selectAll = ref(false);
const selectedDocuments = ref<string[]>([]);

// Check if all checkboxes are selected
const areAllSelected = computed(
  () => selectedDocuments.value.length === documents.value.length
);

const toggleSelection = (id: string) => {
  // Changed parameter type
  const index = selectedDocuments.value.indexOf(id);
  if (index > -1) {
    selectedDocuments.value.splice(index, 1);
  } else {
    selectedDocuments.value.push(id);
  }
};

//Delete Selected Checkbox Function
const deleteSelected = () => {
  documents.value = documents.value.filter(
    (doc) => !selectedDocuments.value.includes(doc.id)
  );
  selectedDocuments.value = [];
};

const toggleAllSelection = () => {
  const shouldSelectAll = !areAllSelected.value;
  selectedDocuments.value = shouldSelectAll
    ? documents.value.map((doc) => doc.id)
    : [];
  selectAll.value = shouldSelectAll;
};

// Watch for individual checkbox changes and update "Select All" state
watch(selectedDocuments, (newVal) => {
  selectAll.value = newVal.length === documents.value.length; // If all are selected, check header
});

//Download Function
const selectedOverlayDocuments = ref<string[]>([]);

const toggleOverlaySelection = (id: string) => {
  // Changed parameter type
  const index = selectedOverlayDocuments.value.indexOf(id);
  if (index > -1) {
    selectedOverlayDocuments.value.splice(index, 1);
  } else {
    selectedOverlayDocuments.value.push(id);
  }
};

const downloadSelectedDocuments = () => {
  // Filter selected documents that match the active status and are XLSX files
  const selectedDocs = selectedDocuments.value
    .map((id) => documents.value.find((doc) => doc.id === id))
    .filter(
      (doc): doc is Document =>
        !!doc &&
        (activeButton.value === "Documents" ||
          doc.status === activeButton.value)
    );

  if (selectedDocs.length === 0) {
    alert("No XLSX files selected for the current status.");
    return;
  }

  if (selectedDocs.length === 1) {
    // Single document selected - Name file based on Order Number
    const doc = selectedDocs[0];
    const fileName = `${doc.orderNumber}.xlsx`;

    const data = [
      {
        "Order Number": doc.orderNumber,
        "Tracking ID": doc.trackingId,
        "Handled By": doc.handledBy,
        "Created By": doc.createdBy,
        "Date Created": doc.dateCreated,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order Details");
    XLSX.writeFile(workbook, fileName);
  } else {
    // Multiple documents selected - Name file as "Multiple Orders.xlsx"
    const data = selectedDocs.map((doc) => ({
      "Order Number": doc.orderNumber,
      "Tracking ID": doc.trackingId,
      "Handled By": doc.handledBy,
      "Created By": doc.createdBy,
      "Date Created": doc.dateCreated,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Orders");
    XLSX.writeFile(workbook, "Multiple Orders.xlsx");
  }
};

//Confirm Delete Function
const showDeleteConfirmation = ref(false); // Controls popup visibility
const documentsToDelete = ref<string[]>([]);

// Open confirmation overlay
const confirmDelete = () => {
  if (selectedDocuments.value.length > 0) {
    documentsToDelete.value = [...selectedDocuments.value]; // Store selected IDs
    showDeleteConfirmation.value = true;
  } else {
    alert("Please select at least one document to delete.");
  }
};

// Close the confirmation popup
const closeDeletePopup = () => {
  showDeleteConfirmation.value = false;
};

// Perform deletion and close popup
const deleteSelectedDocuments = async () => {
  if (selectedDocuments.value.length === 0) {
    alert("No documents selected for deletion.");
    return;
  }

  try {
    // Delete each selected document from PocketBase
    const deletePromises = documentsToDelete.value.map((id) =>
      pb.collection("Collection_1").delete(id)
    );

    await Promise.all(deletePromises);

    // Update local state after successful deletion
    documents.value = documents.value.filter(
      (doc) => !documentsToDelete.value.includes(doc.id)
    );
    selectedDocuments.value = [];
    showDeleteConfirmation.value = false;

    console.log("Successfully deleted documents:", documentsToDelete.value);
  } catch (error) {
    console.error("Error deleting documents:", error);
    alert("Failed to delete documents. Please try again.");
  }
};

//Checkbox Change Icon Function
const handleCheckboxChange = (id: string) => {
  // Changed parameter type
  toggleSelection(id);
  toggleOverlaySelection(id);
};

// Computed property to filter documents
const filteredDocuments = computed(() => {
  let filtered = documents.value;

  // Apply search filter if there's a query
  if (searchStore.searchQuery) {
    filtered = filtered.filter((doc) =>
      Object.values(doc).some((field) =>
        String(field)
          .toLowerCase()
          .includes(searchStore.searchQuery.toLowerCase())
      )
    );
  }

  // Filter Table Documents base on Active Button
  if (activeButton.value === "Completed") {
    filtered = filtered.filter((doc) => doc.status === "Completed");
  } else if (activeButton.value === "Document") {
    filtered = filtered.filter((doc) => doc.status === "Document");
  } else if (activeButton.value === "Lapsed") {
    filtered = filtered.filter((doc) => doc.status === "Lapsed");
  } else if (activeButton.value === "Needs Action") {
    filtered = filtered.filter((doc) => doc.status === "Needs Action");
  } else if (activeButton.value === "Pending") {
    filtered = filtered.filter((doc) => doc.status === "Pending");
  }
  return filtered;
});

// Computed property: Count documents by status
const statusCounts = computed(() => {
  return documents.value.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
});
</script>

<template>
  <body class="bg-[#0A0E1A] flex flex-grow p-4">
    <!-- Add PO Document Button -->
    <div class="w-64 bg-[#0A0E1A] text-white mr-4 rounded-lg">
      <button
    @click="openModalAdd"
    class="w-full flex items-center justify-center gap-2 bg-[#6A5CFE] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#7C6CFF] active:bg-[#5A4BD9] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out"
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
    Add Purchasing Order
  </button>

  <!-- Processing Order Creation Modal -->
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
        placeholder="eg. APO2025-2024"
        class="w-full p-2 border rounded-md mb-4 text-black"
      />

          <div class="flex justify-end gap-2">
            <button
              @click="closeModalAdd"
              class="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition"
            >
              Cancel
            </button>
            <button
              @click="submitPO"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Create Order
            </button>
          </div>
        </div>
      </div>

      <!--Sidebar Buttons-->

      <div class="mt-4 space-y-2">
        <!-- Documents (All) -->
        <div
          @click="setActive('Documents')"
          class="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:translate-x-2"
          :class="
            activeButton === 'Documents'
              ? 'bg-[#2E3347] text-purple-400'
              : 'text-purple-400 hover:bg-[#2E3347]'
          "
        >
          <span class="flex items-center gap-2"><File /> Documents </span>
          <span class="text-white">{{ documents.length }}</span>
        </div>

        <!-- Completed -->
        <div
          @click="setActive('Completed')"
          class="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer font-semibold transition-all duration-300 ease-in-out hover:translate-x-2"
          :class="
            activeButton === 'Completed'
              ? 'bg-[#2E3347] text-green-400'
              : 'text-green-400 hover:bg-[#2E3347]'
          "
        >
          <span class="flex items-center gap-2"><Check /> Completed</span>
          <span class="text-white">{{ statusCounts.Completed || 0 }}</span>
        </div>

        <!-- Pending -->
        <div
          @click="setActive('Pending')"
          class="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:translate-x-2"
          :class="
            activeButton === 'Pending'
              ? 'bg-[#2E3347] text-purple-400'
              : 'text-purple-400 hover:bg-[#2E3347]'
          "
        >
          <span class="flex items-center gap-2"><Clock /> Pending</span>
          <span class="text-white">{{ statusCounts.Pending || 0 }}</span>
        </div>

        <!-- Lapsed -->
        <div
          @click="setActive('Lapsed')"
          class="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:translate-x-2"
          :class="
            activeButton === 'Lapsed'
              ? 'bg-[#2E3347] text-yellow-400'
              : 'text-yellow-400 hover:bg-[#2E3347]'
          "
        >
          <span class="flex items-center gap-2"><TriangleAlert /> Lapsed</span>
          <span class="text-white">{{ statusCounts.Lapsed || 0 }}</span>
        </div>

        <!-- Needs Action -->
        <div
          @click="setActive('Needs Action')"
          class="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:translate-x-2"
          :class="
            activeButton === 'Needs Action'
              ? 'bg-[#2E3347] text-red-500'
              : 'text-red-500 hover:bg-[#2E3347]'
          "
        >
          <span class="flex items-center gap-2"><User /> Needs Action</span>
          <span class="text-white">{{
            statusCounts["Needs Action"] || 0
          }}</span>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="p-6 flex-grow bg-white rounded-lg shadow-md">
      <h1 class="text-2xl font-bold mb-4">
        <span>
          {{ activeButton.toUpperCase() }}
          <span v-if="activeButton.toUpperCase() !== 'DOCUMENTS'"
            >DOCUMENT</span
          >
        </span>
      </h1>

      <!-- Action Buttons with Lucide Icons -->
      <div class="flex space-x-4 mb-4">
        <button
          class="p-2 bg-gray-100 rounded hover:bg-green-500 transition"
          @click="downloadSelectedDocuments"
        >
          <Download />
        </button>
        <button
          class="p-2 bg-gray-100 rounded hover:bg-red-500 transition"
          @click="confirmDelete"
        >
          <Trash />
        </button>

        <!-- <button class="p-2 bg-gray-100 rounded hover:bg-gray-300 transition">
          <Ellipsis />
        </button> -->
      </div>

      <!-- Table Header (Fixed) -->
      <div class="border rounded-t-lg bg-gray-100">
        <table class="w-full border-collapse">
          <thead>
            <tr class="text-gray-600 text-sm">
              <th class="p-3 pr-5">
                <input
                  type="checkbox"
                  class="w-4 h-4"
                  v-model="selectAll"
                  @change="toggleAllSelection"
                />
              </th>
              <th class="p-0">Order #</th>
              <th class="p-0">Handled by</th>
              <th class="p-0">Created by</th>
              <th class="p-0">Date Created</th>
            </tr>
          </thead>
        </table>
      </div>

      <!-- Scrollable Table Body -->
      <div
        class="border border-t-0 rounded-b-lg overflow-auto w-full max-h-[450px]"
      >
        <table class="w-full border-collapse bg-white">
          <tbody>
            <tr
              v-for="doc in filteredDocuments"
              :key="doc.id"
              class="border-b hover:bg-gray-200 text-sm transition"
            >
              <td class="p-3 pl-12">
                <input
                  type="checkbox"
                  class="w-4 h-4"
                  :value="doc.id"
                  v-model="selectedDocuments"
                />
              </td>
              <!-- <td class="p-3 pl-12">
                <input type="checkbox" class="w-4 h-4" />
              </td> -->
              <td class="p-3">
                <a
                  href="#"
                  class="text-blue-600 cursor-pointer"
                  @click.prevent="openModal(doc)"
                >
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
    </div>

    <!-- Overlay -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-end"
    >
      <div class="w-96 bg-[#1A1F36] text-white p-6 shadow-lg relative">
        <!-- Close Button -->
        <button
          class="absolute top-4 right-4 text-gray-400 hover:text-white"
          @click="closeModal"
        >
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
            <span
              class="px-2 py-1 bg-yellow-500 text-black text-xs font-semibold rounded"
              >In progress</span
            >
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
                <p class="text-gray-400">
                  Document was received by supplier
                  <span class="text-blue-400">John Doe</span>
                </p>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Popup -->
    <div
      v-if="showDeleteConfirmation"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 class="text-lg font-semibold mb-4">Confirm Deletion</h2>
        <p class="text-gray-600">
          Are you sure you want to delete the selected documents? This action
          cannot be undone.
        </p>

        <div class="mt-6 flex justify-end space-x-4">
          <button
            @click="closeDeletePopup"
            class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            @click="deleteSelectedDocuments"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </body>
</template>

<style scoped></style>
