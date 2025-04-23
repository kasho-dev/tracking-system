<template>
  <div class="min-h-screen animated-bg relative overflow-hidden flex items-center justify-center p-4">
    <transition
      appear
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 transform scale-95"
      enter-to-class="opacity-100 transform scale-100"
    >
      <div class="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <div class="flex justify-center mb-6">
          <img :src="logo" alt="Logo" class="w-24 mx-auto logo-pulse" />
        </div>
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">Reset Password</h1>
        
        <!-- Success Message -->
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 transform translate-y-4"
          enter-to-class="opacity-100 transform translate-y-0"
        >
          <div v-if="successMessage" class="p-4 mb-6 bg-green-100 border border-green-400 text-green-700 rounded">
            {{ successMessage }}
            <div class="mt-2">
              <a 
                href="#" 
                @click.prevent="navigateToLogin" 
                class="text-blue-600 hover:underline"
              >
                Back to Sign In
              </a>
            </div>
          </div>
        </transition>

        <!-- Error Message -->
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 transform translate-y-4"
          enter-to-class="opacity-100 transform translate-y-0"
        >
          <div v-if="errorMessage" class="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded">
            {{ errorMessage }}
          </div>
        </transition>

        <!-- Password Reset Form -->
        <form @submit.prevent="handlePasswordReset" v-if="!successMessage">
          <!-- Email Input -->
          <div class="mb-6">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div class="relative">
              <input
                id="email"
                v-model="email"
                type="email"
                required
                :class="['w-full px-4 py-3 rounded-md border focus:outline-none focus:ring-2 transition-all duration-300',
                  emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' :
                  'border-gray-300 focus:border-blue-500 focus:ring-blue-200']"
                placeholder="Enter your email"
              />
              <div v-if="emailError" class="mt-1 text-sm text-red-600">{{ emailErrorMessage }}</div>
            </div>
          </div>

          <!-- Submit Button -->
          <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 transform translate-y-4"
            enter-to-class="opacity-100 transform translate-y-0"
          >
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 active:scale-95 active:shadow-blue-500/75 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <span v-if="!isLoading">Reset Password</span>
              <span v-else class="flex justify-center items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            </button>
          </transition>
          
          <!-- Back to Login Link -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            :style="{ transitionDelay: '400ms' }"
          >
            <div class="text-center mt-4">
              <p class="text-sm text-gray-700">
                Remember your password? 
                <router-link to="/login" class="text-blue-600 hover:underline">Sign in</router-link>
              </p>
            </div>
          </transition>
        </form>
      </div>
    </transition>
  </div>
</template>

<script>
import PocketBase from 'pocketbase';
import logo from '../assets/logo.png';

export default {
  name: 'ForgotPasswordView',
  data() {
    return {
      pb: new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'),
      logo,
      email: '',
      isLoading: false,
      successMessage: '',
      errorMessage: '',
      emailError: false,
      emailErrorMessage: ''
    };
  },
  methods: {
    validateForm() {
      let isValid = true;
      
      // Reset errors
      this.emailError = false;
      this.emailErrorMessage = '';
      this.errorMessage = '';
      
      // Email validation
      if (!this.email) {
        this.emailError = true;
        this.emailErrorMessage = 'Email is required';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
        this.emailError = true;
        this.emailErrorMessage = 'Please enter a valid email address';
        isValid = false;
      }
      
      return isValid;
    },
    
    async handlePasswordReset() {
      if (!this.validateForm()) {
        return;
      }
      
      this.isLoading = true;
      this.errorMessage = '';
      
      try {
        // Request password reset using PocketBase's built-in functionality
        await this.pb.collection('users').requestPasswordReset(this.email);
        
        // Show success message
        this.successMessage = 'Password reset instructions have been sent to your email. Please check your inbox and spam folder.';
        
        // Clear the form
        this.email = '';
      } catch (error) {
        console.error('Password reset request failed:', error);
        
        // Handle specific error cases
        if (error.status === 404) {
          this.errorMessage = 'No account found with this email address.';
        } else if (error.status === 400) {
          this.errorMessage = 'Invalid email address. Please check and try again.';
        } else {
          this.errorMessage = error.message || 'Failed to process password reset request. Please try again.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    navigateToLogin() {
      this.$router.push('/login');
    }
  },
  // Hide top navigation on mount
  mounted() {
    // Emit event to parent to hide navigation
    this.$emit('hide-nav');
  },
  // Show navigation when component is destroyed
  beforeUnmount() {
    // Emit event to parent to show navigation
    this.$emit('show-nav');
  }
};
</script>

<style scoped>
/* Add transition delay styling */
[style*="transitionDelay"] {
  transition-delay: var(--delay);
}

/* Animated gradient background */
@keyframes gradientBG {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animated-bg {
  background: linear-gradient(135deg, #0A0E1A, #1A1F36, #0A0E1A);
  background-size: 400% 400%;
  animation: gradientBG 20s ease infinite;
}

.logo-pulse {
  animation: pulseGlow 2s ease-in-out infinite;
  max-width: 100px;
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 5px rgba(255,255,255,0.5); }
  50% { box-shadow: 0 0 20px rgba(255,255,255,0.2); }
}
</style> 