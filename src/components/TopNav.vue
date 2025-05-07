<script setup lang="ts">
import { useSearchStore } from "../stores/searchStore";
import { Toolbar } from "primevue";
import PocketBase from 'pocketbase';
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Settings, LogOut, LayoutDashboard, Bell, Check, X, CheckCircle2, AlertTriangle, Clock, AlertCircle, CheckCircle, ArrowUpCircle, Trash, File, FileEdit, FilePlus2, CircleCheckBig } from 'lucide-vue-next';

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

// Add a ref to store the interval
const notificationIntervalRef = ref<ReturnType<typeof setInterval> | null>(null);

// Add a ref to track completed documents that should be preserved
const preservedCompletedDocuments = ref<Map<string, any>>(new Map());

// Add a local notification counter that persists in session storage
const localNotificationCounter = ref(0);
const sessionProcessedIds = ref<Set<string>>(new Set());

// Function to save processed IDs to session storage
const saveProcessedIds = () => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('processedNotificationIds', JSON.stringify([...sessionProcessedIds.value]));
  }
};

// Function to load processed IDs from session storage
const loadProcessedIds = () => {
  if (typeof sessionStorage !== 'undefined') {
    const savedIds = sessionStorage.getItem('processedNotificationIds');
    if (savedIds) {
      try {
        sessionProcessedIds.value = new Set(JSON.parse(savedIds));
      } catch (error) {
        console.error('Error parsing processed notification IDs:', error);
      }
    }
  }
};

// Function to increment local notification counter and save to session storage
const incrementLocalCounter = (id: string, timestamp: string) => {
  // Create a unique identifier using ID and timestamp to track updates
  const changeId = `${id}_${timestamp}`;
  
  // Only increment if we haven't processed this specific change yet
  if (!sessionProcessedIds.value.has(changeId)) {
    localNotificationCounter.value++;
    sessionProcessedIds.value.add(changeId);
    saveProcessedIds();
    
    // Save counter to session storage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('notificationCounter', localNotificationCounter.value.toString());
    }
    
    // Trigger animation for visual feedback
    triggerCounterAnimation();
  }
};

// Reset the local counter (called when opening notifications)
const resetLocalCounter = () => {
  localNotificationCounter.value = 0;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('notificationCounter', '0');
  }
};

onMounted(() => {
  // Load local counter from session storage
  if (typeof sessionStorage !== 'undefined') {
    const savedCounter = sessionStorage.getItem('notificationCounter');
    if (savedCounter) {
      localNotificationCounter.value = parseInt(savedCounter, 10) || 0;
    }
  }
  
  // Load processed notification IDs
  loadProcessedIds();

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
      
      // Increment local counter for new document
      incrementLocalCounter(record.id, record.created);
      shouldUpdateCounter = !isNotificationOpen.value;
    } else if (e.action === 'update') {
      // Document updated - check for status changes, etc.
      const existingNotificationIndex = notifications.value.findIndex(n => n.id === record.id);
      
      // Check if this is a "soft deletion" (visible changed to false)
      if (record.visible === false && record.deletedDate) {
        // Handle as a deletion
        const deletedNotification = {
          id: record.id,
          orderNo: record.Order_No,
          message: 'has been deleted.',
          timestamp: record.deletedDate,
          deletedBy: record.deletedBy || 'Unknown',
          deleted: true,
          viewed: false,
          status: 'Deleted'
        };
        
        if (existingNotificationIndex !== -1) {
          // Replace existing notification
          notifications.value[existingNotificationIndex] = deletedNotification;
        } else {
          // Add new notification
          notifications.value.unshift(deletedNotification);
        }
        
        // Increment local counter for deletion
        incrementLocalCounter(record.id, record.deletedDate);
        shouldUpdateCounter = !isNotificationOpen.value;
      } else if (existingNotificationIndex !== -1) {
        const message = formatNotificationMessageWithEvent(record);
        
        // Special handling for completed documents - don't update position
        if (record.status === 'Completed' && notifications.value[existingNotificationIndex].status === 'Completed') {
          // Only update message and verification events, preserve position
          notifications.value[existingNotificationIndex] = {
            ...notifications.value[existingNotificationIndex],
            message,
            verificationEventCount: record.verificationEvents?.length || 0,
            lastVerificationEventId: record.verificationEvents?.length > 0 ? 
              record.verificationEvents[record.verificationEvents.length - 1].timestamp : null,
            preservePosition: true
          };
          
          // Store for preservation
          preservedCompletedDocuments.value.set(record.id, notifications.value[existingNotificationIndex]);
        } else if (message) {
          // Regular update for non-completed documents
          notifications.value[existingNotificationIndex] = {
            id: record.id,
            orderNo: record.Order_No,
            message,
            isModified: hasOrderBeenModified(record),
            timestamp: record.updated,
            viewed: false, // Always mark updates as unviewed to keep "new" indicator
            status: record.status,
            lastAction: record.updated || record.created,
            verificationEventCount: record.verificationEvents?.length || 0,
            lastVerificationEventId: record.verificationEvents?.length > 0 ? 
              record.verificationEvents[record.verificationEvents.length - 1].timestamp : null,
            completedAt: record.completedAt,
            preservePosition: false
          };
          
          // Increment local counter for updated document
          incrementLocalCounter(record.id, record.updated);
          shouldUpdateCounter = !isNotificationOpen.value;
        }
      }
    } else if (e.action === 'delete') {
      // Document deleted (hard deletion)
      notifications.value = notifications.value.filter(n => n.id !== record.id);
      // Remove from preserved documents
      preservedCompletedDocuments.value.delete(record.id);
      shouldUpdateCounter = !isNotificationOpen.value;
    }
    
    // Update unread count (only count unviewed items)
    if (shouldUpdateCounter) {
      unreadCount.value = notifications.value.filter(n => !n.viewed).length;
    }
  });

  document.addEventListener('click', closeNotification, true);
  document.addEventListener('click', closeDropdown);
  
  // Initial fetch of notifications
  updateNotifications();
  
  // Set up interval for periodic updates (every 2-3 seconds)
  // Clear any existing interval first to prevent duplicates
  if (notificationIntervalRef.value) {
    clearInterval(notificationIntervalRef.value);
  }
  
  const notificationInterval = setInterval(() => {
    updateNotifications();
  }, 2500);
  
  // Store the interval so we can clear it in onBeforeUnmount
  notificationIntervalRef.value = notificationInterval;
});

onBeforeUnmount(() => {
  // Unsubscribe from real-time updates
  pb.collection('Collection_1').unsubscribe();
  document.removeEventListener('click', closeNotification, true);
  document.removeEventListener('click', closeDropdown);
  
  // Clear the notification interval if it exists
  if (notificationIntervalRef.value) {
    clearInterval(notificationIntervalRef.value);
    notificationIntervalRef.value = null;
  }
});

// Function to get the latest verification event
const getLatestVerificationEvent = (record: any) => {
  if (!record.verificationEvents || record.verificationEvents.length === 0) {
    return null;
  }
  
  // Sort events by timestamp descending and get the first one
  return [...record.verificationEvents].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  })[0];
};

// Function to format notification message based on latest verification event
const formatNotificationMessageWithEvent = (record: any) => {
  if (record.deleted) {
    return 'has been deleted.';
  }

  // Get the latest verification event
  const latestEvent = getLatestVerificationEvent(record);
  
  // If we have a verification event, use it to determine the message
  if (latestEvent) {
    switch (latestEvent.type) {
      case 'initial':
        return 'has received initial verification.';
      case 'sent to supplier':
        return 'has been verified and sent to the supplier.';
      case 'final':
        return 'has been completed and verified.';
      case 'undo':
        return latestEvent.action || 'verification was cancelled.';
      case 'lapsed':
        return 'has lapsed.';
      case 'extend':
        return 'has been extended.';
      case 'edit':
    return 'has been edited.';
      case 'modify':
        return 'has been modified.';
      case 'delete':
        return 'has been deleted.';
      default:
        break;
    }
  }

  // If no specific event matches or no events exist, use status-based messages
  const status = record.status;
  const deliveryDate = record.deliveryDate ? new Date(record.deliveryDate) : null;
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
    return 'has been verified and sent to the supplier.';
  } else if (status === 'Pending') {
    return 'is pending.';
  }

  return 'status has been updated.';
};

// Add this function to get the time group for a notification to group by time
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

// Update the sorting logic to maintain positions of completed documents
const preserveExistingPositions = () => {
  // Create a map of existing notifications with their indices and timestamps
  const existingOrder = new Map();
  const existingTimestamps = new Map();
  
  notifications.value.forEach((notification, index) => {
    existingOrder.set(notification.id, index);
    existingTimestamps.set(notification.id, notification.timestamp);
  });
  
  // Return a sort function that preserves timestamps and positions
  return (a: any, b: any) => {
    // First sort by time group (Today, Yesterday, etc.)
    const groupA = getTimeGroup(a.timestamp);
    const groupB = getTimeGroup(b.timestamp);
    
    if (groupA !== groupB) {
      // Different time groups, sort by group
      const groups = ['Today', 'Yesterday', 'This Week', 'This Month', 'Last Month'];
      return groups.indexOf(groupA) - groups.indexOf(groupB);
    }
    
    // Same time group - preserve the original timestamps for completed items
    const aIsPreserved = a.status === 'Completed' && existingOrder.has(a.id);
    const bIsPreserved = b.status === 'Completed' && existingOrder.has(b.id);
    
    // When a document is newly completed, keep its original timestamp
    if (a.isNewlyCompleted && existingTimestamps.has(a.id)) {
      a.timestamp = existingTimestamps.get(a.id);
    }
    
    if (b.isNewlyCompleted && existingTimestamps.has(b.id)) {
      b.timestamp = existingTimestamps.get(b.id);
    }
    
    // Within the same time group, sort by timestamp
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  };
};

// Update notification function to track original timestamp
const updateNotifications = async () => {
  try {
    const records = await pb.collection("Collection_1").getFullList({
      sort: "-updated",  // Get most recently updated records first
      expand: "verifiedBy,verificationEvents.userId,createdBy",
    });

    // Get existing notification IDs for comparison
    const existingNotifications = new Map();
    const originalTimestamps = new Map();
    
    notifications.value.forEach(n => {
      existingNotifications.set(n.id, n);
      originalTimestamps.set(n.id, n.timestamp);  // Store original timestamps
    });
    
    // Update preserved completed documents
    notifications.value.forEach(notification => {
      if (notification.status === 'Completed' && notification.completedAt) {
        preservedCompletedDocuments.value.set(notification.id, notification);
      }
    });
    
    let hasNewItems = false;

    // Create all notifications first
    const allNotifications = [
      // Include new orders (keep until status changes from Pending)
      ...records
        .filter(record => record.status === "Pending" && !record.completedAt && record.visible !== false)
        .map(record => {
          // Check if this is a new notification
          if (!existingNotifications.has(record.id)) {
            incrementLocalCounter(record.id, record.created);
            hasNewItems = true;
          }
          
          return {
          id: record.id,
          orderNo: record.Order_No,
          message: 'has been created and is pending review.',
          timestamp: record.created,
          createdBy: record.createdByName || record.expand?.createdBy?.name || 'System',
          isNew: true,
            viewed: record.viewed || false, // Preserve viewed status from database
            status: record.status,
            verificationEventCount: record.verificationEvents?.length || 0,
            lastVerificationEventId: record.verificationEvents?.length > 0 ? 
              record.verificationEvents[record.verificationEvents.length - 1].timestamp : null,
            completedAt: record.completedAt,
            originalTimestamp: originalTimestamps.get(record.id) || record.created,
            preservePosition: false
          };
        }),
      // Include deleted orders (keep until restored)
      ...records
        .filter(record => record.visible === false && record.deletedDate)
        .map(record => {
          // Check if this is a new deletion or previously unseen deletion
          const existingNotification = existingNotifications.get(record.id);
          const isNewOrUnseenDeletion = !existingNotification || 
                                      existingNotification.status !== 'Deleted' ||
                                      !existingNotification.viewed;
          
          if (isNewOrUnseenDeletion) {
            incrementLocalCounter(record.id, record.deletedDate || '');
            hasNewItems = true;
          }
          
          return {
          id: record.id,
          orderNo: record.Order_No,
          message: 'has been deleted.',
            timestamp: record.deletedDate || '',
          deletedBy: record.deletedBy,
          deletedDate: record.deletedDate,
          deleted: true,
            viewed: existingNotification?.status === 'Deleted' ? existingNotification.viewed : false,
            status: 'Deleted',
            verificationEventCount: record.verificationEvents?.length || 0,
            lastVerificationEventId: record.verificationEvents?.length > 0 ? 
              record.verificationEvents[record.verificationEvents.length - 1].timestamp : null,
            completedAt: record.completedAt,
            originalTimestamp: originalTimestamps.get(record.id) || record.deletedDate || '',
            preservePosition: false
          };
        }),
      // Regular notifications (include ALL non-pending and visible documents, including Completed ones)
      ...records
        .filter(record => record.visible !== false && record.status !== "Pending")
        .map(record => {
          const message = formatNotificationMessageWithEvent(record);
          const isModified = hasOrderBeenModified(record);
          
          const existingNotification = existingNotifications.get(record.id);
          
          // Check if this is a new verification event
          const currentVerificationCount = record.verificationEvents?.length || 0;
          const previousVerificationCount = existingNotification?.verificationEventCount || 0;
          
          // Get the latest verification event ID
          const latestEventId = record.verificationEvents?.length > 0 ?
            record.verificationEvents[record.verificationEvents.length - 1].timestamp : null;
            
          // Check if this is a new event or different latest event
          const hasNewEvent = currentVerificationCount > previousVerificationCount ||
            (latestEventId && latestEventId !== existingNotification?.lastVerificationEventId);
          
          // Check if status has changed
          const hasStatusChanged = existingNotification && existingNotification.status !== record.status;
            
          // If new event or status changed, increment counter
          if (hasNewEvent || hasStatusChanged) {
            incrementLocalCounter(record.id, record.updated || record.created);
            hasNewItems = true;
          }
          
          // For completed documents, check if we have a preserved version
          const preservedVersion = preservedCompletedDocuments.value.get(record.id);
          
          // Check if this is a completed document that should maintain its position
          const isPreservedCompleted = record.status === 'Completed' && 
                                     record.completedAt && 
                                     !hasNewEvent && 
                                     !hasStatusChanged;
                                     
          // Check if this is a newly completed document
          const isNewlyCompleted = record.status === 'Completed' && 
                                (!existingNotification || existingNotification.status !== 'Completed');
          
          // For newly completed documents, we want to show a notification and make it visible
          if (isNewlyCompleted) {
            hasNewItems = true;
            incrementLocalCounter(record.id, record.updated || record.created);
          }
          
          // Determine timestamp to use - prioritize preserving the original position
          let timestamp;
          
          if (existingNotification) {
            // If it's a newly completed document, use the original timestamp
            if (isNewlyCompleted) {
              timestamp = originalTimestamps.get(record.id) || existingNotification.timestamp;
            } 
            // If it's already completed, use its current timestamp
            else if (record.status === 'Completed' && existingNotification.status === 'Completed') {
              timestamp = existingNotification.timestamp;
            }
            // Otherwise use the updated timestamp
            else {
              timestamp = record.updated || record.created;
            }
          } else {
            timestamp = record.updated || record.created;
          }
          
          // Build the notification object with proper position preservation
          return {
            id: record.id,
            orderNo: record.Order_No,
            message,
            isModified,
            timestamp: timestamp,
            viewed: record.viewed || false, // Preserve viewed status from database
            status: record.status,
            lastAction: record.updated || record.created,
            verificationEventCount: currentVerificationCount,
            lastVerificationEventId: latestEventId,
            completedAt: record.completedAt,
            originalTimestamp: originalTimestamps.get(record.id) || record.updated || record.created,
            preservePosition: isPreservedCompleted || isNewlyCompleted,
            isNewlyCompleted: isNewlyCompleted
          };
        }).filter(notification => notification.message) // Keep all notifications that have a message
    ];

    // Sort notifications using our improved custom sorter
    const sortedNotifications = [...allNotifications].sort(preserveExistingPositions());

    // Update unread count based on viewed status in database
    unreadCount.value = sortedNotifications.filter(n => !n.viewed).length;
    
    // Update notifications
    notifications.value = sortedNotifications;
    
    // Update preserved completed documents for the next cycle
    preservedCompletedDocuments.value.clear();
    sortedNotifications.forEach(notification => {
      if (notification.status === 'Completed' && notification.completedAt) {
        preservedCompletedDocuments.value.set(notification.id, notification);
      }
    });
    
    // Trigger animation if we found new items
    if (hasNewItems && !isNotificationOpen.value) {
      triggerCounterAnimation();
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
};

// Update the toggleNotifications function to only reset local counter
const toggleNotifications = () => {
  isNotificationOpen.value = !isNotificationOpen.value;
  if (isNotificationOpen.value) {
    isDropdownOpen.value = false;
    
    // Reset local notification counter when opening dropdown
    // This only affects the UI counter, not the actual document viewed status
    resetLocalCounter();
  } else {
    // Reset notification display limit when closing the dropdown
    notificationDisplayLimit.value = 20;
  }
};

// Update the handleNotificationClick function to preserve document position for completed documents
const handleNotificationClick = async (notification: any) => {
  // 1. First mark this notification as viewed immediately to prevent repeated counter increments
  if (!notification.viewed) {
    try {
      // If this is a deleted document notification, just mark it as viewed locally
      if (notification.deleted) {
        notification.viewed = true;
      } else {
        // For non-deleted documents, update in the database
        await pb.collection("Collection_1").update(notification.id, { viewed: true });
        notification.viewed = true;
      }
    } catch (error) {
      // Continue even if update fails - mainly for deleted documents that might not exist anymore
      console.log("Could not mark notification as viewed:", error);
    }
  }

  // 2. Then handle the click based on notification type
  if (notification.deleted) {
    const deletedDate = notification.deletedDate ? new Date(notification.deletedDate).toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'unknown date';
    
    alert(`${notification.orderNo} was deleted by ${notification.deletedBy || 'Unknown'} on ${deletedDate} and is no longer available.`);
  } else {
    try {
      const order = await pb.collection("Collection_1").getFirstListItem(
        `Order_No="${notification.orderNo}"`,
        {
          expand: 'verifiedBy,verificationEvents.userId,createdBy'
        }
      );
      
      if (order) {
        // IMPORTANT: For completed documents, do not modify anything when simply viewing
        // This prevents them from moving to the top of the list when opened

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
          completedAt: order.completedAt,
          // Pass original updated timestamp to avoid modifying sort order
          updated: order.updated,
          // Force viewed status to true since we're viewing it now
          viewed: true,
          // Add a flag to indicate this document should not be re-sorted
          preservePosition: order.status === 'Completed'
        };
        
        emit('openModal', formattedOrder);
      } else {
        alert('This order is no longer available.');
      }
    } catch (error) {
      alert('This order is no longer available.');
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
    
    // Process notifications in batches for efficiency
    for (const notification of unreadNotifications) {
      // For deleted documents, just mark them as viewed locally
      if (notification.deleted || notification.status === 'Deleted') {
        notification.viewed = true;
      } else {
        // For regular documents, update the database
        try {
          await pb.collection("Collection_1").update(notification.id, { viewed: true });
          notification.viewed = true;
        } catch (error) {
          // If document doesn't exist or another error occurs, just update locally
          notification.viewed = true;
          console.log(`Error updating viewed status for document ${notification.id}:`, error);
        }
      }
    }
    
    // Reset all counters
    unreadCount.value = 0;
    resetLocalCounter();
  } catch (error) {
    console.error("Error marking all as read:", error);
  }
};

const clearAllNotifications = () => {
  notifications.value = [];
  unreadCount.value = 0;
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
      component: FilePlus2,
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
      component: CircleCheckBig,
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

// Add computed property to return the notification counter to display
const notificationCountToDisplay = computed(() => {
  return isNotificationOpen.value ? unreadCount.value : localNotificationCounter.value;
});

// Update showNotificationCounter to use the local counter
const showNotificationCounter = computed(() => {
  return localNotificationCounter.value > 0 && !isNotificationOpen.value;
});

// Function to check if order has been modified
const hasOrderBeenModified = (order: any) => {
  return order.verificationEvents?.some((event: any) => 
    event.type === 'modify' || event.type === 'undo'
  );
};

// Legacy function for backward compatibility
const formatNotificationMessage = (order: any) => {
  return formatNotificationMessageWithEvent(order);
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
                {{ notificationCountToDisplay }}
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