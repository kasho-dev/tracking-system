<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import PocketBase from 'pocketbase';

// Icons
import { Save, User, Check, AlertCircle, Camera, Upload } from 'lucide-vue-next';

// Initialize PocketBase
const pb = new PocketBase("http://127.0.0.1:8090");

// Animation states
const isPageLoaded = ref(false);
const cardEntryComplete = ref(false);

// Form data
const name = ref('');
const email = ref('');
const department = ref('');
const role = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const wantToDeleteAccount = ref(false);

// Store original data to detect changes
const originalName = ref('');
const originalEmail = ref('');
const originalDepartment = ref('');
const originalProfileImageUrl = ref('');

// Make email field case insensitive by forcing lowercase on input
watch(email, (newValue) => {
  if (newValue && newValue !== newValue.toLowerCase()) {
    email.value = newValue.toLowerCase();
  }
});

// Available departments
const departments = [
  'Consumer Protection Division',
  'Finance Division',
  'Business Division'
];

// Error states
const nameError = ref(false);
const emailError = ref(false);
const departmentError = ref(false);
const currentPasswordError = ref(false);
const newPasswordError = ref(false);
const confirmPasswordError = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Button states
const isUpdatingBasicInfo = ref(false);
const isUpdatingPassword = ref(false);
const basicInfoUpdateSuccess = ref(false);
const passwordUpdateSuccess = ref(false);

// Form validation messages
const nameErrorMessage = ref('');
const emailErrorMessage = ref('');
const departmentErrorMessage = ref('');
const currentPasswordErrorMessage = ref('');
const newPasswordErrorMessage = ref('');
const confirmPasswordErrorMessage = ref('');

// Add refs for profile image handling
const profileImageFile = ref<File | null>(null);
const isUploadingImage = ref(false);
const profileImageUrl = ref('');
const imageUploadError = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

// Add password visibility state for all password fields
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// Add a ref for tracking email verification status
const isEmailVerificationSent = ref(false);
const newEmailAddress = ref('');

// Add this reactive property to track duplicate email errors
const isDuplicateEmail = ref(false);
// Add this reactive property to track duplicate name errors 
const isDuplicateName = ref(false);

// Add this reactive property to track password verification status
const isVerifyingPassword = ref(false);

const router = useRouter();

// Check if basic info has been changed
const basicInfoChanged = computed(() => {
  return name.value !== originalName.value || 
         email.value !== originalEmail.value || 
         department.value !== originalDepartment.value ||
         profileImageFile.value !== null;
});

// Check if password fields are filled out
const passwordFieldsHaveValues = computed(() => {
  return currentPassword.value.trim() !== '' && 
         newPassword.value.trim() !== '' && 
         confirmPassword.value.trim() !== '';
});

// Add loading state
const isLoadingUserData = ref(true);

// Fetch user data
const fetchUserData = async () => {
  try {
    isLoadingUserData.value = true;
    
    if (pb.authStore.isValid) {
      const userId = pb.authStore.model?.id;
      if (!userId) {
        isLoadingUserData.value = false;
        return;
      }
      
      const userData = await pb.collection('users').getOne(userId);
      
      // Set current values
      name.value = userData.name || '';
      email.value = userData.email ? userData.email.toLowerCase() : '';
      department.value = userData.department || '';
      role.value = userData.role || 'user';
      
      // Store original values
      originalName.value = userData.name || '';
      originalEmail.value = userData.email ? userData.email.toLowerCase() : '';
      originalDepartment.value = userData.department || '';
      
      // Get avatar URL if it exists
      if (userData.avatar) {
        profileImageUrl.value = pb.getFileUrl(userData, userData.avatar);
        originalProfileImageUrl.value = profileImageUrl.value;
      } else {
        profileImageUrl.value = '';
        originalProfileImageUrl.value = '';
      }
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  } finally {
    isLoadingUserData.value = false;
  }
};

// Update basic information
const updateBasicInfo = async () => {
  // Reset all states
  nameError.value = false;
  emailError.value = false;
  departmentError.value = false;
  nameErrorMessage.value = '';
  emailErrorMessage.value = '';
  departmentErrorMessage.value = '';
  errorMessage.value = '';
  imageUploadError.value = '';
  isUpdatingBasicInfo.value = true;
  basicInfoUpdateSuccess.value = false;
  isEmailVerificationSent.value = false;
  isDuplicateEmail.value = false;
  isDuplicateName.value = false;
  
  // Validate form
  let isValid = true;
  
  if (!name.value.trim()) {
    nameError.value = true;
    nameErrorMessage.value = 'Name is required';
    isValid = false;
  }
  
  if (!email.value.trim()) {
    emailError.value = true;
    emailErrorMessage.value = 'Email is required';
    isValid = false;
  } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
    emailError.value = true;
    emailErrorMessage.value = 'Please enter a valid email address';
    isValid = false;
  }
  
  if (!department.value) {
    departmentError.value = true;
    departmentErrorMessage.value = 'Department is required';
    isValid = false;
  }
  
  if (!isValid) {
    isUpdatingBasicInfo.value = false;
    return;
  }
  
  try {
    const userId = pb.authStore.model?.id;
    if (!userId) {
      isUpdatingBasicInfo.value = false;
      return;
    }
    
    // Check if name has changed and if it exists already
    const nameChanged = name.value !== originalName.value;
    if (nameChanged) {
      try {
        const nameExists = await checkNameExists(name.value);
        if (nameExists) {
          nameError.value = true;
          nameErrorMessage.value = 'Name already in use. Please choose a different name.';
          isDuplicateName.value = true;
          isUpdatingBasicInfo.value = false;
          return;
        }
      } catch (err) {
        console.error('Error checking name:', err);
      }
    }
    
    // Check if email has changed
    const emailChanged = email.value !== originalEmail.value;
    
    // Prepare form data for the update
    const formData = new FormData();
    formData.append('name', name.value);
    formData.append('department', department.value);
    
    // Only add email to the update if it hasn't changed
    if (!emailChanged) {
      formData.append('email', email.value);
    }
    
    // Add profile image if it exists
    if (profileImageFile.value) {
      formData.append('avatar', profileImageFile.value);
    }
    
    // Update user data with form data
    await pb.collection('users').update(userId, formData);
    
    // If email changed, check if it's in use with a direct query
    if (emailChanged) {
      try {
        const checkDuplicateEmail = async () => {
          try {
            // Convert to lowercase for case-insensitive comparison
            const emailLower = email.value.toLowerCase();
            
            // Try a direct check of email existence without causing errors
            const response = await fetch(`${pb.baseUrl}/api/collections/users/records?filter=(LOWER(email)='${emailLower}')`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
              }
            });
            
            if (!response.ok) {
              return false; // Couldn't check, assume it's not a duplicate
            }
            
            const data = await response.json();
            return data && data.items && data.items.length > 0;
          } catch (e) {
            console.log('Error checking email:', e);
            return false;
          }
        };
        
        const isDuplicate = await checkDuplicateEmail();
        
        if (isDuplicate) {
          // Email is already in use, show error
          emailError.value = true;
          emailErrorMessage.value = 'Email already in use. Please choose a different email.';
          isDuplicateEmail.value = true;
          isUpdatingBasicInfo.value = false;
          return;
        }
        
        // Email is available, proceed with email change
        try {
          // Try to request email change without showing console errors
          await pb.collection('users').requestEmailChange(email.value).catch(e => {
            // If this errors out, assume it's a duplicate email
            isDuplicateEmail.value = true;
            throw e;
          });
          
          // If we get here, email change request was successful
          isEmailVerificationSent.value = true;
          emailError.value = false;
          emailErrorMessage.value = '';
          newEmailAddress.value = email.value;
          
          // Force logout after successful email change request
          setTimeout(() => {
            // Clear all auth data
            pb.authStore.clear();
            localStorage.removeItem('pocketbase_auth');
            sessionStorage.removeItem('pocketbase_auth');
            
            // Remove remembered user data to force complete re-login
            localStorage.removeItem('remembered_user');
            
            // Show success message that will be visible briefly before redirect
            successMessage.value = 'Your email has been updated. Please log in again with your new email.';
            
            // Redirect to login page after a short delay
            setTimeout(() => {
              window.location.replace('/login');
            }, 10000);
          }, 1500);
        } catch (e) {
          // Handle the error without logging to console
          emailError.value = true;
            emailErrorMessage.value = 'Email already in use. Please choose a different email.';
          isDuplicateEmail.value = true;
          isUpdatingBasicInfo.value = false;
          return;
        }
      } catch (err) {
        // General error handler
        emailError.value = true;
        emailErrorMessage.value = 'Email already in use. Please choose a different email.';
        isDuplicateEmail.value = true;
        isUpdatingBasicInfo.value = false;
        return;
      }
    }
    
    // Reset profile image file reference after successful upload
    if (profileImageFile.value) {
      profileImageFile.value = null;
      // Refetch user data to get updated avatar URL
      await fetchUserData();
    } else if (!emailChanged) {
      // Only update original values if email didn't change
      // For email changes, we keep original email until verification completes
      originalName.value = name.value;
      originalEmail.value = email.value;
      originalDepartment.value = department.value;
      isDuplicateName.value = false;
    }
    
    // Set success state only if no errors occurred
    if (!emailError.value && !nameError.value && !departmentError.value) {
    basicInfoUpdateSuccess.value = true;
    isDuplicateName.value = false;
    
    // Reset success state after 3 seconds
    setTimeout(() => {
      basicInfoUpdateSuccess.value = false;
    }, 10000);
    }
  } catch (error: any) {
    // Reset success flag to make sure it doesn't show success when there's an error
    basicInfoUpdateSuccess.value = false;
    
    // Check if this is a duplicate name error
    if (error.status === 400 && (
        error.data?.name?.code === 'validation_not_unique' || 
        (JSON.stringify(error).toLowerCase().includes('unique') && 
         JSON.stringify(error).toLowerCase().includes('name')))) {
      
      nameError.value = true;
      nameErrorMessage.value = 'Name already in use. Please choose a different name.';
    }
    // Check if this is a duplicate email error 
    else if (error.status === 400 && (
        error.data?.email?.code === 'validation_not_unique' || 
        JSON.stringify(error).toLowerCase().includes('unique') ||
        JSON.stringify(error).toLowerCase().includes('already exists') ||
        JSON.stringify(error).toLowerCase().includes('already in use'))) {
      
      emailError.value = true;
      emailErrorMessage.value = 'Email already in use. Please choose a different email.';
    } else {
      // Handle other errors
      errorMessage.value = 'An error occurred while updating your profile.';
    }
  } finally {
    isUpdatingBasicInfo.value = false;
  }
};

// Helper function to check if a name already exists in the system
const checkNameExists = async (nameToCheck: string): Promise<boolean> => {
  try {
    // Convert to lowercase for case-insensitive search
    const nameToCheckLower = nameToCheck.toLowerCase();
    
    // First approach: Try with filter - using LOWER() function for case insensitivity
    const result = await pb.collection('users').getList(1, 1, {
      filter: `LOWER(name) = "${nameToCheckLower}"`,
    });
    
    if (result && result.items.length > 0) {
      // Exclude current user from the check
      const currentUserId = pb.authStore.model?.id;
      if (currentUserId && result.items[0].id === currentUserId) {
        return false; // It's the current user's name, so not a duplicate
      }
      return true;
    }
    
    // Second approach: Try with direct API request
    try {
      const response = await fetch(`${pb.baseUrl}/api/collections/users/records?filter=(LOWER(name)='${nameToCheckLower}')`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
        }
      });
      
      const data = await response.json();
      
      // Check if any items were returned (excluding current user)
      if (data && data.items && data.items.length > 0) {
        const currentUserId = pb.authStore.model?.id;
        // Filter out the current user's record
        const otherUsers = data.items.filter((item: any) => item.id !== currentUserId);
        return otherUsers.length > 0;
      }
    } catch (directError) {
      console.error('Error in direct API check for name:', directError);
      // Continue with the flow, don't throw
    }
    
    return false;
  } catch (error) {
    console.error('Error checking name existence:', error);
    // Re-throw to be handled by the caller
    throw error;
  }
};

// Helper function to check if an email already exists in the system
const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
  try {
    // Convert to lowercase for case-insensitive search
    const emailToCheckLower = emailToCheck.toLowerCase();
    
    // First approach: Try with filter - using LOWER() function for case insensitivity
    const result = await pb.collection('users').getList(1, 1, {
      filter: `LOWER(email) = "${emailToCheckLower}"`,
    });
    
    if (result && result.items.length > 0) {
      // Exclude current user from the check
      const currentUserId = pb.authStore.model?.id;
      if (currentUserId && result.items[0].id === currentUserId) {
        return false; // It's the current user's email, so not a duplicate
      }
      return true;
    }
    
    // Second approach: Try with direct API request to the auth endpoint
    try {
      // Send a request to the auth API to check if the email exists
      const response = await fetch(`${pb.baseUrl}/api/collections/users/records?filter=(LOWER(email)='${emailToCheckLower}')`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
        }
      });
      
      const data = await response.json();
      
      // Check if any items were returned (excluding current user)
      if (data && data.items && data.items.length > 0) {
        const currentUserId = pb.authStore.model?.id;
        // Filter out the current user's record
        const otherUsers = data.items.filter((item: any) => item.id !== currentUserId);
        return otherUsers.length > 0;
      }
    } catch (directError) {
      console.error('Error in direct API check for email:', directError);
      // Continue with the flow, don't throw
    }
    
    return false;
  } catch (error) {
    console.error('Error checking email existence:', error);
    // Re-throw to be handled by the caller
    throw error;
  }
};

// Helper function to verify if the current password is correct
const verifyCurrentPassword = async (password: string): Promise<boolean> => {
  try {
    // Get current user data
    const userId = pb.authStore.model?.id;
    const userEmail = pb.authStore.model?.email;
    
    if (!userId || !userEmail) {
      return false;
    }
    
    // Try to authenticate with the current email and provided password
    try {
      // Create a new PocketBase instance to avoid affecting the current session
      const tempPb = new PocketBase("http://127.0.0.1:8090");
      
      // Make sure email is lowercase for consistency
      const lowercaseEmail = userEmail.toLowerCase();
      
      // Attempt to authenticate with the provided credentials
      await tempPb.collection('users').authWithPassword(lowercaseEmail, password);
      
      // If authentication succeeds, the password is correct
      return true;
    } catch (authError: any) {
      // If authentication fails due to invalid credentials, the password is incorrect
      if (authError.status === 400) {
        return false;
      }
      
      // For other errors, log them but don't expose to user
      console.error('Error verifying password:', authError);
      throw authError;
    }
  } catch (error) {
    console.error('Error in password verification:', error);
    throw error;
  }
};

// Update password
const updatePassword = async () => {
  // Reset error states
  currentPasswordError.value = false;
  newPasswordError.value = false;
  confirmPasswordError.value = false;
  currentPasswordErrorMessage.value = '';
  newPasswordErrorMessage.value = '';
  confirmPasswordErrorMessage.value = '';
  errorMessage.value = '';
  isUpdatingPassword.value = true;
  passwordUpdateSuccess.value = false;
  
  // Validate password fields
  let isValid = true;
  
  if (!currentPassword.value) {
    currentPasswordError.value = true;
    currentPasswordErrorMessage.value = 'Current password is required';
    isValid = false;
  }
  
  if (!newPassword.value) {
    newPasswordError.value = true;
    newPasswordErrorMessage.value = 'New password is required';
    isValid = false;
  } else if (newPassword.value.length < 8) {
    newPasswordError.value = true;
    newPasswordErrorMessage.value = 'Password must be at least 8 characters';
    isValid = false;
  }
  
  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = true;
    confirmPasswordErrorMessage.value = 'Passwords do not match';
    isValid = false;
  }
  
  if (!isValid) {
    isUpdatingPassword.value = false;
    return;
  }
  
  try {
    const userId = pb.authStore.model?.id;
    if (!userId) {
      isUpdatingPassword.value = false;
      return;
    }
    
    // Verify current password before attempting update
    isVerifyingPassword.value = true;
    try {
      const isPasswordValid = await verifyCurrentPassword(currentPassword.value);
      
      if (!isPasswordValid) {
        currentPasswordError.value = true;
        currentPasswordErrorMessage.value = 'Current password is incorrect';
        isUpdatingPassword.value = false;
        isVerifyingPassword.value = false;
        
        // Add a class to shake the button
        const button = document.querySelector('.password-button');
        if (button) {
          button.classList.add('shake-animation');
          setTimeout(() => {
            button.classList.remove('shake-animation');
          }, 500);
        }
        
        return;
      }
    } catch (verifyError) {
      console.error('Error verifying password:', verifyError);
      errorMessage.value = 'Failed to verify current password. Please try again.';
      isUpdatingPassword.value = false;
      isVerifyingPassword.value = false;
      return;
    } finally {
      isVerifyingPassword.value = false;
    }
    
    // Password is verified, proceed with update
    try {
      // PocketBase expects this format for password changes
      await pb.collection('users').update(userId, {
        oldPassword: currentPassword.value,
        password: newPassword.value,
        passwordConfirm: newPassword.value
      });
      
      // Clear password fields
      currentPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
      
      // Set success state
      passwordUpdateSuccess.value = true;
      
      // Show a brief success message before logging out
      successMessage.value = 'Password updated successfully. For security reasons, you will be logged out.';
      
      // Force logout after successful password change, with a delay to show success feedback
      setTimeout(() => {
        // Clear all auth data
        pb.authStore.clear();
        localStorage.removeItem('pocketbase_auth');
        sessionStorage.removeItem('pocketbase_auth');
        
        // Remove remembered user data to force complete re-login
        localStorage.removeItem('remembered_user');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.replace('/login');
        }, 3000);
      }, 2000);
    } catch (err: any) {
      console.error('Error in password update request:', err);
      
      // Handle specific error cases
      if (err.status === 400) {
        if (err.data?.oldPassword) {
          // Old password is incorrect
          currentPasswordError.value = true;
          currentPasswordErrorMessage.value = 'Current password is incorrect';
        } else if (err.data?.password) {
          // New password doesn't meet requirements
          newPasswordError.value = true;
          newPasswordErrorMessage.value = err.data.password.message || 'Password does not meet requirements';
        } else {
          // Other validation error
          errorMessage.value = err.message || 'Failed to update password. Please check your input.';
        }
      } else {
        // Generic error
        errorMessage.value = err.message || 'Failed to update password. Please try again.';
      }
      
      // Add a class to shake the button
      const button = document.querySelector('.password-button');
      if (button) {
        button.classList.add('shake-animation');
        setTimeout(() => {
          button.classList.remove('shake-animation');
        }, 500);
      }
    }
  } catch (error: any) {
    console.error('Error updating password:', error);
    errorMessage.value = 'Failed to update password. Please try again.';
  } finally {
    isUpdatingPassword.value = false;
  }
};

// Delete account
const deleteAccount = async () => {
  if (!wantToDeleteAccount) {
    errorMessage.value = 'Please confirm that you want to delete your account by checking the box.';
    return;
  }
  
  try {
    const userId = pb.authStore.model?.id;
    if (!userId) return;
    
    await pb.collection('users').delete(userId);
    
    // Clear all authentication data
    pb.authStore.clear();
    localStorage.removeItem('pocketbase_auth');
    sessionStorage.removeItem('pocketbase_auth');
    localStorage.removeItem('remembered_user');
    
    // Show brief success message
    successMessage.value = 'Your account has been deleted successfully.';
    
    // Force redirect to login page after a short delay
    setTimeout(() => {
      window.location.replace('/login');
    }, 1500);
  } catch (error) {
    console.error('Error deleting account:', error);
    errorMessage.value = 'Failed to delete account. Please try again.';
  }
};

// Function to handle profile image upload
const triggerFileUpload = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    profileImageFile.value = input.files[0];
    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target) {
        profileImageUrl.value = e.target.result as string;
      }
    };
    reader.readAsDataURL(profileImageFile.value);
  }
};

// Enhanced onMounted with animations and prioritized data loading
onMounted(async () => {
  // Fetch user data first
  await fetchUserData();
  
  // Start security checks only after data is loaded
  startSecurityChecks();
  
  // Trigger card entry animations
  setTimeout(() => {
    isPageLoaded.value = true;
  }, 100);
  
  setTimeout(() => {
    cardEntryComplete.value = true;
  }, 800); // After all cards have entered
});

// Add onBeforeUnmount hook to clean up intervals
onBeforeUnmount(() => {
  stopSecurityChecks();
});

// Security check interval (in milliseconds)
const SECURITY_CHECK_INTERVAL = 5000; // Check every 5 seconds
let securityCheckInterval: number | null = null;

// Force logout with a message
const forceLogout = (message: string = "You have been logged out for security reasons.") => {
  // Clear all auth data
  pb.authStore.clear();
  localStorage.removeItem('pocketbase_auth');
  sessionStorage.removeItem('pocketbase_auth');
  localStorage.removeItem('remembered_user');
  
  // Create a temporary element to show the message
  const alertDiv = document.createElement('div');
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '20px';
  alertDiv.style.left = '50%';
  alertDiv.style.transform = 'translateX(-50%)';
  alertDiv.style.backgroundColor = '#f56565';
  alertDiv.style.color = 'white';
  alertDiv.style.padding = '1rem';
  alertDiv.style.borderRadius = '0.5rem';
  alertDiv.style.zIndex = '9999';
  alertDiv.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  
  // Redirect to login page after brief delay
  setTimeout(() => {
    window.location.replace('/login');
  }, 2000);
};

// Verify user account exists and is verified
const verifyUserAccount = async () => {
  try {
    // Skip if not authenticated
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
      return;
    }
    
    const userId = pb.authStore.model.id;
    
    // Check if user still exists in database
    try {
      const userData = await pb.collection('users').getOne(userId);
      
      // Check if user is verified
      if (userData.verified === false) {
        console.warn("Security alert: User account is not verified");
        forceLogout("Your account has not been verified. Please verify your email address to continue.");
        return;
      }
      
      // User exists and is verified, continue as normal
    } catch (error: any) {
      // User not found in database or other error occurred
      if (error.status === 404) {
        console.warn("Security alert: User account no longer exists");
        forceLogout("Your account could not be verified. Please log in again.");
      } else if (error.status === 401 || error.status === 403) {
        // Authentication or authorization error
        console.warn("Security alert: Authentication error");
        forceLogout("Your session has expired. Please log in again.");
      }
    }
  } catch (error) {
    console.error("Error during security check:", error);
  }
};

// Verify token validity
const verifyTokenValidity = () => {
  // Check if token is expired or will expire soon
  if (pb.authStore.isValid && pb.authStore.token) {
    try {
      const tokenData = JSON.parse(atob(pb.authStore.token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      // If token is expired or will expire in the next minute
      if (expirationTime < currentTime + 60000) {
        console.warn("Security alert: Token expired or expiring soon");
        forceLogout("Your session has expired. Please log in again.");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      // If we can't parse the token, force logout as a precaution
      forceLogout("Session validation error. Please log in again.");
    }
  }
};

// Start security checks
const startSecurityChecks = () => {
  // Run checks immediately
  verifyUserAccount();
  verifyTokenValidity();
  
  // Set up interval for security checks
  securityCheckInterval = window.setInterval(() => {
    verifyUserAccount();
    verifyTokenValidity();
  }, SECURITY_CHECK_INTERVAL);
};

// Stop security checks
const stopSecurityChecks = () => {
  if (securityCheckInterval) {
    clearInterval(securityCheckInterval);
    securityCheckInterval = null;
  }
};
</script>

<template>
  <div
    class="min-h-screen animated-bg relative overflow-hidden p-4 md:p-6"
  >
    <!-- Full page loading overlay -->
    <div v-if="isLoadingUserData && !isPageLoaded" class="fixed inset-0 bg-[#0a0e1a] flex items-center justify-center z-50">
      <div class="flex flex-col items-center">
        <div class="loading-spinner mb-4"></div>
        <div class="text-white text-lg">Loading user information...</div>
      </div>
    </div>
    
    <div class="space-y-6 max-w-3xl mx-auto">
      <!-- Success notification for email change -->
      <div 
        v-if="successMessage" 
        class="fixed top-4 right-4 left-4 md:left-auto md:max-w-md bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 shadow-lg transform transition-all duration-500 ease-out"
        :class="{ 'translate-y-0 opacity-100': successMessage, 'translate-y-[-20px] opacity-0': !successMessage }"
      >
        <div class="flex">
          <div class="py-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Success</p>
            <p class="text-sm">{{ successMessage }}</p>
          </div>
        </div>
      </div>
      
      <!-- Basic Information Card with animation -->
      <div 
        class="bg-white rounded-lg shadow p-6 transform transition-all duration-500 ease-out"
        :class="{ 
          'translate-y-0 opacity-100': isPageLoaded, 
          'translate-y-12 opacity-0': !isPageLoaded 
        }"
      >
        <h2 class="text-xl font-bold mb-4">Basic Information</h2>
        
        <!-- Loading indicator for the entire card -->
        <div v-if="isLoadingUserData" class="space-y-4">
          <div class="animate-pulse flex flex-col space-y-4">
            <!-- Profile photo skeleton -->
            <div class="flex items-center space-x-4 col-span-full">
              <div class="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div class="flex-1">
                <div class="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
            
            <!-- Name field skeleton -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                <div class="h-10 bg-gray-200 rounded w-full"></div>
              </div>
              
              <!-- Email field skeleton -->
              <div class="space-y-2">
                <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                <div class="h-10 bg-gray-200 rounded w-full"></div>
              </div>
              
              <!-- Department field skeleton -->
              <div class="space-y-2">
                <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                <div class="h-10 bg-gray-200 rounded w-full"></div>
              </div>
              
              <!-- Role field skeleton -->
              <div class="space-y-2">
                <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                <div class="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Profile Photo -->
          <div class="flex items-center space-x-4 col-span-full">
            <div class="relative cursor-pointer group" @click="triggerFileUpload">
              <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                <img v-if="profileImageUrl" :src="profileImageUrl" alt="Profile" class="w-full h-full object-cover" />
                <User v-else class="w-8 h-8 text-gray-500" />
              </div>
              
              <!-- Hover overlay -->
              <div class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera class="w-6 h-6 text-white" />
              </div>
              
              <!-- Hidden file input -->
              <input 
                ref="fileInputRef"
                type="file" 
                accept="image/*"
                class="hidden" 
                @change="handleFileSelect"
              />
            </div>
            <div>
              <div class="text-sm text-gray-500">This will be displayed on your profile.</div>
              
              <!-- Show selected file name when a file is selected -->
              <div v-if="profileImageFile" class="mt-1 text-xs text-blue-600 flex items-center">
                <span class="truncate max-w-[200px]">{{ profileImageFile.name }}</span>
                <button 
                  @click.stop="profileImageFile = null" 
                  class="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <!-- Error message for upload -->
              <p v-if="imageUploadError" class="mt-1 text-xs text-red-600">{{ imageUploadError }}</p>
            </div>
          </div>
          
          <!-- Name with focus animation -->
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2">Name</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User class="h-5 w-5 text-gray-400" />
              </div>
              <input 
                v-model="name" 
                type="text" 
                class="pl-10 w-full p-2 border rounded-md focus-animated"
                :class="{ 
                  'border-red-500 bg-red-50 input-error': nameError,
                }"
              />
            </div>
            <p v-if="nameError" class="mt-1 text-sm text-red-600 font-medium">{{ nameErrorMessage }}</p>
          </div>
          
          <!-- Email with focus animation -->
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2">Email</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input 
                v-model="email" 
                type="email" 
                class="pl-10 w-full p-2 border rounded-md focus-animated"
                :class="{ 
                  'border-red-500 bg-red-50 input-error': emailError 
                }"
              />
            </div>
            <p v-if="emailError" class="mt-1 text-sm text-red-600 font-medium">{{ emailErrorMessage }}</p>
            
            <!-- Email verification status notification -->
            <div 
              v-if="isEmailVerificationSent" 
              class="mt-3 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-md flex items-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="text-sm">
                <p class="font-medium">Verification email sent</p>
                <p class="mt-1">A verification link has been sent to <span class="font-semibold">{{ newEmailAddress || email }}</span>. Please check your inbox and click the link to confirm your new email address.</p>
              </div>
            </div>
          </div>
          
          <!-- Department dropdown with focus animation -->
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2">Department</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <select 
                v-model="department" 
                class="pl-10 w-full p-2 border rounded-md appearance-none bg-white focus-animated"
                :class="{ 
                  'border-red-500 bg-red-50 input-error': departmentError 
                }"
              >
                <option value="" disabled>Select department</option>
                <option v-for="dept in departments" :key="dept" :value="dept">
                  {{ dept }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg class="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <p v-if="departmentError" class="mt-1 text-sm text-red-600 font-medium">{{ departmentErrorMessage }}</p>
          </div>
          
          <!-- Role (Read-only) -->
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2">Role</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <input 
                v-model="role" 
                type="text" 
                readonly
                class="pl-10 w-full p-2 border rounded-md bg-gray-100"
              />
            </div>
          </div>
        </div>
        
        <div class="mt-4 flex justify-end">
          <button 
            @click="updateBasicInfo"
            :disabled="isUpdatingBasicInfo || (!basicInfoChanged && !isEmailVerificationSent)"
            class="relative px-4 py-2 rounded-md transition-colors overflow-hidden basic-info-button"
            :class="{
              'bg-[#6A5CFE] text-white hover:bg-[#7C6CFF]': !basicInfoUpdateSuccess && !isUpdatingBasicInfo && (basicInfoChanged || isEmailVerificationSent),
              'bg-gray-400 text-white cursor-not-allowed': isUpdatingBasicInfo || (!basicInfoChanged && !isEmailVerificationSent),
              'bg-[#6A5CFE] text-white': basicInfoUpdateSuccess
            }"
          >
            <!-- Success background animation -->
            <div v-if="basicInfoUpdateSuccess" class="success-bg"></div>
            
            <div class="relative z-10 flex items-center gap-2">
              <Check v-if="basicInfoUpdateSuccess" class="w-4 h-4" />
              <Save v-else class="w-4 h-4" />
              {{ isUpdatingBasicInfo ? 'Updating...' : 
                 (basicInfoUpdateSuccess ? 'Updated!' : 
                 (profileImageFile ? 'Update Profile & Photo' : 
                 (isEmailVerificationSent ? 'Verification Sent' : 'Update Profile'))) }}
            </div>
          </button>
        </div>
      </div>
      
      <!-- Password Security Card with animation -->
      <div 
        class="bg-white rounded-lg shadow p-6 transform transition-all duration-500 ease-out"
        :class="{ 
          'translate-y-0 opacity-100': isPageLoaded, 
          'translate-y-12 opacity-0': !isPageLoaded 
        }"
        style="transition-delay: 150ms;"
      >
        <h2 class="text-xl font-bold mb-4">Password Security</h2>
        
        <div class="space-y-4">
          <!-- Current Password with focus animation -->
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2">Enter current password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input 
                v-model="currentPassword" 
                type="password" 
                class="pl-10 w-full p-2 border rounded-md focus-animated"
                :class="{ 
                  'border-red-500 bg-red-50 input-error': currentPasswordError 
                }"
                placeholder="Enter your current password"
              />
              <!-- No visibility toggle button -->
            </div>
            <p v-if="currentPasswordError" class="mt-1 text-sm text-red-600 font-medium">{{ currentPasswordErrorMessage }}</p>
          </div>
          
          <!-- New Password with focus animation -->
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2">Enter new password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input 
                v-model="newPassword" 
                type="password"
                class="pl-10 w-full p-2 border rounded-md focus-animated"
                :class="{ 
                  'border-red-500 bg-red-50 input-error': newPasswordError 
                }"
                placeholder="Create a new password (min 8 chars)"
              />
              <!-- No visibility toggle button -->
            </div>
            <p v-if="newPasswordError" class="mt-1 text-sm text-red-600 font-medium">{{ newPasswordErrorMessage }}</p>
          </div>
          
          <!-- Confirm New Password with focus animation -->
          <div>
            <label class="block text-gray-700 text-sm font-medium mb-2">Confirm new password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input 
                v-model="confirmPassword" 
                type="password"
                class="pl-10 w-full p-2 border rounded-md focus-animated"
                :class="{ 
                  'border-red-500 bg-red-50 input-error': confirmPasswordError 
                }"
                placeholder="Re-enter your new password"
              />
              <!-- No visibility toggle button -->
            </div>
            <p v-if="confirmPasswordError" class="mt-1 text-sm text-red-600 font-medium">{{ confirmPasswordErrorMessage }}</p>
          </div>
        </div>
        
        <div class="mt-4 flex justify-end">
          <button 
            @click="updatePassword"
            :disabled="isUpdatingPassword || !passwordFieldsHaveValues"
            class="relative px-4 py-2 rounded-md transition-colors overflow-hidden password-button"
            :class="{
              'bg-[#6A5CFE] text-white hover:bg-[#7C6CFF]': !passwordUpdateSuccess && !isUpdatingPassword && passwordFieldsHaveValues,
              'bg-gray-400 text-white cursor-not-allowed': isUpdatingPassword || !passwordFieldsHaveValues,
              'bg-[#6A5CFE] text-white': passwordUpdateSuccess
            }"
          >
            <!-- Success background animation -->
            <div v-if="passwordUpdateSuccess" class="success-bg"></div>
            
            <div class="relative z-10 flex items-center gap-2">
              <Check v-if="passwordUpdateSuccess" class="w-4 h-4" />
              <Save v-else class="w-4 h-4" />
              {{ isUpdatingPassword ? (isVerifyingPassword ? 'Verifying...' : 'Updating...') : (passwordUpdateSuccess ? 'Updated!' : 'Update') }}
            </div>
          </button>
        </div>
      </div>
      
      <!-- Delete Account Card with animation -->
      <div 
        class="bg-white rounded-lg shadow p-6 transform transition-all duration-500 ease-out"
        :class="{ 
          'translate-y-0 opacity-100': isPageLoaded, 
          'translate-y-12 opacity-0': !isPageLoaded 
        }"
        style="transition-delay: 300ms;"
      >
        <h2 class="text-xl font-bold mb-4">Delete your account</h2>
        
        <p class="text-gray-600 mb-4">
          When you delete your account, you will have to create a new one.
          This action will also permanently delete your account. Are you sure
          you want to delete?
        </p>
        
        <div class="flex items-center mb-4">
          <input 
            id="delete-confirmation" 
            type="checkbox" 
            v-model="wantToDeleteAccount"
            class="mr-2"
          />
          <label for="delete-confirmation" class="text-gray-700">Confirm that I want to <span class="text-red-600">delete my account</span></label>
        </div>
        
        <div class="flex justify-end">
          <button 
            @click="deleteAccount"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors relative overflow-hidden"
            :disabled="!wantToDeleteAccount"
            :class="{ 
              'opacity-50 cursor-not-allowed': !wantToDeleteAccount,
              'shake-animation': errorMessage && !wantToDeleteAccount 
            }"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Input focus animations */
.focus-animated:focus {
  @apply ring-2 ring-purple-500 transform transition-all duration-300 ease-in-out;
  transform: scale(1.01);
}

/* Button success animation */
@keyframes fillBg {
  0% { width: 0; }
  100% { width: 100%; }
}

.success-bg {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #10B981; /* green-500 */
  z-index: 0;
  animation: fillBg 0.4s ease-out forwards;
}

/* Button error animation */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.shake-animation {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

/* Input error animation */
.input-error {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

/* Animated gradient background */
@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.animated-bg {
  background: linear-gradient(135deg, #0a0e1a, #1a1f36, #0a0e1a);
  background-size: 400% 400%;
  animation: gradientBG 20s ease infinite;
}

/* Loading spinner animation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #6A5CFE;
  animation: spin 1s ease-in-out infinite;
}
</style> 