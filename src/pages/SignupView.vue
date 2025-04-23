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
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">Create Account</h1>
        
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
                Sign in now
              </a>
            </div>
          </div>
        </transition>
        
        <form v-if="!successMessage" @submit.prevent="handleSignup" class="space-y-6">
          <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 transform translate-y-4"
            enter-to-class="opacity-100 transform translate-y-0"
          >
            <div v-if="errorMessage" class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {{ errorMessage }}
            </div>
          </transition>
          
          <!-- Name Field -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 transform -translate-x-10"
            enter-to-class="opacity-100 transform translate-x-0"
          >
            <div class="space-y-2">
              <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="name"
                v-model="name"
                required
                placeholder="Enter your full name"
                class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
              <p v-if="nameError" class="text-sm text-red-600">{{ nameError }}</p>
            </div>
          </transition>
          
          <!-- Email Field -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 transform -translate-x-10"
            enter-to-class="opacity-100 transform translate-x-0"
            :style="{ transitionDelay: '100ms' }"
          >
            <div class="space-y-2">
              <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                id="email"
                v-model="email"
                required
                placeholder="Enter your email"
                class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
              <p v-if="emailError" class="text-sm text-red-600">{{ emailError }}</p>
            </div>
          </transition>
          
          <!-- Department Selection -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 transform -translate-x-10"
            enter-to-class="opacity-100 transform translate-x-0"
            :style="{ transitionDelay: '200ms' }"
          >
            <div class="space-y-2">
              <label for="department" class="block text-sm font-medium text-gray-700">Department</label>
              <div class="relative">
                <select
                  id="department"
                  v-model="department"
                  required
                  class="w-full appearance-none px-4 py-3 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="" disabled>Select your department</option>
                  <option value="Consumer Protection Division">Consumer Protection Division</option>
                  <option value="Finance Division">Finance Division</option>
                  <option value="Business Division">Business Division</option>
                </select>
                <!-- Custom dropdown arrow with proper positioning -->
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <p v-if="departmentError" class="text-sm text-red-600">{{ departmentError }}</p>
            </div>
          </transition>
          
          <!-- Password Field -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 transform -translate-x-10"
            enter-to-class="opacity-100 transform translate-x-0"
            :style="{ transitionDelay: '300ms' }"
          >
            <div class="space-y-2">
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <div class="relative">
                <input
                  type="password"
                  id="password"
                  v-model="password"
                  required
                  placeholder="Create a strong password"
                  class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
              </div>
              <p class="text-xs text-gray-500">Password must be at least 8 characters long</p>
              <p v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</p>
            </div>
          </transition>
          
          <!-- Confirm Password Field -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 transform -translate-x-10"
            enter-to-class="opacity-100 transform translate-x-0"
            :style="{ transitionDelay: '400ms' }"
          >
            <div class="space-y-2">
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div class="relative">
                <input
                  type="password"
                  id="confirmPassword"
                  v-model="confirmPassword"
                  required
                  placeholder="Re-enter your password"
                  class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
              </div>
              <p v-if="confirmPasswordError" class="text-sm text-red-600">{{ confirmPasswordError }}</p>
            </div>
          </transition>
          
          <!-- Terms and Conditions -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 transform -translate-x-10"
            enter-to-class="opacity-100 transform translate-x-0"
            :style="{ transitionDelay: '500ms' }"
          >
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  v-model="acceptTerms"
                  required
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
              </div>
              <div class="ml-3 text-sm">
                <label for="terms" class="text-gray-700">
                  I agree to the <a href="#" class="text-blue-600 hover:underline">Terms and Conditions</a> and <a href="#" class="text-blue-600 hover:underline">Privacy Policy</a>
                </label>
                <p v-if="termsError" class="text-red-600">{{ termsError }}</p>
              </div>
            </div>
          </transition>
          
          <!-- Submit Button -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 transform translate-y-10"
            enter-to-class="opacity-100 transform translate-y-0"
            :style="{ transitionDelay: '600ms' }"
          >
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 active:scale-95 active:shadow-blue-500/75 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <span v-if="!isLoading">Create Account</span>
              <span v-else class="flex justify-center items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            </button>
          </transition>
          
          <!-- Login Link -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            :style="{ transitionDelay: '700ms' }"
          >
            <div class="text-center">
              <p class="text-sm text-gray-700">
                Already have an account? 
                <a @click.prevent="navigateToLogin" href="#" class="text-blue-600 hover:underline">Sign in</a>
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
import { useRouter } from 'vue-router';
import logo from '../assets/logo.png';

export default {
  name: 'SignupView',
  
  setup() {
    const router = useRouter();
    return { router };
  },
  
  data() {
    return {
      name: '',
      email: '',
      department: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      isLoading: false,
      showPassword: false,
      errorMessage: '',
      successMessage: '',
      logo,
      
      // Field validation errors
      nameError: '',
      emailError: '',
      departmentError: '',
      passwordError: '',
      confirmPasswordError: '',
      termsError: '',
      
      // PocketBase instance
      pb: new PocketBase('http://127.0.0.1:8090')
    };
  },
  
  methods: {
    validateForm() {
      let isValid = true;
      
      // Reset errors
      this.nameError = '';
      this.emailError = '';
      this.departmentError = '';
      this.passwordError = '';
      this.confirmPasswordError = '';
      this.termsError = '';
      this.errorMessage = '';
      
      // Validate name
      if (!this.name.trim()) {
        this.nameError = 'Name is required';
        isValid = false;
      } else if (this.name.length < 2) {
        this.nameError = 'Name must be at least 2 characters long';
        isValid = false;
      }
      
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.email) {
        this.emailError = 'Email is required';
        isValid = false;
      } else if (!emailRegex.test(this.email)) {
        this.emailError = 'Please enter a valid email address';
        isValid = false;
      }
      
      // Validate department
      if (!this.department) {
        this.departmentError = 'Please select your department';
        isValid = false;
      }
      
      // Validate password with just 8 character minimum
      if (!this.password) {
        this.passwordError = 'Password is required';
        isValid = false;
      } else if (this.password.length < 8) {
        this.passwordError = 'Password must be at least 8 characters long';
        isValid = false;
      }
      
      // Validate confirm password
      if (!this.confirmPassword) {
        this.confirmPasswordError = 'Please confirm your password';
        isValid = false;
      } else if (this.password !== this.confirmPassword) {
        this.confirmPasswordError = 'Passwords do not match';
        isValid = false;
      }
      
      // Validate terms acceptance
      if (!this.acceptTerms) {
        this.termsError = 'You must accept the terms and conditions';
        isValid = false;
      }
      
      return isValid;
    },
    
    async handleSignup() {
      if (!this.validateForm()) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        // Create the user in PocketBase
        await this.pb.collection('users').create({
          email: this.email,
          password: this.password,
          passwordConfirm: this.confirmPassword,
          name: this.name,
          department: this.department,
          // Set the default role as 'user'
          role: 'user'
        });
        
        // Save credentials before displaying success message
        const savedEmail = this.email;
        const savedPassword = this.password;
        
        // Display success message
        this.successMessage = 'Account created successfully! You can now sign in with your credentials.';
        
        // Store credentials in sessionStorage for login page to use
        sessionStorage.setItem('newUserEmail', savedEmail);
        sessionStorage.setItem('newUserPassword', savedPassword);
        
        // Reset form
        this.name = '';
        this.email = '';
        this.department = '';
        this.password = '';
        this.confirmPassword = '';
        this.acceptTerms = false;
        
      } catch (error) {
        console.error('Signup failed:', error);
        
        // Handle specific error cases
        if (error.data) {
          // PocketBase ClientResponseError handling
          if (error.data.email?.code === 'validation_not_unique') {
            this.errorMessage = 'This email is already registered. Please use a different email or try logging in.';
          } else if (error.data.password) {
            this.passwordError = 'Password validation failed: ' + error.data.password.message;
          } else {
            this.errorMessage = error.message || 'Failed to create account. Please check your information and try again.';
          }
        } else {
          this.errorMessage = 'An error occurred during signup. Please try again later.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    navigateToLogin() {
      this.router.push('/login');
    }
  },
  
  // Redirect if already logged in
  mounted() {
    if (this.pb.authStore.isValid) {
      this.router.push('/home');
    }
  }
}
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
/* Logo pulse glow */
.logo-pulse {
  animation: pulseGlow 2s ease-in-out infinite;
  max-width: 100px;
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 5px rgba(255,255,255,0.5); }
  50% { box-shadow: 0 0 20px rgba(255,255,255,0.2); }
}
</style> 