<script setup lang="ts">
// import Vite from "../assets/vite.svg";
// import Vue from "../assets/vue.svg";
// import Button from "primevue/button";
// import { defineStore } from "pinia";
import { onMounted, ref, computed, watch, onUnmounted } from "vue";
import { useSearchStore } from "../stores/searchStore"; // Import the Pinia store
import * as XLSX from "xlsx";
import Timeline from "primevue/timeline";
import PocketBase from "pocketbase";
import {
  Check,
  Clock,
  User,
  File,
  TriangleAlert,
  Download,
  Trash,
  X,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-vue-next";

// Define the type for documents
interface Document {
  id: string;
  orderNumber: string;
  trackingId: string;
  handledBy: string;
  createdBy: string;
  dateCreated: string;
  status: string;
  fileType?: string;
  supplierName: string;
  address: string;
  tin_ID: string;
  modeofProcurement: string;
  deliveryDate: string;

  verificationEvents?: Array<{
    type: string; // 'initial', 'acknowledgement', 'final'
    timestamp: string;
    userId: string;
    userName: string;
  }>;

  verifiedAt?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  completedAt?: string;
  updatedAt?: string;
}

// Linked Pocketbase
const pb = new PocketBase("http://127.0.0.1:8090");

const searchStore = useSearchStore(); // ✅ Initialize store

// Refresh Table Every Second
// const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null);
const isOverlayOpen = ref(false);

const fetchSelectedOrder = async () => {
  if (!selectedOrder.value) return;

  try {
    const record = await pb
      .collection("Collection_1")
      .getOne(selectedOrder.value.id, {
        expand:
          "verifiedAt,completedAt,updatedAt,verifiedBy,verificationEvents.userId",
      });

    // ENSURE completedAt is never lost
    if (selectedOrder.value.status === "Completed" && !record.completedAt) {
      await pb.collection("Collection_1").update(selectedOrder.value.id, {
        completedAt: selectedOrder.value.completedAt,
      });
    }

    selectedOrder.value = {
      ...selectedOrder.value,
      completedAt: record.completedAt || selectedOrder.value.completedAt,
      id: record.id,
      orderNumber: `${record.Order_No}`,
      trackingId: record.trackingId || "",
      handledBy: record.handledBy || "Unknown",
      createdBy: record.createdBy || "Unknown",
      dateCreated: new Date(record.created).toLocaleString(),
      status: record.status || "Unknown",
      fileType: record.fileType || "xlsx",
      supplierName: record.supplierName || "Unknown",
      address: record.address || "Unknown",
      tin_ID: record.tin_ID || "Unknown",
      modeofProcurement: record.modeofProcurement || "Unknown",
      deliveryDate: record.deliveryDate
        ? new Date(record.deliveryDate).toLocaleDateString()
        : "",
      verifiedAt: record.verifiedAt,
      verifiedBy: record.verifiedBy,
      verifiedByName:
        record.expand?.verifiedBy?.name ||
        record.expand?.verifiedBy?.email ||
        "System",
      updatedAt: record.updatedAt,
      verificationEvents: record.verificationEvents?.map((event: any) => ({
        type: event.type,
        timestamp: event.timestamp,
        userId: event.userId,
        userName:
          record.expand?.["verificationEvents.userId"]?.find(
            (u: any) => u.id === event.userId
          )?.name ||
          record.expand?.["verificationEvents.userId"]?.find(
            (u: any) => u.id === event.userId
          )?.email ||
          "Unknown",
      })),
    };
  } catch (error) {
    console.error("Error refreshing selected order:", error);
  }
};

const startPolling = () => {
  // Fetch documents immediately
  fetchDocuments();

  // If overlay is open, fetch selected order too
  if (isOverlayOpen.value) {
    fetchSelectedOrder();
  }

  // Set up interval for every second
  // refreshInterval.value = setInterval(() => {
  //   fetchDocuments();
  //   if (isOverlayOpen.value) {
  //     fetchSelectedOrder();
  //   }
  // }, 1000);
};

// const stopPolling = () => {
//   if (refreshInterval.value) {
//     clearInterval(refreshInterval.value);
//     refreshInterval.value = null;
//   }
// };
// End of Refresh Interval

//Timeline Script
const verificationTime = ref<string | null>(null);
const timelineEvents = ref<
  Array<{
    title: string;
    description: string;
    time?: string;
  }>
>([]);

const isAllowedRole = computed(() => {
  const allowedRoles = ["admin", "user", "supplier"];
  return (
    currentUser.value?.role && allowedRoles.includes(currentUser.value.role)
  );
});

const verifyDocument = async () => {
  if (!selectedOrder.value || !currentUser.value) return;

  try {
    const verificationTimestamp = new Date().toISOString();
    let newStatus = selectedOrder.value.status;
    let verificationType = "";

    // Admin actions
    if (currentUser.value.role === "admin") {
      if (selectedOrder.value.status === "Pending") {
        newStatus = "Needs Action";
        verificationType = "initial";
      } else if (selectedOrder.value.status === "Verified") {
        // FINAL VERIFICATION - DOCUMENT COMPLETION
        newStatus = "Completed";
        verificationType = "final";

        // 1. ALWAYS set completedAt with a fresh timestamp
        const completionTimestamp = new Date().toISOString();
        selectedOrder.value.completedAt = completionTimestamp;

        // 2. Prepare update data with completion info
        const updateData = {
          status: "Completed",
          verificationEvents: [
            ...(selectedOrder.value.verificationEvents || []),
            {
              type: "final",
              timestamp: completionTimestamp,
              userId: currentUser.value.id,
              userName: currentUser.value.name || currentUser.value.email,
            },
          ],
          completedAt: completionTimestamp,
          updatedAt: completionTimestamp,
        };

        // 3. Update in PocketBase
        await pb
          .collection("Collection_1")
          .update(selectedOrder.value.id, updateData);

        // 4. Update local state
        selectedOrder.value.status = "Completed";
        selectedOrder.value.verificationEvents = updateData.verificationEvents;
        selectedOrder.value.updatedAt = completionTimestamp;

        // 5. Update in documents array
        const docIndex = documents.value.findIndex(
          (doc) => doc.id === selectedOrder.value?.id
        );
        if (docIndex !== -1) {
          documents.value[docIndex] = {
            ...documents.value[docIndex],
            ...updateData,
          };
        }

        return; // Skip the rest of the function for completion
      }
    }
    // Supplier actions (unchanged)
    else if (currentUser.value.role === "supplier") {
      if (selectedOrder.value.status === "Needs Action") {
        newStatus = "Verified";
        verificationType = "acknowledgement";
      } else {
        return;
      }
    }

    // Original verification logic for non-completion cases
    const verificationEvents = selectedOrder.value.verificationEvents || [];
    verificationEvents.push({
      type: verificationType,
      timestamp: verificationTimestamp,
      userId: currentUser.value.id,
      userName: currentUser.value.name || currentUser.value.email,
    });

    const updateData: any = {
      status: newStatus,
      verificationEvents: verificationEvents,
      verifiedAt: verificationTimestamp,
      verifiedBy: currentUser.value.id,
      verifiedByName: currentUser.value.name || currentUser.value.email,
      updatedAt: verificationTimestamp,
    };

    await pb
      .collection("Collection_1")
      .update(selectedOrder.value.id, updateData);

    // Update local state
    Object.assign(selectedOrder.value, {
      status: newStatus,
      verificationEvents,
      verifiedAt: verificationTimestamp,
      verifiedBy: currentUser.value.id,
      verifiedByName: currentUser.value.name || currentUser.value.email,
      updatedAt: verificationTimestamp,
    });

    // Update in documents array
    const docIndex = documents.value.findIndex(
      (doc) => doc.id === selectedOrder.value?.id
    );
    if (docIndex !== -1) {
      Object.assign(documents.value[docIndex], {
        status: newStatus,
        verificationEvents,
        verifiedAt: verificationTimestamp,
        verifiedBy: currentUser.value.id,
        verifiedByName: currentUser.value.name || currentUser.value.email,
        updatedAt: verificationTimestamp,
      });
    }
  } catch (error) {
    console.error("Error verifying document:", error);
    alert("Failed to verify document. Please try again.");
  }
};

// Timeline Events Handler
const events = computed(() => {
  if (!selectedOrder.value) return [];

  // 1. Create base events with document creation
  const timelineEvents = [
    {
      title: "Document Created",
      description: "Document created",
      time: formatTimestamp(selectedOrder.value.dateCreated),
    },
  ];

  // 2. Add verification events with improved type safety
  if (selectedOrder.value.verificationEvents) {
    selectedOrder.value.verificationEvents.forEach((event) => {
      timelineEvents.push({
        title: getVerificationTitle(event.type),
        description: `Action by ${event.userName}`,
        time: formatTimestamp(event.timestamp),
      });
    });
  }

  // 3. MANDATORY completion event (only if status is Completed)
  if (selectedOrder.value.status === "Completed") {
    timelineEvents.push({
      title: "Document Completed",
      description: "All verification steps completed",
      // SAFE: completedAt is guaranteed to exist from Step 1 changes
      time: formatTimestamp(selectedOrder.value.completedAt!),
    });
  }

  return timelineEvents;
});

// Helper function for verification titles
const getVerificationTitle = (type: string): string => {
  const titleMap: Record<string, string> = {
    initial: "Initial Verification",
    acknowledgement: "Verification Acknowledged",
    final: "Final Verification",
  };
  return titleMap[type] || "Verification Step";
};

// Helper function to consistently format timestamps
const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const completeDocument = async () => {
  if (!selectedOrder.value) return;

  // Validation - should never happen in normal flow
  if (!selectedOrder.value.verifiedAt) {
    alert("Document must be verified before completion");
    return;
  }

  const completionTimestamp = new Date().toISOString();

  try {
    await pb.collection("Collection_1").update(selectedOrder.value.id, {
      status: "Completed",
      completedAt: completionTimestamp,
      updatedAt: completionTimestamp,
    });

    // Update all relevant state
    selectedOrder.value.status = "Completed";
    selectedOrder.value.completedAt = completionTimestamp;

    const docIndex = documents.value.findIndex(
      (d) => d.id === selectedOrder.value?.id
    );
    if (docIndex !== -1) {
      documents.value[docIndex].status = "Completed";
      documents.value[docIndex].completedAt = completionTimestamp;
    }
  } catch (error) {
    console.error("Completion failed:", error);
  }
};

// End of Timeline Script

// Store the user data
const tassadarUser = ref<any>(null);

// Fetch the user by email or ID
const fetchTassadarUser = async () => {
  try {
    // METHOD 1: Get by email (if you know it)
    tassadarUser.value = await pb
      .collection("users")
      .getFirstListItem('email="logangster86@gmail.com"');

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

// Sorting Table
const sortField = ref("dateCreated");
const sortDirection = ref("desc");

const sortedDocuments = computed(() => {
  const field = sortField.value;
  const direction = sortDirection.value;

  return [...filteredDocuments.value].sort((a, b) => {
    // Handle date fields differently
    if (field === "dateCreated") {
      const dateA = new Date(a.dateCreated).getTime();
      const dateB = new Date(b.dateCreated).getTime();
      return direction === "asc" ? dateA - dateB : dateB - dateA;
    }

    // Handle string fields
    const valueA = String(a[field as keyof Document]).toLowerCase();
    const valueB = String(b[field as keyof Document]).toLowerCase();

    if (valueA < valueB) return direction === "asc" ? -1 : 1;
    if (valueA > valueB) return direction === "asc" ? 1 : -1;
    return 0;
  });
});

const toggleSort = (field: string) => {
  if (sortField.value === field) {
    // Reverse direction if same field is clicked
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    // Set new field and default to ascending
    sortField.value = field;
    sortDirection.value = "asc";
  }
};
// End of sorting table

// Document data
const showModal = ref(false);
const poNumber = ref("");
const supplierName = ref("");
const address = ref(""); // Changed from supplierAddress
const tin_ID = ref(""); // Changed from tin_id
const modeofProcurement = ref(""); // Changed from procurementMode
const deliveryDate = ref("");

// Add PO Document Modal
const openModalAdd = () => {
  showModal.value = true;
};

const closeModalAdd = () => {
  showModal.value = false;
  poNumber.value = ""; // Reset input field when closed
  supplierName.value = ""; // Reset input field when closed
  address.value = ""; // Reset input field when closed
  tin_ID.value = ""; // Reset input field when closed
  modeofProcurement.value = ""; // Reset input field when closed
  deliveryDate.value = ""; // Reset input field when closed
};

// Code block for fetching data from PocketBase
const fetchDocuments = async () => {
  try {
    const records = await pb.collection("Collection_1").getFullList({
      sort: "-created",
      expand:
        "verifiedAt,completedAt,updatedAt,verifiedBy,verificationEvents.userId",
    });

    documents.value = records.map((record) => ({
      id: record.id,
      completedAt: record.completedAt,
      orderNumber: `${record.Order_No}`,
      trackingId: record.trackingId,
      handledBy: record.handledBy,
      createdBy: record.createdBy,
      dateCreated: new Date(record.created).toLocaleString(),
      created: record.created,
      status: record.status,
      supplierName: record.supplierName,
      address: record.address,
      tin_ID: record.tin_ID,
      modeofProcurement: record.modeofProcurement,
      deliveryDate: record.deliveryDate,
      verifiedAt: record.verifiedAt, // Store verification timestamp
      verifiedBy: record.verifiedBy,
      verifiedByName:
        record.expand?.verifiedBy?.name ||
        record.expand?.verifiedBy?.email ||
        "System",
      completedAt: record.completedAt, // Store completion timestamp
      updatedAt: record.updatedAt, // Store last updated timestamp
      fileType: "xlsx",

      verificationEvents: record.verificationEvents?.map((event: any) => ({
        type: event.type,
        timestamp: event.timestamp,
        userId: event.userId,
        userName:
          record.expand?.["verificationEvents.userId"]?.find(
            (u: any) => u.id === event.userId
          )?.name ||
          record.expand?.["verificationEvents.userId"]?.find(
            (u: any) => u.id === event.userId
          )?.email ||
          "Unknown",
      })),
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

  const formattedDeliveryDate = deliveryDate.value
    ? new Date(deliveryDate.value).toISOString()
    : "";

  const data = {
    Order_No: poNumber.value,
    trackingId: `seq${Math.floor(Math.random() * 1000000)}`,
    handledBy: "System",
    createdBy: "Admin",
    status: "Pending",
    supplierName: supplierName.value,
    address: address.value,
    tin_ID: tin_ID.value,
    modeofProcurement: modeofProcurement.value,
    deliveryDate: formattedDeliveryDate, // Use the formatted date
  };

  try {
    const record = await pb.collection("Collection_1").create(data);

    documents.value.push({
      id: record.id,
      orderNumber: `${record.Order_No}`,
      trackingId: record.trackingId,
      handledBy: record.handledBy,
      createdBy: record.createdBy,
      dateCreated: new Date(record.created).toLocaleString(),
      status: record.status,
      fileType: "xlsx",
      supplierName: record.supplierName,
      address: record.address,
      tin_ID: record.tin_ID,
      modeofProcurement: record.modeofProcurement,
      deliveryDate: record.deliveryDate
        ? new Date(record.deliveryDate).toLocaleDateString()
        : "",
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
const openModal = async (order: Document) => {
  isOverlayOpen.value = true;
  selectedOrder.value = {
    ...order,
    deliveryDate: order.deliveryDate
      ? new Date(order.deliveryDate).toLocaleDateString()
      : "",
    verifiedAt: order.verifiedAt, // Ensure this is passed
    completedAt: order.completedAt, // Ensure this is passed
  };
  isModalOpen.value = true;

  // if (!refreshInterval.value) {
  //   startPolling();
  // }
};

const closeModal = () => {
  isOverlayOpen.value = false;
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
        "Supplier Name": doc.supplierName,
        "Supplier Address": doc.address,
        "TIN ID": doc.tin_ID,
        "Mode of Procurement": doc.modeofProcurement,
        "Delivery Date": doc.deliveryDate,
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

  // Filter by active button status
  if (activeButton.value === "Completed") {
    filtered = filtered.filter((doc) => doc.status === "Completed");
  } else if (activeButton.value === "Needs Action") {
    filtered = filtered.filter((doc) => doc.status === "Needs Action");
  } else if (activeButton.value === "Pending") {
    filtered = filtered.filter((doc) => doc.status === "Pending");
  } else if (activeButton.value === "Verified") {
    filtered = filtered.filter((doc) => doc.status === "Verified");
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

// For changing document status to "Completed"
const markAsCompleted = async () => {
  if (!selectedOrder.value) return;

  try {
    const completionTimestamp = new Date().toISOString();

    // Update in PocketBase with completion time
    await pb.collection("Collection_1").update(selectedOrder.value.id, {
      status: "Completed",
      completedAt: completionTimestamp,
      updatedAt: completionTimestamp,
    });

    // Update local state
    selectedOrder.value.status = "Completed";
    selectedOrder.value.completedAt = completionTimestamp;
    selectedOrder.value.updatedAt = completionTimestamp;

    // Update in documents array
    const docIndex = documents.value.findIndex(
      (doc) => doc.id === selectedOrder.value?.id
    );
    if (docIndex !== -1) {
      documents.value[docIndex].status = "Completed";
      documents.value[docIndex].completedAt = completionTimestamp;
      documents.value[docIndex].updatedAt = completionTimestamp;
    }
  } catch (error) {
    console.error("Error completing document:", error);
    alert("Failed to complete document. Please try again.");
  }
};

// const for Admin only previews
// Use this to hide admin features from non-admin users
const currentUser = ref<any>(null);

const isAdmin = computed(() => {
  return currentUser.value?.role === "admin";
});

// Fetch current authenticated user from PocketBase
const fetchCurrentUser = async () => {
  try {
    await pb.collection("users").authRefresh();
    currentUser.value = pb.authStore.model;

    // Ensure role exists, default to 'user' if not set
    if (!currentUser.value?.role) {
      currentUser.value = { ...currentUser.value, role: "user" };
    }

    console.log("Current user role:", currentUser.value?.role);
  } catch (error) {
    console.error("Error fetching current user:", error);
    currentUser.value = null;
  }
};

onMounted(() => {
  fetchCurrentUser();
  startPolling();
});

// onUnmounted(() => {
//   stopPolling();
// });
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
          class="text-white"
        >
          <path d="M13.234 20.252 21 12.3" />
          <path
            d="m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486"
          />
        </svg>
        Add Purchasing Order
      </button>

      <!-- Modal Transition -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showModal"
          class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          @click.self="closeModalAdd"
        >
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div
              v-if="showModal"
              class="bg-[#0B132B] p-6 rounded-lg shadow-md w-96 mx-4"
              @click.stop
            >
              <h2 class="text-lg font-semibold mb-4 text-white text-center">
                Enter PO Number
              </h2>

              <div class="space-y-4">
                <div>
                  <label class="block text-gray-400 text-sm mb-1"
                    >Work Order #</label
                  >
                  <input
                    v-model="poNumber"
                    type="text"
                    placeholder="eg. APO2025-2024"
                    class="w-full p-2 border border-gray-600 rounded-md bg-[#1A1F36] text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label class="block text-gray-400 text-sm mb-1"
                    >Supplier Name</label
                  >
                  <input
                    v-model="supplierName"
                    type="text"
                    placeholder="John Doe"
                    class="w-full p-2 border border-gray-600 rounded-md bg-[#1A1F36] text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <!-- Address -->
                <div>
                  <label class="block text-gray-400 text-sm mb-1"
                    >Address</label
                  >
                  <input
                    v-model="address"
                    type="text"
                    placeholder="Legazpi City, Albay"
                    class="w-full p-2 border border-gray-600 rounded-md bg-[#1A1F36] text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <!-- TIN ID -->
                <div>
                  <label class="block text-gray-400 text-sm mb-1">TIN ID</label>
                  <input
                    v-model="tin_ID"
                    type="text"
                    placeholder="716-412-421 VAT"
                    class="w-full p-2 border border-gray-600 rounded-md bg-[#1A1F36] text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <!-- Mode of Procurement -->
                <div>
                  <label class="block text-gray-400 text-sm mb-1"
                    >Mode of Procurement</label
                  >
                  <input
                    v-model="modeofProcurement"
                    type="text"
                    placeholder="Small Value Procurement"
                    class="w-full p-2 border border-gray-600 rounded-md bg-[#1A1F36] text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <!-- Delivery Date -->
                <div>
                  <label class="block text-gray-400 text-sm mb-1"
                    >Delivery Date</label
                  >
                  <input
                    v-model="deliveryDate"
                    type="datetime-local"
                    class="w-full p-2 border border-gray-600 rounded-md bg-[#1A1F36] text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div class="flex justify-end gap-2 mt-6">
                <button
                  @click="closeModalAdd"
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  @click="submitPO"
                  class="px-4 py-2 bg-[#6A5CFE] text-white rounded-md hover:bg-[#7C6CFF] transition-colors"
                >
                  Create Order
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>

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
      <!-- End of Sidebar Buttons -->
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
              <th
                class="p-0 cursor-pointer hover:bg-gray-200"
                @click="toggleSort('orderNumber')"
              >
                <div class="flex items-center gap-1 px-3 py-3">
                  <span>Order #</span>
                  <ChevronsUpDown
                    v-if="sortField !== 'orderNumber'"
                    class="h-4 w-4 text-gray-400"
                  />
                  <ChevronUp
                    v-else-if="sortDirection === 'asc'"
                    class="h-4 w-4 text-gray-600"
                  />
                  <ChevronDown v-else class="h-4 w-4 text-gray-600" />
                </div>
              </th>
              <th
                class="p-0 cursor-pointer hover:bg-gray-200"
                @click="toggleSort('handledBy')"
              >
                <div class="flex items-center gap-1 px-3 py-3">
                  <span>Handled by</span>
                  <ChevronsUpDown
                    v-if="sortField !== 'handledBy'"
                    class="h-4 w-4 text-gray-400"
                  />
                  <ChevronUp
                    v-else-if="sortDirection === 'asc'"
                    class="h-4 w-4 text-gray-600"
                  />
                  <ChevronDown v-else class="h-4 w-4 text-gray-600" />
                </div>
              </th>
              <th
                class="p-0 cursor-pointer hover:bg-gray-200"
                @click="toggleSort('createdBy')"
              >
                <div class="flex items-center gap-1 px-3 py-3">
                  <span>Created by</span>
                  <ChevronsUpDown
                    v-if="sortField !== 'createdBy'"
                    class="h-4 w-4 text-gray-400"
                  />
                  <ChevronUp
                    v-else-if="sortDirection === 'asc'"
                    class="h-4 w-4 text-gray-600"
                  />
                  <ChevronDown v-else class="h-4 w-4 text-gray-600" />
                </div>
              </th>
              <th
                class="p-0 cursor-pointer hover:bg-gray-200"
                @click="toggleSort('dateCreated')"
              >
                <div class="flex items-center gap-1 px-3 py-3">
                  <span>Date Created</span>
                  <ChevronsUpDown
                    v-if="sortField !== 'dateCreated'"
                    class="h-4 w-4 text-gray-400"
                  />
                  <ChevronUp
                    v-else-if="sortDirection === 'asc'"
                    class="h-4 w-4 text-gray-600"
                  />
                  <ChevronDown v-else class="h-4 w-4 text-gray-600" />
                </div>
              </th>
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
              v-for="doc in sortedDocuments"
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
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isModalOpen"
        class="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50"
        @click.self="closeModal"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out transform"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition duration-200 ease-in transform"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <div
            v-if="isModalOpen"
            class="w-96 bg-[#1A1F36] text-white p-6 shadow-lg relative h-screen overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
          >
            <!-- Close Button -->
            <button
              class="absolute top-4 right-4 text-gray-400 hover:text-white"
              @click="closeModal"
            >
              <X />
            </button>

            <!-- Header -->
            <div class="mb-6">
              <h2 class="text-xl font-bold">
                {{ selectedOrder?.orderNumber }}
              </h2>
              <p class="text-sm text-gray-500">Order Details</p>
            </div>

            <!-- Order Details -->
            <div class="space-y-4">
              <div>
                <p class="text-sm text-gray-500">Created at</p>
                <p class="font-medium">{{ selectedOrder?.dateCreated }}</p>
              </div>

              <div>
                <p class="text-sm text-gray-500">Status</p>
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-yellow-100 text-yellow-800':
                      selectedOrder?.status === 'Pending',
                    'bg-green-100 text-green-800':
                      selectedOrder?.status === 'Completed',
                    'bg-red-100 text-red-800':
                      selectedOrder?.status === 'Needs Action',
                    'bg-gray-100 text-gray-800': !selectedOrder?.status,
                  }"
                >
                  {{ selectedOrder?.status || "In progress" }}
                </span>
              </div>
            </div>

            <!-- Supplier Information -->
            <div class="mt-6 border-t pt-4">
              <h3 class="font-semibold mb-2">Supplier Information:</h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <p class="text-gray-500">Supplier Name:</p>
                <p>{{ selectedOrder?.supplierName || "Not set" }}</p>

                <p class="text-gray-500">Address:</p>
                <p>{{ selectedOrder?.address || "Not set" }}</p>

                <p class="text-gray-500">TIN ID:</p>
                <p>{{ selectedOrder?.tin_ID || "Not set" }}</p>

                <p class="text-gray-500">Delivery Date:</p>
                <p>{{ selectedOrder?.deliveryDate || "Not set" }}</p>

                <p class="text-gray-500">Mode of Procurement:</p>
                <p>{{ selectedOrder?.modeofProcurement || "Not set" }}</p>
              </div>
            </div>

            <!-- Timeline -->
            <div v-if="isAllowedRole">
              <Timeline :value="events" align="left" class="left-timeline">
                <template #content="slotProps">
                  <div class="timeline-item">
                    <strong>{{ slotProps.item.title }}</strong>
                    <div>{{ slotProps.item.description }}</div>
                    <small class="text-gray-500">{{
                      slotProps.item.time
                    }}</small>
                  </div>
                </template>
              </Timeline>
            </div>

            <!-- Overlay Timeline Action Buttons -->
            <div class="mt-4">
              <!-- Verify Document Button (only for admins) -->
              <button
                v-if="isAdmin && selectedOrder?.status === 'Pending'"
                @click="verifyDocument"
                class="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg transition-all duration-200 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/50 active:scale-95 active:shadow-blue-500/75 active:bg-blue-700 mr-2"
              >
                Initial Verify
              </button>

              <!-- Supplier Verify Button (only shows when status is Needs Action) -->
              <button
                v-if="
                  currentUser?.role === 'supplier' &&
                  selectedOrder?.status === 'Needs Action'
                "
                @click="verifyDocument"
                class="px-4 py-2 bg-purple-500 text-white font-medium rounded-lg transition-all duration-200 hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95 active:shadow-purple-500/75 active:bg-purple-700 mr-2"
              >
                Acknowledge Verification
              </button>

              <button
                v-if="isAdmin && selectedOrder?.status === 'Verified'"
                @click="verifyDocument"
                class="px-4 py-2 bg-green-500 text-white font-medium rounded-lg transition-all duration-200 hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/50 active:scale-95 active:shadow-green-500/75 active:bg-green-700"
              >
                Final Verify & Complete
              </button>

              <div
                v-if="selectedOrder?.status === 'Completed'"
                class="px-4 py-2 mt-4 bg-gray-200 text-gray-700 font-medium rounded-lg"
              >
                ✓ Document Completed
                <span v-if="selectedOrder.completedAt" class="text-xs block">
                </span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- End of Overlay -->

    <!-- Delete Confirmation Popup -->
    <div
      v-if="showDeleteConfirmation"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeDeletePopup"
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

<style scoped>
.left-timeline {
  margin-top: 20px; /* Adjust this value to control how much it shifts down */
  padding-top: 0;
  margin-left: 0;
  padding-left: 0;
}

.left-timeline .p-timeline-event {
  padding: 0;
  margin: 0 0 1rem 0;
}

.left-timeline .p-timeline-event-opposite {
  display: none !important;
  width: 0 !important;
}

.left-timeline .p-timeline-event-content {
  padding-left: 2 !important;
  margin-left: 2 !important;
}

.timeline-item {
  text-align: left;
  margin-left: 0;
}

.timeline-title {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.timeline-description {
  color: #999;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.timeline-actor {
  color: #2196f3;
}

.timeline-time {
  color: #999;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
:deep(.left-timeline .p-timeline-event-opposite) {
  display: none !important;
  width: 0 !important;
}
:deep(.left-timeline .p-timeline-event-content) {
  padding-left: 2 !important;
  margin-left: 2 !important;
}
</style>
