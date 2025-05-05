<script setup lang="ts">
import { useSearchStore } from "../stores/searchStore";
import { Toolbar } from "primevue";
import PocketBase from 'pocketbase';
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Settings, LogOut, LayoutDashboard, Bell, Check, X, CheckCircle2, AlertTriangle, Clock, AlertCircle, CheckCircle, ArrowUpCircle, Trash } from 'lucide-vue-next';

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
    // Clear auth data but preserve remembered user data
    pb.authStore.clear();
    localStorage.removeItem('pocketbase_auth');
    sessionStorage.removeItem('pocketbase_auth');
    // Don't remove remembered_user if it exists
    // localStorage.removeItem('remembered_user');
    
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

// Add at the top of the script with other imports
const deletedOrders = ref([{
  id: 'deleted-test',
  orderNo: 'TEST-2024',
  deletedBy: 'Test User',
  message: 'has been deleted.',
  timestamp: new Date().toISOString(),
  viewed: false
}]);

// Function to format notification message
const formatNotificationMessage = (order: any) => {
  if (order.deleted) {
    return 'has been deleted.';
  }

  const status = order.status;
  const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : null;
  const now = new Date();
  
  if (status === 'Completed') {
    return 'has been completed and verified.';
  } else if (status === 'Needs Action') {
    return 'needs action.';
  } else if (status === 'Lapsed') {
    return 'has lapsed.';
  } else if (status === 'Extended') {
    return 'has been extended.';
  } else if (status === 'Pending' || status === 'Verified') {
    if (deliveryDate) {
      const diffDays = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        const gracePeriod = 5;
        const daysOverdue = Math.abs(diffDays);
        if (daysOverdue > gracePeriod) {
          return 'has lapsed.';
        } else {
          return `is due (${gracePeriod - daysOverdue} days remaining).`;
        }
      } else if (diffDays <= 3) {
        return 'is almost due.';
      }
    }
    return 'is pending.';
  }
  return '';
};

// Function to check if order has been modified
const hasOrderBeenModified = (order: any) => {
  return order.verificationEvents?.some((event: any) => 
    event.type === 'modify' || event.type === 'undo'
  );
};

// Add event listener for deleted orders
onMounted(() => {
  window.addEventListener('orderDeleted', ((event: CustomEvent) => {
    const { orderNo, deletedBy } = event.detail;
    deletedOrders.value.unshift({
      id: `deleted-${Date.now()}`,
      orderNo,
      deletedBy,
      message: 'has been deleted.',
      timestamp: new Date().toISOString(),
      viewed: false
    });
    // Force notification update
    updateNotifications();
  }) as EventListener);
});

onBeforeUnmount(() => {
  window.removeEventListener('orderDeleted', (() => {}) as EventListener);
});

// Update the notifications function to include deleted orders
const updateNotifications = async () => {
  try {
    const records = await pb.collection("Collection_1").getFullList({
      sort: "-updated",
      expand: "verifiedBy,verificationEvents.userId,createdBy",
    });

    const newNotifications = [
      // Include deleted orders at the top
      ...deletedOrders.value,
      // Regular notifications
      ...records.map(record => {
        const message = formatNotificationMessage(record);
        const isModified = hasOrderBeenModified(record);
        
        return {
          id: record.id,
          orderNo: record.Order_No,
          message,
          isModified,
          timestamp: record.updated,
          viewed: record.viewed || false
        };
      }).filter(notification => notification.message)
    ];

    // Update unread count
    unreadCount.value = newNotifications.filter(n => !n.viewed).length;
    
    // Update notifications
    notifications.value = newNotifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
};

// Toggle notification dropdown
const toggleNotifications = () => {
  isNotificationOpen.value = !isNotificationOpen.value;
  if (isNotificationOpen.value) {
    isDropdownOpen.value = false;
    // Mark notifications as viewed when opening dropdown
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
    unreadCount.value = 0;
  }
};

// Close notification dropdown when clicking outside
const closeNotification = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.notification-icon')) {
    isNotificationOpen.value = false;
  }
};

// Add emits declaration at the top of the script
const emit = defineEmits(['openModal']);

// Update the handleNotificationClick function
const handleNotificationClick = async (notification: any) => {
  if (deletedOrders.value.find(d => d.orderNo === notification.orderNo)) {
    alert(`This order has been deleted by ${notification.deletedBy}. ${notification.orderNo} is no longer available.`);
  } else {
    try {
      const order = await pb.collection("Collection_1").getFirstListItem(
        `Order_No="${notification.orderNo}"`,
        {
          expand: 'verifiedBy,verificationEvents.userId,createdBy'
        }
      );
      
      if (order) {
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
  isNotificationOpen.value = false;
};

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

// Set up polling for notifications
let notificationInterval: number | null = null;

onMounted(() => {
  document.addEventListener('click', closeDropdown);
  document.addEventListener('click', closeNotification);
  updateNotifications();
  // Poll every 30 seconds
  notificationInterval = window.setInterval(updateNotifications, 30000);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown);
  document.removeEventListener('click', closeNotification);
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }
});

// Add time-based grouping functions
const getTimeGroup = (timestamp: string) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'This Week';
  if (diffDays <= 30) return 'This Month';
  return 'Last Month';
};

// Group notifications by time
const groupedNotifications = computed(() => {
  const groups: Record<string, any[]> = {};
  
  notifications.value.forEach(notification => {
    const group = getTimeGroup(notification.timestamp);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(notification);
  });
  
  return groups;
});

// Add function to format relative time
const getRelativeTime = (timestamp: string) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffTime = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Update the getNotificationIcon function
const getNotificationIcon = (notification: any) => {
  // Check if it's a deleted notification
  if (deletedOrders.value.find(d => d.orderNo === notification.orderNo)) {
    return {
      component: Trash,
      class: 'text-red-500'
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
  } else if (notification.message.includes('due') || notification.message.includes('almost due')) {
    return {
      component: Clock,
      class: 'text-yellow-500'
    };
  } else if (notification.message.includes('needs action')) {
    return {
      component: AlertCircle,
      class: 'text-orange-500'
    };
  } else if (notification.message.includes('extended')) {
    return {
      component: ArrowUpCircle,
      class: 'text-blue-500'
    };
  }
  return {
    component: Clock,
    class: 'text-blue-500'
  };
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
            class="cursor-pointer p-2 rounded-full hover:bg-gray-700 transition relative"
            @click="toggleNotifications"
          >
            <Bell class="w-5 h-5" />
            <span v-if="unreadCount > 0" 
              class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {{ unreadCount }}
            </span>
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
              class="absolute right-0 top-full mt-2 w-96 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 max-h-96 overflow-y-auto"
            >
              <!-- Notification Header -->
              <div class="px-4 py-3 border-b border-gray-100">
                <span class="text-base font-semibold text-gray-900">Notifications</span>
              </div>

              <!-- Notifications List -->
              <div v-if="notifications.length > 0">
                <div v-for="(groupNotifications, groupName) in groupedNotifications" :key="groupName">
                  <!-- Time Group Header -->
                  <div class="px-4 py-2 bg-gray-50">
                    <span class="text-xs font-semibold text-gray-900">{{ groupName }}</span>
                  </div>
                  
                  <!-- Group Notifications -->
                  <div 
                    v-for="notification in groupNotifications" 
                    :key="notification.id" 
                    class="px-4 py-3 hover:bg-gray-50 cursor-pointer group"
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
              </div>
              <div v-else class="px-4 py-3 text-xs text-gray-500 text-center">
                No notifications
              </div>
            </div>
          </transition>
        </div>

        <!-- Search Input - Hidden on settings page -->
        <div v-if="showSearch" class="relative mt-3 group">
          <input
            v-model="searchStore.searchQuery"
            type="text"
            placeholder="Search..."
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
</style>