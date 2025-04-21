<script setup lang="ts">
// import Vite from "../assets/vite.svg";
// import Vue from "../assets/vue.svg";
// import Button from "primevue/button";
// import { defineStore } from "pinia";
import { onMounted, ref, computed, onUnmounted } from "vue";
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
  createdByName?: string; // User's display name (optional)
  lastModifiedBy?: string;
  lastModifiedByName?: string;

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
  updated?: string;
}

//delivery time
const formatDeliveryDateTime = (
  dateString: string | undefined | null
): string | null => {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    const phTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return phTime.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return null;
  }
};
//delivery date restriction for create order
const dateError = ref(false);
const minDeliveryDate = ref(() => {
  const now = new Date();
  // Convert to Philippine time (UTC+8)
  const phTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return phTime.toISOString().slice(0, 16);
});

const validateDeliveryDate = () => {
  if (!deliveryDate.value) {
    dateError.value = false;
    return false;
  }

  const selectedDate = new Date(deliveryDate.value);
  const now = new Date();
  dateError.value = selectedDate <= now;
  return !dateError.value;
};

//lapsed script
const shouldMarkAsLapsed = (doc: {
  deliveryDate: string;
  status: string;
  verificationEvents?: Array<{ type: string; timestamp: string }>;
  updated?: string;
}): boolean => {
  // Skip if already completed
  if (doc.status === "Completed") return false;

  // Skip if document has been updated after delivery date
  const deliveryDate = new Date(doc.deliveryDate);
  const today = new Date();

  // For testing: 1 minute threshold (change to 5 days in production)
  const lapsedThreshold = new Date(deliveryDate.getTime() + 120000); // 1 minute
  // const lapsedThreshold = new Date(deliveryDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

  // Check if we're past the lapse threshold
  if (today <= lapsedThreshold) return false;

  // Check if document is in Pending or Needs Action status
  if (["Pending", "Needs Action"].includes(doc.status)) return true;

  // Default case - no activity since delivery date
  return true;
};

const showPONumberError = ref(false);
const showSupplierError = ref(false);
const showAddressError = ref(false);
const showTinError = ref(false);
const showProcurementError = ref(false);
const showDeliveryDateError = ref(false);
const poNumberCharCount = computed(() => poNumber.value.length);

///////////////////////////////// In your script
// Repeat for other required fields

/////////////////////////////

// Linked Pocketbase
const pb = new PocketBase("http://127.0.0.1:8090");

const searchStore = useSearchStore(); // ✅ Initialize store

// Refresh Table Every Second
// const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null);
const isOverlayOpen = ref(false);
const isOverlayMinimized = ref(false);

const fetchSelectedOrder = async () => {
  if (!selectedOrder.value) return;

  try {
    const record = await pb
      .collection("Collection_1")
      .getOne(selectedOrder.value.id, {
        expand: "verifiedBy,verificationEvents.userId,createdBy",
      });

    // Ensure completedAt is preserved if it was set locally but not saved
    if (selectedOrder.value.status === "Completed" && !record.completedAt) {
      await pb.collection("Collection_1").update(selectedOrder.value.id, {
        completedAt: selectedOrder.value.completedAt,
      });
    }

    // Normalize verification events with expanded user info
    const verificationEvents = record.verificationEvents?.map((event: any) => {
      const user = record.expand?.["verificationEvents.userId"]?.find(
        (u: any) => u.id === event.userId
      );

      return {
        ...event,
        userName: user?.name || user?.email || "System",
      };
    });

    // Convert UTC delivery date to Philippine time
    let phDeliveryDate = "";
    if (record.deliveryDate) {
      const utcDate = new Date(record.deliveryDate);
      const phTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
      phDeliveryDate = phTime.toLocaleDateString();
    }

    selectedOrder.value = {
      ...selectedOrder.value,
      id: record.id,
      orderNumber: `${record.Order_No}`,
      trackingId: record.trackingId || "",
      handledBy: record.handledBy || "Unknown",
      createdBy:
        record.expand?.createdBy?.name ||
        record.createdByName ||
        record.createdBy ||
        "System",
      createdByName: record.expand?.createdBy?.name || record.createdByName,
      dateCreated: new Date(record.created).toLocaleString(),
      status: record.status || "Unknown",
      fileType: record.fileType || "xlsx",
      supplierName: record.supplierName || "Unknown1",
      address: record.address || "Unknown",
      tin_ID: record.tin_ID || "Unknown",
      modeofProcurement: record.modeofProcurement || "Unknown",
      deliveryDate: phDeliveryDate,
      completedAt: record.completedAt || selectedOrder.value.completedAt,
      verifiedAt: record.verifiedAt,
      verifiedBy: record.verifiedBy,
      verifiedByName:
        record.expand?.verifiedBy?.name ||
        record.expand?.verifiedBy?.email ||
        "System",
      updated: record.updated,
      verificationEvents,
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

// const formatDateShort = (dateString: string) => {
//   return new Date(dateString).toLocaleDateString("en-US", {
//     month: "short",
//     day: "numeric",
//   });
// };
// Table Script

//Timeline Script

const editSupplierInfo = async () => {
  if (!selectedOrder.value || !currentUser.value) return;

  try {
    const modifierName =
      currentUser.value?.name || currentUser.value?.email || "System";

    // Create edit event for timeline
    const editEvent = {
      type: "edit",
      timestamp: new Date().toISOString(),
      userId: currentUser.value.id,
      userName: modifierName,
    };

    const updateData = {
      supplierName: selectedOrder.value.supplierName,
      address: selectedOrder.value.address,
      tin_ID: selectedOrder.value.tin_ID,
      modeofProcurement: selectedOrder.value.modeofProcurement,
      deliveryDate: selectedOrder.value.deliveryDate,
      lastModifiedBy: currentUser.value.id,
      lastModifiedByName: modifierName,
      updated: new Date().toISOString(),
      verificationEvents: [
        ...(selectedOrder.value.verificationEvents || []),
        editEvent,
      ],
    };

    await pb
      .collection("Collection_1")
      .update(selectedOrder.value.id, updateData);

    // Update local state
    const docIndex = documents.value.findIndex(
      (doc) => doc.id === selectedOrder.value?.id
    );
    if (docIndex !== -1) {
      documents.value[docIndex] = {
        ...documents.value[docIndex],
        ...updateData,
        verificationEvents: [
          ...(documents.value[docIndex].verificationEvents || []),
          editEvent,
        ],
      };
    }

    // Update selectedOrder
    if (selectedOrder.value) {
      selectedOrder.value = {
        ...selectedOrder.value,
        ...updateData,
        verificationEvents: [
          ...(selectedOrder.value.verificationEvents || []),
          editEvent,
        ],
      };
    }
    await fetchSelectedOrder();
    alert("Supplier information updated successfully!");
  } catch (error) {
    console.error("Error updating supplier information:", error);
    alert("Failed to update supplier information. Please try again.");
  }
};

// const verificationTime = ref<string | null>(null);
// const timelineEvents = ref<
//   Array<{
//     title: string;
//     description: string;
//     time?: string;
//   }>
// >([]);

const isAllowedRole = computed(() => {
  const allowedRoles = ["admin", "user", "supplier"];
  return (
    currentUser.value?.role && allowedRoles.includes(currentUser.value.role)
  );
});

const verifyDocument = async () => {
  if (!selectedOrder.value || !currentUser.value) return;

  const modifierName =
    currentUser.value?.name || currentUser.value?.email || "System";

  try {
    const verificationTimestamp = new Date().toISOString();

    let newStatus = selectedOrder.value.status;
    let verificationType = "";

    const userInfo = {
      userId: currentUser.value.id,
      userName: currentUser.value.name || currentUser.value.email || "System",
    };

    // ADMIN HANDLES ALL VERIFICATION STEPS
    if (selectedOrder.value.status === "Pending") {
      // INITIAL VERIFICATION
      newStatus = "Needs Action";
      verificationType = "initial";
    } else if (selectedOrder.value.status === "Needs Action") {
      // SENT TO SUPPLIER (simulated by admin)
      newStatus = "Verified";
      verificationType = "sent to supplier";
    } else if (selectedOrder.value.status === "Verified") {
      // FINAL VERIFICATION - DOCUMENT COMPLETION
      newStatus = "Completed";
      verificationType = "final";

      const completionTimestamp = new Date().toISOString();

      const updateData = {
        status: "Completed",
        verificationEvents: [
          ...(selectedOrder.value.verificationEvents || []),
          {
            type: "final",
            timestamp: verificationTimestamp,
            ...userInfo,
          },
        ],
        completedAt: verificationTimestamp,
        handledBy: modifierName, // Add this line
        lastModifiedBy: currentUser.value.id,
        lastModifiedByName: modifierName,
        updated: new Date().toISOString(),
        verifiedBy: userInfo.userId,
        verifiedByName: userInfo.userName,
      };

      // Update backend
      await pb
        .collection("Collection_1")
        .update(selectedOrder.value.id, updateData);

      Object.assign(selectedOrder.value, updateData);

      const docIndex = documents.value.findIndex(
        (doc) => doc.id === selectedOrder.value?.id
      );
      if (docIndex !== -1) {
        documents.value[docIndex] = {
          ...documents.value[docIndex],
          ...updateData,
          handledBy: modifierName,
        };
      }

      return;
    }

    // } else if (currentUser.value.role === "supplier") {
    //   if (selectedOrder.value.status === "Needs Action") {
    //     newStatus = "Verified";
    //     verificationType = "acknowledgement";
    //   } else {
    //     return;
    //   }
    // }

    // For non-completion updates
    const verificationEvents = selectedOrder.value.verificationEvents || [];
    verificationEvents.push({
      type: verificationType,
      timestamp: verificationTimestamp,
      ...userInfo,
    });

    const updateData = {
      status: newStatus,
      verificationEvents,
      verifiedAt: verificationTimestamp,
      verifiedBy: userInfo.userId,
      verifiedByName: userInfo.userName,
      updated: verificationTimestamp,
      handledBy: modifierName, // Add this line
      lastModifiedBy: currentUser.value.id, // Add this line
      lastModifiedByName: modifierName, // Add this line
    };

    await pb
      .collection("Collection_1")
      .update(selectedOrder.value.id, updateData);

    Object.assign(selectedOrder.value, updateData);

    const docIndex = documents.value.findIndex(
      (doc) => doc.id === selectedOrder.value?.id
    );
    if (docIndex !== -1) {
      documents.value[docIndex] = {
        ...documents.value[docIndex],
        ...updateData,
        handledBy: modifierName,
      };
    }
  } catch (error) {
    console.error("Error verifying document:", error);
    alert("Failed to verify document. Please try again.");
  }
};

// UNDO Events
const undoVerification = async () => {
  if (!selectedOrder.value || !currentUser.value) return;

  const modifierName =
    currentUser.value?.name || currentUser.value?.email || "System";

  try {
    // Don't allow undo if status is Completed
    if (selectedOrder.value.status === "Completed") {
      alert("Cannot undo completed documents");
      return;
    }

    // Determine previous status based on current status
    let previousStatus = "Pending";
    let undoAction = "";
    if (selectedOrder.value.status === "Verified") {
      previousStatus = "Needs Action";
      undoAction = "Reverted from Verified to Needs Action";
    } else if (selectedOrder.value.status === "Needs Action") {
      previousStatus = "Pending";
      undoAction = "Reverted from Needs Action to Pending";
    }

    const undoTimestamp = new Date().toISOString();
    const userInfo = {
      userId: currentUser.value.id,
      userName: currentUser.value.name || currentUser.value.email || "System",
    };

    // Create undo event with descriptive type
    const undoEvent = {
      type: "undo",
      action: undoAction,
      timestamp: undoTimestamp,
      ...userInfo,
    };

    const updateData = {
      status: previousStatus,
      verificationEvents: [
        ...(selectedOrder.value.verificationEvents || []),
        undoEvent,
      ],

      handledBy: modifierName, // Add this line
      lastModifiedBy: currentUser.value.id,
      lastModifiedByName: modifierName,
      updated: undoTimestamp,
    };

    // Update backend
    await pb
      .collection("Collection_1")
      .update(selectedOrder.value.id, updateData);

    // Update local state
    Object.assign(selectedOrder.value, updateData);

    // Update in documents array
    const docIndex = documents.value.findIndex(
      (doc) => doc.id === selectedOrder.value?.id
    );
    if (docIndex !== -1) {
      documents.value[docIndex] = {
        ...documents.value[docIndex],
        ...updateData,
        handledBy: modifierName,
      };
    }

    console.log("Undo successful, status reverted to:", previousStatus);
  } catch (error) {
    console.error("Error undoing verification:", error);
    alert("Failed to undo verification. Please try again.");
  }
};

// Timeline Events Handler
const events = computed(() => {
  if (!selectedOrder.value) return [];

  const timelineEvents = [
    {
      title: "Document Created",
      description: `Created by ${
        selectedOrder.value.createdByName ||
        selectedOrder.value.createdBy ||
        "System"
      }`,
      time: formatTimestamp(selectedOrder.value.dateCreated),
    },
  ];

  if (selectedOrder.value.verificationEvents) {
    selectedOrder.value.verificationEvents.forEach((event) => {
      timelineEvents.push({
        title: getVerificationTitle(event.type),
        description: `Action by ${event.userName || "Unknown"}`,
        time: formatTimestamp(event.timestamp),
      });
    });
  }

  if (selectedOrder.value.status === "Completed") {
    const completionTime =
      selectedOrder.value.completedAt ||
      selectedOrder.value.verificationEvents?.find((e) => e.type === "final")
        ?.timestamp;

    if (completionTime) {
      timelineEvents.push({
        title: "Document Completed",
        description: `Completed by ${
          selectedOrder.value.verificationEvents?.find(
            (event) => event.type === "final"
          )?.userName || "Unknown"
        }`,
        time: formatTimestamp(completionTime),
      });
    }
  }

  return timelineEvents;
});

// Helper function for verification titles
const getVerificationTitle = (type: string): string => {
  const titleMap: Record<string, string> = {
    initial: "Initial Verification",
    "sent to supplier": "Sent to Supplier",
    final: "Final Verification",
    completed: "Document Completed",
    undo: "Cancelled Verification",
    lapsed: "Document Lapsed",
    edit: "Document Edited",
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

// const completeDocument = async () => {
//   if (!selectedOrder.value) return;

//   // Validation - should never happen in normal flow
//   if (!selectedOrder.value.verifiedAt) {
//     alert("Document must be verified before completion");
//     return;
//   }

//   const completionTimestamp = new Date().toISOString();

//   try {
//     await pb.collection("Collection_1").update(selectedOrder.value.id, {
//       status: "Completed",
//       completedAt: completionTimestamp,
//       updatedAt: completionTimestamp,
//     });

//     // Update all relevant state
//     selectedOrder.value.status = "Completed";
//     selectedOrder.value.completedAt = completionTimestamp;

//     const docIndex = documents.value.findIndex(
//       (d) => d.id === selectedOrder.value?.id
//     );
//     if (docIndex !== -1) {
//       documents.value[docIndex].status = "Completed";
//       documents.value[docIndex].completedAt = completionTimestamp;
//     }
//   } catch (error) {
//     console.error("Completion failed:", error);
//   }
// };

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

const isEditMode = ref(false);
const currentEditingId = ref<string | null>(null);

const openEditModal = (order: Document) => {
  isEditMode.value = true;
  currentEditingId.value = order.id;
  poNumber.value = order.orderNumber;
  supplierName.value = order.supplierName;
  address.value = order.address;
  tin_ID.value = order.tin_ID;
  modeofProcurement.value = order.modeofProcurement;
  
  // Use the already converted Philippine time from selectedOrder
  if (selectedOrder.value?.deliveryDate) {
    const phDate = new Date(selectedOrder.value.deliveryDate);
    deliveryDate.value = phDate.toISOString().slice(0, 16);
  } else {
    deliveryDate.value = "";
  }
  
  showModal.value = true;
  isOverlayMinimized.value = false; // Minimize overlay when edit starts
  isModalOpen.value = false; // Close the main overlay when editing
};

const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString);
  // Convert to Philippine time (UTC+8)
  const phTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return phTime.toISOString().slice(0, 16);
};

// Add PO Document Modal
const openModalAdd = () => {
  showModal.value = true;
};

const closeModalAdd = () => {
  showModal.value = false;
  isEditMode.value = false;
  currentEditingId.value = null;
  poNumber.value = "";
  supplierName.value = "";
  address.value = "";
  tin_ID.value = "";
  modeofProcurement.value = "";
  deliveryDate.value = "";
  isOverlayMinimized.value = false; // Restore overlay when canceling
};

// Code block for fetching data from PocketBase
const fetchDocuments = async () => {
  try {
    const records = await pb.collection("Collection_1").getFullList({
      sort: "-created",
      expand:
        "verifiedAt,completedAt,updated,verifiedBy,verificationEvents.userId,createdBy",
    });

    documents.value = await Promise.all(
      records.map(async (record) => {
        const docData = {
          deliveryDate: record.deliveryDate,
          status: record.status,
          verificationEvents: record.verificationEvents,
          updated: record.updated,
        };

        // Check if document should be marked as lapsed
        let status = record.status;
        if (shouldMarkAsLapsed(docData)) {
          status = "Lapsed";
          // Update in PocketBase if not already marked
          if (record.status !== "Lapsed") {
            try {
              await pb.collection("Collection_1").update(record.id, {
                status: "Lapsed",
                updated: new Date().toISOString(),
              });
            } catch (error) {
              console.error("Error updating document status:", error);
            }
          }
        }

        return {
          id: record.id,
          completedAt: record.completedAt,
          orderNumber: `${record.Order_No}`,
          trackingId: record.trackingId,

          handledBy:
            record.expand?.lastModifiedBy?.name ||
            record.lastModifiedByName ||
            record.expand?.verifiedBy?.name ||
            record.expand?.createdBy?.name ||
            record.createdByName ||
            record.createdBy ||
            "Unknown",
          createdBy:
            record.expand?.createdBy?.name ||
            record.createdByName ||
            record.createdBy ||
            "System",

          createdByName: record.expand?.createdBy?.name || record.createdByName,
          dateCreated: record.created, // Store ISO string
          created: record.created,
          status: record.status,
          supplierName: record.supplierName,
          address: record.address,
          tin_ID: record.tin_ID,
          modeofProcurement: record.modeofProcurement,
          deliveryDate: record.deliveryDate,
          verifiedAt: record.verifiedAt,
          verifiedBy: record.verifiedBy,
          verifiedByName:
            record.expand?.verifiedBy?.name ||
            record.expand?.verifiedBy?.email ||
            "System",
          updated: record.updated,
          fileType: "xlsx",
          verificationEvents: record.verificationEvents?.map((event: any) => ({
            type: event.type,
            timestamp: event.timestamp,
            userId: event.userId,
            userName: event.userName,
          })),
        };
      })
    );
  } catch (error) {
    console.error("Error fetching documents:", error);
    alert("Failed to load documents. Please try again.");
  }
};

// Submit PO to Database
const submitPO = async () => {
  //reset validation first
  if (!validateDeliveryDate()) {
    alert("Error: Delivery date must be in the future");
    return;
  }
  // Reset all errors first
  showPONumberError.value = false;
  showSupplierError.value = false;
  showAddressError.value = false;
  showTinError.value = false;
  showProcurementError.value = false;
  showDeliveryDateError.value = false;

  // Validate all fields
  let isValid = true;

  if (!poNumber.value.trim() || poNumber.value.length > 50) {
    showPONumberError.value = true;
    isValid = false;
  }

  if (!supplierName.value.trim()) {
    showSupplierError.value = true;
    isValid = false;
  }

  if (!address.value.trim()) {
    showAddressError.value = true;
    isValid = false;
  }

  if (!tin_ID.value.trim()) {
    showTinError.value = true;
    isValid = false;
  }

  if (!modeofProcurement.value.trim()) {
    showProcurementError.value = true;
    isValid = false;
  }

  if (!deliveryDate.value) {
    showDeliveryDateError.value = true;
    isValid = false;
  }

  if (!isValid) {
    return; // Stop if validation fails
  }

  // Convert Philippine time back to UTC before saving to PocketBase
  const phDate = new Date(deliveryDate.value);
  const utcDate = new Date(phDate.getTime() - 8 * 60 * 60 * 1000);
  const formattedDeliveryDate = utcDate.toISOString();

  // Get current user info
  const creatorId = currentUser.value?.id || "system";
  const creatorName =
    currentUser.value?.name || currentUser.value?.email || "System";

  const modifierId = currentUser.value?.id || "system";
  const modifierName =
    currentUser.value?.name || currentUser.value?.email || "System";

  const data = {
    Order_No: poNumber.value,
    supplierName: supplierName.value,
    address: address.value,
    tin_ID: tin_ID.value,
    modeofProcurement: modeofProcurement.value,
    deliveryDate: formattedDeliveryDate,
    updated: new Date().toISOString(),
    createdBy: creatorId, // Store user ID
    createdByName: creatorName, // Store user name/email
  };

  try {
    if (isEditMode.value && currentEditingId.value) {
      await pb.collection("Collection_1").update(currentEditingId.value, data);
      const record = await pb
        .collection("Collection_1")
        .update(currentEditingId.value, data);
      const docIndex = documents.value.findIndex(
        (doc) => doc.id === currentEditingId.value
      );
      if (docIndex !== -1) {
        documents.value[docIndex] = {
          ...documents.value[docIndex],
          ...data,
          deliveryDate: formattedDeliveryDate
            ? new Date(formattedDeliveryDate).toLocaleDateString()
            : "",
        };
      }
      if (selectedOrder.value?.id === currentEditingId.value) {
        selectedOrder.value = {
          ...selectedOrder.value,
          ...data,
          deliveryDate: formattedDeliveryDate
            ? new Date(formattedDeliveryDate).toLocaleDateString()
            : "",
        };
      }
    } else {
      // Create new document
      const record = await pb.collection("Collection_1").create({
        ...data,
        trackingId: `seq${Math.floor(Math.random() * 1000000)}`,
        handledBy: creatorName,
        status: "Pending",
      });

      // Convert the delivery date to Philippine time for immediate display
      const phDeliveryDate = new Date(phDate.getTime() + 8 * 60 * 60 * 1000).toLocaleDateString();

      documents.value.push({
        id: record.id,
        orderNumber: `${record.Order_No}`,
        trackingId: record.trackingId,
        handledBy: record.handledBy,
        createdBy: creatorName,
        createdByName: creatorName,
        dateCreated: new Date(record.created).toLocaleString(),
        status: record.status,
        fileType: "xlsx",
        supplierName: record.supplierName,
        address: record.address,
        tin_ID: record.tin_ID,
        modeofProcurement: record.modeofProcurement,
        deliveryDate: phDeliveryDate,
      });
    }

    closeModalAdd();
    isOverlayMinimized.value = false;
  } catch (error) {
    console.error("Error:", error);
    alert(`Failed to ${isEditMode.value ? "update" : "create"} order.`);
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
    id: order.id,
    orderNumber: order.orderNumber,
    trackingId: order.trackingId,
    handledBy: order.handledBy,
    createdBy: order.createdBy,
    dateCreated: order.dateCreated,
    status: order.status,
    supplierName: order.supplierName,
    address: order.address,
    tin_ID: order.tin_ID,
    modeofProcurement: order.modeofProcurement,
    deliveryDate: order.deliveryDate || "", // Keep as ISO string
    verifiedAt: order.verifiedAt,
    completedAt: order.completedAt,
    verificationEvents: order.verificationEvents || [],
    fileType: order.fileType || "xlsx",
    updated: order.updated,
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
// const selectAll = ref(false);
const selectedDocuments = ref<string[]>([]);

// Check if all checkboxes are selected
const areAllSelected = computed(() => {
  const filteredIds = filteredDocuments.value.map((doc) => doc.id);
  return (
    filteredIds.length > 0 &&
    filteredIds.every((id) => selectedDocuments.value.includes(id))
  );
});

// const toggleSelection = (id: string) => {
//   // Changed parameter type
//   const index = selectedDocuments.value.indexOf(id);
//   if (index > -1) {
//     selectedDocuments.value.splice(index, 1);
//   } else {
//     selectedDocuments.value.push(id);
//   }
// };

const toggleAllSelection = () => {
  const filteredIds = filteredDocuments.value.map((doc) => doc.id);
  const shouldSelectAll = !areAllSelected.value;

  if (shouldSelectAll) {
    // Add all filtered documents to selection
    selectedDocuments.value = [
      ...new Set([...selectedDocuments.value, ...filteredIds]),
    ];
  } else {
    // Remove all filtered documents from selection
    selectedDocuments.value = selectedDocuments.value.filter(
      (id) => !filteredIds.includes(id)
    );
  }
};

// Watch for individual checkbox changes and update "Select All" state
// watch(selectedDocuments, (newVal) => {
//   selectAll.value = newVal.length === documents.value.length; // If all are selected, check header
// });

//Download Function
// const selectedOverlayDocuments = ref<string[]>([]);

// const toggleOverlaySelection = (id: string) => {
//   // Changed parameter type
//   const index = selectedOverlayDocuments.value.indexOf(id);
//   if (index > -1) {
//     selectedOverlayDocuments.value.splice(index, 1);
//   } else {
//     selectedOverlayDocuments.value.push(id);
//   }
// };

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
  if (currentUser.value?.role === "user") {
    alert("You don't have permission to delete documents.");
    return;
  }

  if (selectedDocuments.value.length > 0) {
    documentsToDelete.value = [...selectedDocuments.value];
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
  if (currentUser.value?.role === "user") {
    alert("You don't have permission to delete documents.");
    return;
  }

  if (selectedDocuments.value.length === 0) {
    alert("No documents selected for deletion.");
    return;
  }

  try {
    const deletePromises = documentsToDelete.value.map((id) =>
      pb.collection("Collection_1").delete(id)
    );

    await Promise.all(deletePromises);

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
// const handleCheckboxChange = (id: string) => {
//   // Changed parameter type
//   toggleSelection(id);
//   toggleOverlaySelection(id);
// };

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
    // Show both Pending and Verified documents
    filtered = filtered.filter(
      (doc) => doc.status === "Pending" || doc.status === "Verified"
    );
  } else if (activeButton.value === "Lapsed") {
    filtered = filtered.filter((doc) => doc.status === "Lapsed");
  }

  return filtered;
});

// Computed property: Count documents by status
const statusCounts = computed(() => {
  return documents.value.reduce((acc, doc) => {
    // Group Pending and Verified together for the Pending count
    if (doc.status === "Pending" || doc.status === "Verified") {
      acc.Pending = (acc.Pending || 0) + 1;
    }
    // Keep other statuses separate
    if (doc.status !== "Pending" && doc.status !== "Verified") {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
});

// For changing document status to "Completed"
// const markAsCompleted = async () => {
//   if (!selectedOrder.value) return;

//   try {
//     const completionTimestamp = new Date().toISOString();

//     // Update in PocketBase with completion time
//     await pb.collection("Collection_1").update(selectedOrder.value.id, {
//       status: "Completed",
//       completedAt: completionTimestamp,
//       updatedAt: completionTimestamp,
//     });

//     // Update local state
//     selectedOrder.value.status = "Completed";
//     selectedOrder.value.completedAt = completionTimestamp;
//     selectedOrder.value.updatedAt = completionTimestamp;

//     // Update in documents array
//     const docIndex = documents.value.findIndex(
//       (doc) => doc.id === selectedOrder.value?.id
//     );
//     if (docIndex !== -1) {
//       documents.value[docIndex].status = "Completed";
//       documents.value[docIndex].completedAt = completionTimestamp;
//       documents.value[docIndex].updatedAt = completionTimestamp;
//     }
//   } catch (error) {
//     console.error("Error completing document:", error);
//     alert("Failed to complete document. Please try again.");
//   }
// };

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

// Add this to your script section
const now = ref(new Date());
const newDocumentThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds

// Update the current time every minute
const updateNow = () => {
  now.value = new Date();
};
const nowInterval = setInterval(updateNow, 60000);

onUnmounted(() => {
  clearInterval(nowInterval);
});

// Computed property to check if a document is new
const isNewDocument = (doc: Document) => {
  if (!doc.dateCreated) return false;
  try {
    const created = new Date(doc.dateCreated);
    const nowTime = now.value.getTime();
    const createdTime = created.getTime();
    return nowTime - createdTime < newDocumentThreshold;
  } catch (error) {
    console.error("Invalid date:", doc.dateCreated, error);
    return false;
  }
};

// onUnmounted(() => {
//   stopPolling();
// });
</script>

<template>
  <body class="bg-[#0A0E1A] flex flex-grow p-4">
    <!-- Add PO Document Button -->
    <div class="sidebar w-64 bg-[#0A0E1A] text-white mr-4 rounded-lg">
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
                {{
                  isEditMode ? "Edit Supplier Information" : "Enter PO Number"
                }}
                <!-- Enter PO Number -->
              </h2>

              <div class="space-y-4">
                <!-- PO Number Field (Required + 50 char limit) -->
                <div>
                  <label class="block text-gray-400 text-sm mb-1">
                    Work Order # <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="poNumber"
                    type="text"
                    placeholder="eg. APO2025-2024"
                    maxlength="50"
                    required
                    class="w-full p-2 border border-gray-600 rounded-md bg-[#1A1F36] text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    :class="{ 'border-red-500': showPONumberError }"
                  />
                  <p v-if="showPONumberError" class="text-red-500 text-xs mt-1">
                    PO Number is required (max 50 characters)
                  </p>
                  <p class="text-gray-500 text-xs mt-1">
                    {{ poNumber.length }}/50 characters
                  </p>
                </div>

                <div>
                  <label class="block text-gray-400 text-sm mb-1">
                    Supplier Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="supplierName"
                    type="text"
                    placeholder="John Pork"
                    required
                    class="w-full p-2 border border-gray-600 rounded-md bg-[#1A1F36] text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    :class="{ 'border-red-500': showSupplierError }"
                  />
                  <p v-if="showSupplierError" class="text-red-500 text-xs mt-1">
                    Supplier Name is required
                  </p>
                </div>

                <!-- Address -->
                <div>
                  <label class="block text-gray-400 text-sm mb-1"
                    >Address<span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="address"
                    type="text"
                    placeholder="Legazpi City, Albay"
                    class="w-full p-2 border border-gray-600 rounded-md bg-[#1A1F36] text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    :class="{ 'border-red-500': showSupplierError }"
                  />
                  <p v-if="showSupplierError" class="text-red-500 text-xs mt-1">
                    Address is required
                  </p>
                </div>

                <!-- TIN ID -->
                <div>
                  <label class="block text-gray-400 text-sm mb-1"
                    >TIN ID<span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="tin_ID"
                    type="text"
                    placeholder="716-412-421 VAT"
                    class="w-full p-2 border border-gray-600 rounded-md bg-[#1A1F36] text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    :class="{ 'border-red-500': showSupplierError }"
                  />
                  <p v-if="showSupplierError" class="text-red-500 text-xs mt-1">
                    TIN ID is required
                  </p>
                </div>

                <!-- Mode of Procurement -->
                <div>
                  <label class="block text-gray-400 text-sm mb-1"
                    >Mode of Procurement<span class="text-red-500"
                      >*</span
                    ></label
                  >
                  <input
                    v-model="modeofProcurement"
                    type="text"
                    placeholder="Small Value Procurement"
                    class="w-full p-2 border border-gray-600 rounded-md bg-[#1A1F36] text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    :class="{ 'border-red-500': showSupplierError }"
                  />
                  <p v-if="showSupplierError" class="text-red-500 text-xs mt-1">
                    Mode of Procurement is required
                  </p>
                </div>

                <!-- Delivery Date -->
                <div>
                  <label class="block text-gray-400 text-sm mb-1">
                    Delivery Date<span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="deliveryDate"
                    type="datetime-local"
                    :min="minDeliveryDate"
                    class="w-full p-2 border border-gray-600 rounded-md bg-[#1A1F36] text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    :class="{
                      'border-red-500': showDeliveryDateError || dateError,
                    }"
                    @change="validateDeliveryDate"
                  />
                  <p
                    v-if="showDeliveryDateError"
                    class="text-red-500 text-xs mt-1"
                  >
                    Delivery date is required
                  </p>
                  <p v-if="dateError" class="text-red-500 text-xs mt-1">
                    Delivery date must be in the future
                  </p>
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
                  {{ isEditMode ? "Update Order" : "Create Order" }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>

      <!--Sidebar Buttons-->
      <div class="sidebar-buttons mt-4 space-y-2">
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
          <span class="flex items-center gap-2 sidebar-button-content">
            <File />
            <span class="sidebar-button-text">All</span>
          </span>
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

        <!-- Needs Action -->
        <div
          @click="setActive('Needs Action')"
          class="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:translate-x-2"
          :class="
            activeButton === 'Needs Action'
              ? 'bg-[#2E3347] text-yellow-400'
              : 'text-yellow-400 hover:bg-[#2E3347]'
          "
        >
          <span class="flex items-center gap-2"><User /> Needs Action</span>
          <span class="text-white">{{
            statusCounts["Needs Action"] || 0
          }}</span>
        </div>

        <!-- Lapsed -->
        <div
          @click="setActive('Lapsed')"
          class="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:translate-x-2"
          :class="
            activeButton === 'Lapsed'
              ? 'bg-[#2E3347] text-red-500'
              : 'text-red-500 hover:bg-[#2E3347]'
          "
        >
          <span class="flex items-center gap-2"><TriangleAlert /> Lapsed</span>
          <span class="text-white">{{ statusCounts.Lapsed || 0 }}</span>
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
          :disabled="currentUser?.role === 'user'"
          :class="{
            'opacity-50 cursor-not-allowed': currentUser?.role === 'user',
            'hover:bg-red-500': currentUser?.role !== 'user',
          }"
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
              <!-- Checkbox Column -->
              <th class="w-12 p-3 text-left">
                <input
                  type="checkbox"
                  class="w-10 h-4"
                  :checked="areAllSelected"
                  @change="toggleAllSelection"
                />
              </th>

              <!-- Order # Column -->
              <th
                class="p-3 text-left cursor-pointer min-w-[120px]"
                @click="toggleSort('orderNumber')"
              >
                <div class="flex items-center gap-1">
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

              <!-- Handled By Column -->
              <th
                class="p-3 text-left cursor-pointer min-w-[120px]"
                @click="toggleSort('handledBy')"
              >
                <div class="flex items-center gap-1">
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

              <!-- Created By Column -->
              <th
                class="p-3 text-left cursor-pointer min-w-[120px]"
                @click="toggleSort('createdBy')"
              >
                <div class="flex items-center gap-1">
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

              <!-- Date Created Column -->
              <th
                class="p-3 text-left cursor-pointer min-w-[150px]"
                @click="toggleSort('dateCreated')"
              >
                <div class="flex items-center gap-1">
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

      <!-- Table Body -->
      <div
        class="border border-t-0 rounded-b-lg overflow-auto w-full max-h-[450px]"
      >
        <table class="w-full border-collapse bg-white">
          <tbody>
            <tr
              v-for="doc in sortedDocuments"
              :key="doc.id"
              class="border-b hover:bg-gray-200 text-sm relative"
            >
              <!-- New document indicator (absolute positioned dot) -->

              <!-- Checkbox Cell -->
              <td class="w-12 p-3 text-left relative">
                <input
                  type="checkbox"
                  class="w-10 h-4"
                  :value="doc.id"
                  v-model="selectedDocuments"
                />
                <div v-if="isNewDocument(doc)"></div>
              </td>

              <!-- Order # Cell -->
              <td class="p-3 text-left min-w-[120px]">
                <a
                  href="#"
                  class="text-blue-600 hover:underline"
                  @click.prevent="openModal(doc)"
                >
                  {{ doc.orderNumber }}
                  <!-- New badge next to order number -->
                  <span
                    v-if="isNewDocument(doc)"
                    class="ml-2 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    New
                  </span>
                </a>
                <div class="text-xs text-gray-500">{{ doc.trackingId }}</div>
              </td>

              <!-- Handled By Cell -->
              <td class="p-3 text-left min-w-[120px]">
                {{ doc.handledBy }}
                <div v-if="doc.updated" class="text-xs text-gray-500"></div>
              </td>

              <!-- Created By Cell -->
              <td class="p-3 text-left min-w-[120px]">{{ doc.createdBy }}</td>

              <!-- Date Created Cell -->
              <td class="p-3 text-left min-w-[150px]">
                {{ new Date(doc.dateCreated).toLocaleString() }}
              </td>
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
            :class="[
              'bg-[#1A1F36] text-white p-6 shadow-lg relative h-screen overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden',
              isOverlayMinimized ? 'w-16' : 'w-96',
            ]"
          >
            <!-- Close Button (Visible only when not minimized) -->
            <button
              v-if="!isOverlayMinimized"
              class="absolute top-4 right-4 text-gray-400 hover:text-white"
              @click="closeModal"
            >
              <X />
            </button>

            <!-- Content (Hidden when minimized) -->
            <div v-if="!isOverlayMinimized" class="space-y-6">
              <!-- Header -->
              <div class="mb-6 wrap-text">
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
                      'bg-blue-100 text-blue-500':
                        selectedOrder?.status === 'Verified',
                      'bg-green-100 text-green-800':
                        selectedOrder?.status === 'Completed',
                      'bg-red-100 text-red-800':
                        selectedOrder?.status === 'Needs Action' ||
                        selectedOrder?.status === 'Lapsed',
                      'bg-gray-100 text-gray-800': !selectedOrder?.status,
                    }"
                  >
                    {{ selectedOrder?.status || "In progress" }}
                  </span>
                </div>
              </div>

              <!-- Supplier Information -->
              <div class="mt-6 border-t pt-4" v-if="selectedOrder">
                <div class="flex justify-between items-center mb-2">
                  <h3 class="font-semibold">Supplier Information:</h3>
                  <button
                    @click="openEditModal(selectedOrder)"
                    class="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      ></path>
                      <path
                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      ></path>
                    </svg>
                    Edit
                  </button>
                </div>

                <div class="grid grid-cols-2 gap-2 text-sm">
                  <p class="text-gray-500">Supplier Name:</p>
                  <p>{{ selectedOrder?.supplierName || "Not set" }}</p>
                  <p class="text-gray-500">Address:</p>
                  <p>{{ selectedOrder?.address || "Not set" }}</p>
                  <p class="text-gray-500">TIN ID:</p>
                  <p>{{ selectedOrder?.tin_ID || "Not set" }}</p>
                  <p class="text-gray-500">Mode of Procurement:</p>
                  <p>{{ selectedOrder?.modeofProcurement || "Not set" }}</p>
                  <p class="text-gray-500">Delivery Date:</p>
                  <p>
                    {{
                      formatDeliveryDateTime(selectedOrder?.deliveryDate) ||
                      "Not set"
                    }}
                  </p>
                </div>
              </div>

              <!-- Timeline -->
              <div v-if="isAllowedRole">
                <Timeline :value="events" align="left" class="left-timeline">
                  <template #content="slotProps">
                    <div class="timeline-item">
                      <strong>{{ slotProps.item.title }}</strong>
                      <div v-if="slotProps.item.action">
                        {{ slotProps.item.action }}
                      </div>
                      <div>{{ slotProps.item.description }}</div>
                      <small class="text-gray-500">{{
                        slotProps.item.time
                      }}</small>
                    </div>
                  </template>
                </Timeline>
              </div>

              <!-- Overlay Timeline Action Buttons -->
              <div class="mt-4 flex flex-wrap gap-2">
                <template v-if="isAdmin">
                  <div
                    v-if="selectedOrder?.status === 'Pending'"
                    class="flex gap-2"
                  >
                    <button
                      @click="verifyDocument"
                      class="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg transition-all duration-200 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/50 active:scale-95 active:shadow-blue-500/75 active:bg-blue-700"
                    >
                      Initial Verify
                    </button>
                  </div>

                  <div
                    v-if="selectedOrder?.status === 'Needs Action'"
                    class="flex gap-2"
                  >
                    <button
                      @click="verifyDocument"
                      class="px-4 py-2 bg-purple-500 text-white font-medium rounded-lg transition-all duration-200 hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95 active:shadow-purple-500/75 active:bg-purple-700"
                    >
                      Mark as Sent to Supplier
                    </button>
                    <button
                      @click="undoVerification"
                      class="px-4 py-2 bg-gray-500 text-white font-medium rounded-lg transition-all duration-200 hover:bg-gray-600 hover:shadow-lg hover:shadow-gray-500/50 active:scale-95 active:shadow-gray-500/75 active:bg-gray-700"
                    >
                      Undo
                    </button>
                  </div>

                  <div
                    v-if="selectedOrder?.status === 'Verified'"
                    class="flex gap-2"
                  >
                    <button
                      @click="verifyDocument"
                      class="px-4 py-2 bg-green-500 text-white font-medium rounded-lg transition-all duration-200 hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/50 active:scale-95 active:shadow-green-500/75 active:bg-green-700"
                    >
                      Mark as Received & Verified
                    </button>
                    <button
                      @click="undoVerification"
                      class="px-4 py-2 bg-gray-500 text-white font-medium rounded-lg transition-all duration-200 hover:bg-gray-600 hover:shadow-lg hover:shadow-gray-500/50 active:scale-95 active:shadow-gray-500/75 active:bg-gray-700"
                    >
                      Undo
                    </button>
                  </div>
                </template>

                <div
                  v-if="selectedOrder?.status === 'Completed'"
                  class="px-4 py-2 mt-4 bg-gray-200 text-gray-700 font-medium rounded-lg"
                >
                  ✓ Document Completed
                </div>
              </div>
            </div>

            <!-- Minimized State (Optional Icon or Indicator) -->
            <div v-else class="flex items-center justify-center h-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-gray-400"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
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
            :disabled="currentUser?.role === 'user'"
            :class="{
              'opacity-50 cursor-not-allowed': currentUser?.role === 'user',
              'hover:bg-red-700': currentUser?.role !== 'user',
            }"
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
/* Add to your style section */
table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th,
td {
  padding: 12px 16px;
  text-align: left;
  vertical-align: left;
}

th:last-child,
td:last-child {
  border-right: none;
}

/* Make sure the checkbox column doesn't shift */
th:first-child,
td:first-child {
  width: 100px; /* Fixed width for checkbox column */
  padding-left: px; /* Consistent padding */
  vertical-align: left;
  border-bottom: 1px solid #e5e7eb;
  word-wrap: break-word; /* Ensure long words break */
  overflow: hidden; /* Hide overflow */
}

th:first-child,
td:first-child {
  width: 100px; /* Reduced width for checkbox */
  padding-left: 12px;
  padding-right: 0;
}

/* 
Add subtle hover effect
tr:hover td {
  background-color: #f9fafb;
} */

th:nth-child(2),
td:nth-child(2) {
  width: 25%;
} /* Order # */
th:nth-child(3),
td:nth-child(3) {
  width: 25%;
} /* Handled by */
th:nth-child(4),
td:nth-child(4) {
  width: 25%;
} /* Created by */
th:nth-child(4),
td:nth-child(4) {
  width: 20%;
} /* Date Created */

/* etc */

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* For multi-line text that should wrap */
.wrap-text {
  white-space: normal;
  word-break: break-word;
}

/* Table header styling */
thead tr {
  background-color: #f3f4f6;
  position: sticky;
  top: 0;
}

/* Table body styling */
tbody tr:hover {
  background-color: #f9fafb;
}

/* Sidebar container */
.sidebar {
  width: 250px; /* Fixed width */
  min-width: 250px; /* Prevent shrinking */
  overflow: hidden; /* Contain overflow */
}

/* Sidebar buttons */
.sidebar-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap; /* Keep text in single line */
}

/* Count badge */
.sidebar-count {
  flex-shrink: 0; /* Prevent count from being squeezed */
  margin-left: 0.5rem;
}

.sidebar-button-content {
  display: flex;
  align-items: center;
  min-width: 0; /* Allows truncation to work */
}

.sidebar-button-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
