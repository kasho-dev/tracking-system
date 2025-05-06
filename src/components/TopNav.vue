<script setup lang="ts">
import { useSearchStore } from "../stores/searchStore";
import { Toolbar } from "primevue";
import PocketBase from 'pocketbase';
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Settings, LogOut, LayoutDashboard, Bell, Check, X, CheckCircle2, AlertTriangle, Clock, AlertCircle, CheckCircle, ArrowUpCircle, Trash, File, FileEdit } from 'lucide-vue-next';

const pb = new PocketBase('http://127.0.0.1:8090');
const searchStore = useSearchStore();
const router = useRouter();
const route = useRoute();

// User avatar URL
const userAvatarUrl = computed(() => {
  if (pb.authStore.model?.avatar) {
    return pb.files.getUrl(pb.authStore.model, pb.authStore.model.avatar);
  }
  return null;
});

// Check if current route is login page
const isLoginPage = computed(() => route.path === '/login');

// Check if current route is signup page
const isSignupPage = computed(() => route.path === '/signup');

// Check if current route is settings page
const isSettingsPage = computed(() => route.path === '/settings');

// Check if current route is dashboard/home page
const isDashboardPage = computed(() => route.path === '/home');

// Check authentication status
const isAuthenticated = computed(() => pb.authStore.isValid);

// Only show nav when authenticated AND not on login or signup pages
const showNav = computed(() => isAuthenticated.value && !isLoginPage.value && !isSignupPage.value);

// Only show search when not on settings page
const showSearch = computed(() => !isSettingsPage.value);

// User dropdown state
const isDropdownOpen = ref(false);
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

// Close dropdown when clicking outside
const closeDropdown = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.user-icon')) {
    isDropdownOpen.value = false;
  }
};

// Handle logout
const handleLogout = async () => {
  try {
    // Clear all auth data
    pb.authStore.clear();
    localStorage.removeItem('pocketbase_auth');
    sessionStorage.removeItem('pocketbase_auth');
    localStorage.removeItem('remembered_user');
    
    // Close dropdown
    isDropdownOpen.value = false;
    
    // Force redirect to login page
    window.location.replace('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

// Handle navigation to dashboard/home
const navigateToDashboard = () => {
  router.push('/home');
  isDropdownOpen.value = false;
};

// Handle settings navigation
const navigateToSettings = () => {
  router.push('/settings');
  isDropdownOpen.value = false;
};

// Notification system
const notifications = ref<any[]>([]);
const isNotificationOpen = ref(false);
const unreadCount = ref(0);

// Add notification display limit variables
const notificationDisplayLimit = ref(20);
const incrementNotificationsBy = 20;
const isLoadingMoreNotifications = ref(false);

// Add animation state for notification counter
const shouldAnimate = ref(false);

// Function to trigger notification counter animation
const triggerCounterAnimation = () => {
  shouldAnimate.value = true;
  setTimeout(() => {
    shouldAnimate.value = false;
  }, 300); // Animation duration
};

// Add this computed property to control counter visibility
const showNotificationCounter = computed(() => {
  return unreadCount.value > 0 && !isNotificationOpen.value;
});

// Update the subscription handler to consider dropdown state
onMounted(() => {
  // TEMPORARY TEST NOTIFICATIONS - TO BE REMOVED
  notifications.value = [
    {
      id: 'test1',
      orderNo: 'APO-001',
      message: 'has been created and is pending review.',
      timestamp: new Date().toISOString(),
      isNew: true,
      viewed: false,
      status: 'Pending'
    },
    {
      id: 'test2',
      orderNo: 'APO-002',
      message: 'needs action.',
      timestamp: new Date().toISOString(),
      viewed: false,
      status: 'Needs Action'
    },
    {
      id: 'test3',
      orderNo: 'APO-003',
      message: 'has been edited.',
      timestamp: new Date().toISOString(),
      viewed: false,
      status: 'Pending'
    },
    {
      id: 'test4',
      orderNo: 'APO-004',
      message: 'has been verified.',
      timestamp: new Date().toISOString(),
      viewed: false,
      status: 'Verified'
    },
    {
      id: 'test5',
      orderNo: 'APO-005',
      message: 'has been completed and verified.',
      timestamp: new Date().toISOString(),
      viewed: false,
      status: 'Completed'
    },
    {
      id: 'test6',
      orderNo: 'APO-006',
      message: 'has lapsed.',
      timestamp: new Date().toISOString(),
      viewed: false,
      status: 'Lapsed'
    },
    {
      id: 'test7',
      orderNo: 'APO-007',
      message: 'will fully lapse in 2 days.',
      timestamp: new Date().toISOString(),
      viewed: false,
      status: 'Pending'
    },
    {
      id: 'test8',
      orderNo: 'APO-008',
      message: 'has been extended.',
      timestamp: new Date().toISOString(),
      viewed: false,
      status: 'Extended'
    },
    {
      id: 'test9',
      orderNo: 'APO-009',
      message: 'has been deleted.',
      timestamp: new Date().toISOString(),
      viewed: false,
      status: 'Deleted',
      deleted: true,
      deletedBy: 'Admin User',
      deletedDate: new Date().toISOString()
    }
  ];

  // Set unread count
  unreadCount.value = notifications.value.length;

  // Subscribe to real-time updates for Collection_1
  pb.collection('Collection_1').subscribe('*', async (e) => {
    const record = e.record;
    let shouldUpdateCounter = false;
    
    // Handle record updates
    if (e.action === 'create') {
      // New document created
      notifications.value.unshift({
        id: record.id,
        orderNo: record.Order_No,
        message: 'has been created and is pending review.',
        timestamp: record.created,
        createdBy: record.createdByName || record.expand?.createdBy?.name || 'System',
        isNew: true,
        viewed: false,
        status: record.status
      });
      shouldUpdateCounter = !isNotificationOpen.value;
    } else if (e.action === 'update') {
      // Document updated - check for status changes, etc.
      const existingNotificationIndex = notifications.value.findIndex(n => n.id === record.id);
      const oldNotification = notifications.value[existingNotificationIndex];
      
      if (existingNotificationIndex !== -1) {
        const message = formatNotificationMessage(record);
        if (message) {
          notifications.value[existingNotificationIndex] = {
            id: record.id,
            orderNo: record.Order_No,
            message,
            isModified: hasOrderBeenModified(record),
            timestamp: record.updated,
            viewed: isNotificationOpen.value, // Mark as viewed if dropdown is open
            status: record.status,
            lastAction: record.updated || record.created
          };
          shouldUpdateCounter = !isNotificationOpen.value;
        }
      }
    } else if (e.action === 'delete') {
      // Document deleted
      notifications.value = notifications.value.filter(n => n.id !== record.id);
      shouldUpdateCounter = !isNotificationOpen.value;
    }
    
    // Update unread count and trigger animation if needed
    if (shouldUpdateCounter) {
      unreadCount.value = notifications.value.filter(n => !n.viewed).length;
      triggerCounterAnimation();
    }
  });

  document.addEventListener('click', closeNotification, true);
  document.addEventListener('click', closeDropdown);
  
  // Comment out the initial fetch since we're using test data
  // updateNotifications();
});

onBeforeUnmount(() => {
  // Unsubscribe from real-time updates
  pb.collection('Collection_1').unsubscribe();
  document.removeEventListener('click', closeNotification, true);
  document.removeEventListener('click', closeDropdown);
});

// Function to format notification message
const formatNotificationMessage = (order: any) => {
  if (order.deleted) {
    return 'has been deleted.';
  }

  // Check for edit events first
  const hasEditEvent = order.verificationEvents?.some((event: any) => 
    event.type === 'modify' || event.type === 'edit'
  );
  if (hasEditEvent) {
    return 'has been edited.';
  }

  const status = order.status;
  const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : null;
  const now = new Date();
  
  // Calculate time differences if delivery date exists
  if (deliveryDate) {
    const daysAfterDelivery = (now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Show lapse countdown if within the 5-day window after delivery date
    if (daysAfterDelivery > 0 && daysAfterDelivery < 5) {
      const hoursUntilLapse = (5 * 24) - (daysAfterDelivery * 24);
      if (hoursUntilLapse > 24) {
        const daysUntilLapse = Math.ceil(5 - daysAfterDelivery);
        return `will fully lapse in ${daysUntilLapse} day${daysUntilLapse > 1 ? 's' : ''}.`;
      } else {
        const roundedHours = Math.ceil(hoursUntilLapse);
        if (roundedHours > 1) {
          return `will fully lapse in ${roundedHours} hours.`;
        } else {
          const minutesUntilLapse = Math.ceil(hoursUntilLapse * 60);
          return `will fully lapse in ${minutesUntilLapse} mins.`;
        }
      }
    }
  }

  // Return appropriate status messages
  if (status === 'Completed') {
    return 'has been completed and verified.';
  } else if (status === 'Needs Action') {
    return 'needs action.';
  } else if (status === 'Lapsed') {
    return 'has lapsed.';
  } else if (status === 'Extended') {
    return 'has been extended.';
  } else if (status === 'Verified') {
    return 'has been verified.';
  } else if (status === 'Pending') {
    return 'is pending.';
  }

  return 'status has been updated.';
};

// Function to check if order has been modified
const hasOrderBeenModified = (order: any) => {
  return order.verificationEvents?.some((event: any) => 
    event.type === 'modify' || event.type === 'undo'
  );
};

// Update the notifications function to include new orders
const updateNotifications = async () => {
  try {
    const records = await pb.collection("Collection_1").getFullList({
      sort: "-updated",  // Get most recently updated records first
      expand: "verifiedBy,verificationEvents.userId,createdBy",
    });

    // Create all notifications first
    const allNotifications = [
      // Include new orders (keep until status changes from Pending)
      ...records
        .filter(record => record.status === "Pending")
        .map(record => ({
          id: record.id,
          orderNo: record.Order_No,
          message: 'has been created and is pending review.',
          timestamp: record.created,
          createdBy: record.createdByName || record.expand?.createdBy?.name || 'System',
          isNew: true,
          viewed: record.viewed || false,
          status: record.status
        })),
      // Include deleted orders (keep until restored)
      ...records
        .filter(record => !record.visible && record.deletedDate)
        .map(record => ({
          id: record.id,
          orderNo: record.Order_No,
          message: 'has been deleted.',
          timestamp: record.deletedDate,
          deletedBy: record.deletedBy,
          deletedDate: record.deletedDate,
          deleted: true,
          viewed: record.viewed || false,
          status: 'Deleted'
        })),
      // Regular notifications (keep until status changes)
      ...records
        .filter(record => record.visible && record.status !== "Pending")
        .map(record => {
          const message = formatNotificationMessage(record);
          const isModified = hasOrderBeenModified(record);
          
          return {
            id: record.id,
            orderNo: record.Order_No,
            message,
            isModified,
            timestamp: record.updated,
            viewed: record.viewed || false,
            status: record.status,
            // Track the last action for sorting
            lastAction: record.updated || record.created
          };
        }).filter(notification => notification.message)
    ];

    // Sort notifications by most recent action
    const sortedNotifications = allNotifications.sort((a, b) => {
      // Get the most recent timestamp for each notification
      const getLatestTimestamp = (notification: any) => {
        if (notification.deleted) return notification.deletedDate;
        if (notification.isNew) return notification.timestamp;
        return notification.lastAction || notification.timestamp;
      };

      const timeA = new Date(getLatestTimestamp(a)).getTime();
      const timeB = new Date(getLatestTimestamp(b)).getTime();
      return timeB - timeA;
    });

    // Update unread count (only count unviewed items)
    unreadCount.value = sortedNotifications.filter(n => !n.viewed).length;
    
    // Update notifications
    notifications.value = sortedNotifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
};

// Update the toggleNotifications function
const toggleNotifications = () => {
  isNotificationOpen.value = !isNotificationOpen.value;
  if (isNotificationOpen.value) {
    isDropdownOpen.value = false;
    // Mark all notifications as viewed when opening dropdown
    notifications.value.forEach(async (notification) => {
      if (!notification.viewed) {
        try {
          await pb.collection("Collection_1").update(notification.id, { viewed: true });
          notification.viewed = true;
        } catch (error) {
          console.error("Error marking notification as viewed:", error);
        }
      }
    });
    unreadCount.value = 0; // Reset counter when opening dropdown
  } else {
    // Reset notification display limit when closing the dropdown
    notificationDisplayLimit.value = 20;
  }
};

// Update the handleNotificationClick function to not close notifications
const handleNotificationClick = async (notification: any) => {
  if (notification.deleted) {
    const deletedDate = new Date(notification.deletedDate).toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    alert(`${notification.orderNo} has been deleted by ${notification.deletedBy} on ${deletedDate} and is no longer available.`);
  } else {
    try {
      const order = await pb.collection("Collection_1").getFirstListItem(
        `Order_No="${notification.orderNo}"`,
        {
          expand: 'verifiedBy,verificationEvents.userId,createdBy'
        }
      );
      
      if (order) {
        // Only mark as viewed, but keep the notification until status changes
        if (!order.viewed) {
          await pb.collection("Collection_1").update(order.id, { viewed: true });
        }

        const formattedOrder = {
          id: order.id,
          orderNumber: order.Order_No,
          status: order.status,
          dateCreated: order.created,
          createdBy: order.createdByName || 'System',
          verificationEvents: order.verificationEvents || [],
          expand: order.expand,
          supplierName: order.supplierName,
          address: order.address,
          tin_ID: order.tin_ID,
          modeofProcurement: order.modeofProcurement,
          deliveryDate: order.deliveryDate,
          verifiedAt: order.verifiedAt,
          verifiedBy: order.verifiedBy,
          completedAt: order.completedAt
        };
        
        emit('openModal', formattedOrder);
      } else {
        alert('This order is no longer available');
      }
    } catch (error) {
      alert('This order is no longer available');
    }
  }
};

// Update the closeNotification function to handle clicks properly
const closeNotification = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  
  // Don't close if clicking inside notification content or modals
  if (target.closest('.notification-content') || 
      target.closest('.modal') || 
      target.closest('.p-dialog') || 
      target.closest('.notification-icon')) {
    return;
  }
  
  // Only close if clicking outside
  if (!target.closest('.notification-dropdown')) {
    isNotificationOpen.value = false;
  }
};

// Add emits declaration at the top of the script
const emit = defineEmits(['openModal']);

// Add new notification management functions
const markAllAsRead = async () => {
  try {
    const unreadNotifications = notifications.value.filter(n => !n.viewed);
    for (const notification of unreadNotifications) {
      await pb.collection("Collection_1").update(notification.id, { viewed: true });
      notification.viewed = true;
    }
    unreadCount.value = 0;
  } catch (error) {
    console.error("Error marking all as read:", error);
  }
};

const clearAllNotifications = () => {
  notifications.value = [];
  unreadCount.value = 0;
};

// Update the time-based grouping functions to handle timezone
const getTimeGroup = (timestamp: string) => {
  const now = new Date();
  const date = new Date(timestamp);
  
  // Convert both dates to Asia/Manila timezone for consistent comparison
  const nowManila = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const dateManila = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  
  const diffTime = nowManila.getTime() - dateManila.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'This Week';
  if (diffDays <= 30) return 'This Month';
  return 'Last Month';
};

// Group notifications by time with display limit
const groupedNotifications = computed(() => {
  const groups: Record<string, any[]> = {};
  
  // Calculate total notifications across all groups
  let totalCount = 0;
  
  notifications.value.forEach(notification => {
    // Break the loop if we've reached the display limit
    if (totalCount >= notificationDisplayLimit.value) {
      return;
    }
    
    const group = getTimeGroup(notification.timestamp);
    if (!groups[group]) {
      groups[group] = [];
    }
    
    groups[group].push(notification);
    totalCount++;
  });
  
  return groups;
});

// Check if there are more notifications to load
const hasMoreNotifications = computed(() => {
  return notifications.value.length > notificationDisplayLimit.value;
});

// Total count of notifications being displayed
const displayedNotificationsCount = computed(() => {
  let count = 0;
  Object.values(groupedNotifications.value).forEach(group => {
    count += group.length;
  });
  return count;
});

// Update the relative time formatting to use Manila timezone
const getRelativeTime = (timestamp: string) => {
  const now = new Date();
  const date = new Date(timestamp);
  
  // Convert both dates to Asia/Manila timezone
  const nowManila = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const dateManila = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  
  const diffTime = nowManila.getTime() - dateManila.getTime();
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  
  // For older dates, show the actual date in Manila time
  return dateManila.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    timeZone: 'Asia/Manila'
  });
};

// Update the getNotificationIcon function
const getNotificationIcon = (notification: any) => {
  // Check if it's a new order notification
  if (notification.isNew || notification.message.includes('has been created')) {
    return {
      component: File,
      class: 'text-purple-600'
    };
  }

  // Check if it's a deleted notification
  if (notification.message.includes('deleted')) {
    return {
      component: Trash,
      class: 'text-red-500'
    };
  }

  // Check if it's an edit notification
  if (notification.message.includes('edited')) {
    return {
      component: FileEdit,
      class: 'text-blue-500'
    };
  }

  // For other notifications
  if (notification.message.includes('completed and verified')) {
    return {
      component: CheckCircle2,
      class: 'text-green-500'
    };
  } else if (notification.message.includes('lapsed')) {
    return {
      component: AlertTriangle,
      class: 'text-red-500'
    };
  } else if (notification.message.includes('will fully lapse')) {
    return {
      component: Clock,
      class: 'text-orange-500'
    };
  } else if (notification.message.includes('needs action')) {
    return {
      component: AlertCircle,
      class: 'text-yellow-400'
    };
  } else if (notification.message.includes('verified')) {
    return {
      component: Check,
      class: 'text-blue-500'
    };
  } else if (notification.message.includes('extended')) {
    return {
      component: ArrowUpCircle,
      class: 'text-orange-400'
    };
  }

  // Default icon
  return {
    component: Bell,
    class: 'text-blue-500'
  };
};

// Function to load more notifications
const loadMoreNotifications = () => {
  isLoadingMoreNotifications.value = true;
  
  // Use setTimeout to simulate loading (helps with UI feedback)
  setTimeout(() => {
    notificationDisplayLimit.value += incrementNotificationsBy;
    isLoadingMoreNotifications.value = false;
  }, 300);
};
</script>

<template>
  <Toolbar
    v-if="showNav"
    class="rounded-none border-x-0 border-t-0 border-b-0 bg-[#0A0E1A] text-white"
  >
    <template #start>
      <div class="flex gap-6">
        <div class="flex gap-3">
          <div class="flex items-center gap-2 p-4 pb-1">
            <h1 class="text-lg font-bold">MARKA</h1>
          </div>
        </div>
      </div>
    </template>
    <template #end>
      <div class="flex items-center gap-4">
        <!-- Welcome text -->
        <div class="text-white font-bold text-lg font-size-150px pt-4">
          Welcome, {{ pb.authStore.model?.name || 'User' }}!
        </div>

        <!-- Notification Button -->
        <div class="relative notification-icon" v-if="!isSettingsPage">
          <div 
            class="cursor-pointer p-2 rounded-full hover:bg-gray-700/20 transition-colors duration-200"
            @click="toggleNotifications"
          >
            <Bell class="w-5 h-5" />
            <transition
              enter-active-class="transform scale-100 transition-all duration-300 ease-out"
              enter-from-class="transform scale-50 opacity-0"
              leave-active-class="transition-all duration-200 ease-in"
              leave-to-class="transform scale-95 opacity-0"
            >
              <span 
                v-if="showNotificationCounter"
                :class="{ 'animate-bounce': shouldAnimate }"
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 transform transition-all duration-300"
              >
                {{ unreadCount }}
              </span>
            </transition>
          </div>

          <!-- Notification Dropdown -->
          <transition 
            name="dropdown"
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <div 
              v-if="isNotificationOpen"
              class="notification-dropdown absolute right-0 top-full mt-2 w-96 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 max-h-96 overflow-y-auto"
            >
              <!-- Notification Header -->
              <div class="notification-content px-4 py-3 border-b border-gray-100">
                <span class="text-base font-semibold text-gray-900">Notifications</span>
              </div>

              <!-- Notifications List -->
              <div v-if="notifications.length > 0" class="notification-content">
                <div v-for="(groupNotifications, groupName) in groupedNotifications" :key="groupName">
                  <!-- Time Group Header -->
                  <div class="px-4 py-2 bg-gray-50">
                    <span class="text-xs font-semibold text-gray-900">{{ groupName }}</span>
                  </div>
                  
                  <!-- Group Notifications -->
                  <div 
                    v-for="notification in groupNotifications" 
                    :key="notification.id" 
                    class="notification-content px-4 py-3 hover:bg-gray-50 cursor-pointer group"
                    @click="handleNotificationClick(notification)"
                  >
                    <div class="flex items-start gap-3">
                      <!-- Status Icon -->
                      <div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <component 
                          :is="getNotificationIcon(notification).component" 
                          class="w-5 h-5"
                          :class="getNotificationIcon(notification).class"
                        />
                      </div>

                      <!-- Notification Content -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2">
                          <div class="flex-1">
                            <p class="text-xs text-gray-900 leading-tight">
                              <span class="font-semibold" :class="notification.deleted ? 'text-red-600' : 'text-blue-600'">
                                {{ notification.orderNo }}
                              </span>
                              <span>&nbsp;{{ notification.message }}</span>
                            </p>
                          </div>
                          <span class="text-xs text-gray-500 flex-shrink-0">{{ getRelativeTime(notification.timestamp) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Notification Count -->
                <div class="px-4 py-2 text-xs text-gray-500 text-center border-t border-gray-100">
                  Showing {{ displayedNotificationsCount }} of {{ notifications.length }} notifications
                </div>
                
                <!-- Load More Button -->
                <div v-if="hasMoreNotifications" class="px-4 py-2 border-t border-gray-100">
                  <button
                    @click.stop="loadMoreNotifications"
                    :disabled="isLoadingMoreNotifications"
                    class="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded transition-all duration-200 flex items-center justify-center"
                  >
                    <svg 
                      v-if="isLoadingMoreNotifications" 
                      class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ isLoadingMoreNotifications ? 'Loading...' : 'Load More' }}
                  </button>
                </div>
              </div>
              <div v-else class="notification-content px-4 py-3 text-xs text-gray-500 text-center">
                No notifications
              </div>
            </div>
          </transition>
        </div>

        <!-- Search Input - Hidden on settings page -->
        <div v-if="showSearch" class="relative mt-3 group">
          <!-- Hidden dummy fields to catch autofill attempts -->
          <div style="display:none">
            <input type="text" name="prevent_autofill" />
            <input type="password" name="password_fake" />
          </div>
          <input
            v-model="searchStore.searchQuery"
            type="text"
            placeholder="Search..."
            autocomplete="new-password"
            data-1p-ignore="true"
            name="search_no_autofill"
            class="bg-gray-100 text-black px-3 py-2 rounded-lg w-64 focus:outline-none pr-10 placeholder:opacity-100 placeholder:transition-all placeholder:duration-300 group-hover:placeholder:opacity-100 group-hover:placeholder:translate-x-2"
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

        <!-- User icon with dropdown -->
        <div class="relative user-icon">
          <div 
            class="cursor-pointer"
            @click="toggleDropdown"
          >
            <!-- Show profile image if available, otherwise show User icon -->
            <div v-if="userAvatarUrl" class="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-white transition">
              <img :src="userAvatarUrl" alt="Profile" class="w-full h-full object-cover" />
            </div>
            <div v-else class="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition">
              <User class="w-5 h-5" />
            </div>
          </div>

          <!-- Dropdown menu -->
          <transition 
            name="dropdown"
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <div 
              v-if="isDropdownOpen"
              class="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
            >
              <a 
                href="#"
                @click.prevent="navigateToDashboard"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                :class="{ 'bg-gray-50': isDashboardPage }"
              >
                <LayoutDashboard class="w-4 h-4 mr-2" />
                Dashboard
              </a>
              <a 
                href="#"
                @click.prevent="navigateToSettings"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                :class="{ 'bg-gray-50': isSettingsPage }"
              >
                <Settings class="w-4 h-4 mr-2" />
                Settings
              </a>
              <div class="border-t border-gray-100 my-1"></div>
              <a 
                href="#"
                @click.prevent="handleLogout"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut class="w-4 h-4 mr-2" />
                Logout
              </a>
            </div>
          </transition>
        </div>
      </div>
    </template>
  </Toolbar>
</template>

<style scoped>
.notification-icon {
  margin-top: 0.75rem;
}

.user-icon {
  margin-top: 0.75rem;
}

/* Add smooth transition for notification text */
.group:hover .text-blue-600 {
  transition: color 0.2s ease;
}

/* Add these styles at the end of your component */
@keyframes notification-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.notification-badge-animate {
  animation: notification-pulse 0.3s ease-in-out;
}

/* Enhance the notification dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Add smooth transition for notification counter */
.notification-counter-enter-active,
.notification-counter-leave-active {
  transition: all 0.3s ease;
}

.notification-counter-enter-from,
.notification-counter-leave-to {
  transform: scale(0.5);
  opacity: 0;
}
</style>