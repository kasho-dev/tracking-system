<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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

const router = useRouter();

// Fetch user data
const fetchUserData = async () => {
  try {
    if (pb.authStore.isValid) {
      const userId = pb.authStore.model?.id;
      if (!userId) return;
      
      const userData = await pb.collection('users').getOne(userId);
      
      name.value = userData.name || '';
      email.value = userData.email || '';
      department.value = userData.department || '';
      role.value = userData.role || 'user';
      
      // Get avatar URL if it exists
      if (userData.avatar) {
        profileImageUrl.value = pb.getFileUrl(userData, userData.avatar);
      } else {
        profileImageUrl.value = '';
      }
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
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
  successMessage.value = '';
  errorMessage.value = '';
  isUpdatingBasicInfo.value = true;
  basicInfoUpdateSuccess.value = false;
  
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
    
    await pb.collection('users').update(userId, {
      name: name.value,
      email: email.value,
      department: department.value
    });
    
    successMessage.value = 'Basic information updated successfully';
    basicInfoUpdateSuccess.value = true;
    
    // Reset success state after 3 seconds
    setTimeout(() => {
      basicInfoUpdateSuccess.value = false;
      successMessage.value = '';
    }, 3000);
  } catch (error: any) {
    console.error('Error updating user information:', error);
    errorMessage.value = 'Failed to update information. Please try again.';
    
    // Add a class to shake the button
    const button = document.querySelector('.basic-info-button');
    if (button) {
      button.classList.add('shake-animation');
      setTimeout(() => {
        button.classList.remove('shake-animation');
      }, 500);
    }
  } finally {
    isUpdatingBasicInfo.value = false;
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
  successMessage.value = '';
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
    
    // Instead of trying to authenticate, use the password change endpoint directly
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
      
      successMessage.value = 'Password updated successfully';
      passwordUpdateSuccess.value = true;
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        passwordUpdateSuccess.value = false;
        successMessage.value = '';
      }, 3000);
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
    pb.authStore.clear();
    router.push('/login');
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

const uploadProfileImage = async () => {
  if (!profileImageFile.value) return;
  
  try {
    isUploadingImage.value = true;
    imageUploadError.value = '';
    
    const userId = pb.authStore.model?.id;
    if (!userId) {
      isUploadingImage.value = false;
      return;
    }
    
    const formData = new FormData();
    formData.append('avatar', profileImageFile.value);
    
    // Update the user with the new avatar
    await pb.collection('users').update(userId, formData);
    
    successMessage.value = 'Profile picture updated successfully';
    profileImageFile.value = null;
    
    // Refetch user data to get updated avatar URL
    await fetchUserData();
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    imageUploadError.value = 'Failed to upload image. Please try again.';
  } finally {
    isUploadingImage.value = false;
  }
};

// Enhanced onMounted with animations
onMounted(() => {
  fetchUserData();
  
  // Trigger card entry animations
  setTimeout(() => {
    isPageLoaded.value = true;
  }, 100);
  
  setTimeout(() => {
    cardEntryComplete.value = true;
  }, 800); // After all cards have entered
});
</script>

<template>
  <div class="bg-[#0A0E1A] min-h-screen p-6">
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Basic Information Card with animation -->
      <div 
        class="bg-white rounded-lg shadow p-6 transform transition-all duration-500 ease-out"
        :class="{ 
          'translate-y-0 opacity-100': isPageLoaded, 
          'translate-y-12 opacity-0': !isPageLoaded 
        }"
      >
        <h2 class="text-xl font-bold mb-4">Basic Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Profile Photo -->
          <div class="flex items-center space-x-4 col-span-full">
            <div class="relative cursor-pointer group" @click="triggerFileUpload">
              <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                <img v-if="profileImageUrl" :src="profileImageUrl" alt="Profile" class="w-full h-full object-cover" />
                <User v-else class="w-8 h-8 text-gray-500" />
              </div>
              <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              
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
              
              <!-- File upload button shows up when a file is selected -->
              <button 
                v-if="profileImageFile" 
                @click.stop="uploadProfileImage" 
                class="mt-2 flex items-center text-xs text-white bg-[#6A5CFE] px-2 py-1 rounded hover:bg-[#7C6CFF]"
                :disabled="isUploadingImage"
              >
                <Upload v-if="!isUploadingImage" class="w-3 h-3 mr-1" />
                <span>{{ isUploadingImage ? 'Uploading...' : 'Upload Photo' }}</span>
              </button>
              
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
                  'border-red-500 input-error': nameError,
                }"
              />
            </div>
            <p v-if="nameError" class="mt-1 text-sm text-red-600">{{ nameErrorMessage }}</p>
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
                  'border-red-500 input-error': emailError 
                }"
              />
            </div>
            <p v-if="emailError" class="mt-1 text-sm text-red-600">{{ emailErrorMessage }}</p>
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
                  'border-red-500 input-error': departmentError 
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
            <p v-if="departmentError" class="mt-1 text-sm text-red-600">{{ departmentErrorMessage }}</p>
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
            :disabled="isUpdatingBasicInfo"
            class="relative px-4 py-2 rounded-md transition-colors overflow-hidden basic-info-button"
            :class="{
              'bg-[#6A5CFE] text-white hover:bg-[#7C6CFF]': !basicInfoUpdateSuccess && !isUpdatingBasicInfo,
              'bg-gray-400 text-white cursor-not-allowed': isUpdatingBasicInfo,
              'bg-[#6A5CFE] text-white': basicInfoUpdateSuccess
            }"
          >
            <!-- Success background animation -->
            <div v-if="basicInfoUpdateSuccess" class="success-bg"></div>
            
            <div class="relative z-10 flex items-center gap-2">
              <Check v-if="basicInfoUpdateSuccess" class="w-4 h-4" />
              <Save v-else class="w-4 h-4" />
              {{ isUpdatingBasicInfo ? 'Updating...' : (basicInfoUpdateSuccess ? 'Updated!' : 'Update') }}
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
                  'border-red-500 input-error': currentPasswordError 
                }"
              />
            </div>
            <p v-if="currentPasswordError" class="mt-1 text-sm text-red-600">{{ currentPasswordErrorMessage }}</p>
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
                  'border-red-500 input-error': newPasswordError 
                }"
              />
            </div>
            <p v-if="newPasswordError" class="mt-1 text-sm text-red-600">{{ newPasswordErrorMessage }}</p>
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
                  'border-red-500 input-error': confirmPasswordError 
                }"
              />
            </div>
            <p v-if="confirmPasswordError" class="mt-1 text-sm text-red-600">{{ confirmPasswordErrorMessage }}</p>
          </div>
        </div>
        
        <div class="mt-4 flex justify-end">
          <button 
            @click="updatePassword"
            :disabled="isUpdatingPassword"
            class="relative px-4 py-2 rounded-md transition-colors overflow-hidden password-button"
            :class="{
              'bg-[#6A5CFE] text-white hover:bg-[#7C6CFF]': !passwordUpdateSuccess && !isUpdatingPassword,
              'bg-gray-400 text-white cursor-not-allowed': isUpdatingPassword,
              'bg-[#6A5CFE] text-white': passwordUpdateSuccess
            }"
          >
            <!-- Success background animation -->
            <div v-if="passwordUpdateSuccess" class="success-bg"></div>
            
            <div class="relative z-10 flex items-center gap-2">
              <Check v-if="passwordUpdateSuccess" class="w-4 h-4" />
              <Save v-else class="w-4 h-4" />
              {{ isUpdatingPassword ? 'Updating...' : (passwordUpdateSuccess ? 'Updated!' : 'Update') }}
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
      
      <!-- Success Message with animation -->
      <transition
        name="message"
        enter-active-class="transform transition duration-500 ease-out"
        leave-active-class="transform transition duration-300 ease-in"
        enter-from-class="opacity-0 scale-95 translate-y-2"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div v-if="successMessage" class="bg-green-100 text-green-800 p-4 rounded-md">
          {{ successMessage }}
        </div>
      </transition>
      
      <!-- Error Message with animation -->
      <div 
        v-if="errorMessage" 
        class="bg-red-100 text-red-800 p-4 rounded-md flex items-center transform transition-all duration-300 ease-out shake-animation"
        :class="{ 'translate-y-0 opacity-100': cardEntryComplete, 'translate-y-4 opacity-0': !cardEntryComplete }"
      >
        <AlertCircle class="w-5 h-5 mr-2" />
        {{ errorMessage }}
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
</style> 