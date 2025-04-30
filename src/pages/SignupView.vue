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
            <div class="mt-2 flex space-x-4">
              <a 
                href="#" 
                @click.prevent="navigateToLogin" 
                class="text-blue-600 hover:underline"
              >
                Sign in now
              </a>
              <button 
                @click="resendVerification" 
                class="text-blue-600 hover:underline"
                :disabled="resendingVerification"
              >
                {{ resendingVerification ? 'Sending...' : 'Resend verification email' }}
              </button>
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
                :class="['w-full px-4 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200', 
                  nameError ? 'border-red-500 bg-red-50' : 'border-gray-300']"
              >
              <p v-if="nameError" class="text-sm text-red-600 font-medium">{{ nameError }}</p>
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
                :class="['w-full px-4 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200', 
                  emailError ? 'border-red-500 bg-red-50' : 'border-gray-300']"
              >
              <p v-if="emailError" class="text-sm text-red-600 font-medium">{{ emailError }}</p>
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
                  I agree to the <a href="https://www.dti.gov.ph/terms-and-conditions/" class="text-blue-600 hover:underline" target="_blank" >Terms and Conditions</a> and <a href="https://www.dti.gov.ph/privacy-policy/"  class="text-blue-600 hover:underline" target="_blank">Privacy Policy</a>
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
      
      // For resending verification email
      resendingVerification: false,
      userEmail: '', // To store email after successful registration
      
      // PocketBase instance
      pb: new PocketBase('http://127.0.0.1:8090')
    };
  },
  
  methods: {
    async verifyCollectionSchema() {
      // Remove this method as it requires admin authentication
    },
    
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
      // First validate the form
      if (!this.validateForm()) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        // Create the user in PocketBase
        const userData = {
          email: this.email.toLowerCase(),
          password: this.password,
          passwordConfirm: this.confirmPassword,
          name: this.name,
          department: this.department,
          role: 'user',
          emailVisibility: true
        };
        
        // Create the user
        const record = await this.pb.collection('users').create(userData);
        
        // Send verification email
        await this.pb.collection('users').requestVerification(userData.email);
        
        // Save credentials before displaying success message
        const savedEmail = this.email.toLowerCase();
        this.userEmail = savedEmail; // Store email for resend functionality
        const savedPassword = this.password;
        
        // Display success message including verification instructions
        this.successMessage = 'Account created successfully! A verification email has been sent to your email address. Please check your inbox and follow the instructions to verify your account.';
        
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
        // Reset any previous error messages
        this.emailError = '';
        this.nameError = '';
        this.passwordError = '';
        this.errorMessage = '';

        // Log the full error response to help debugging
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('Signup error details:', error);
        }
        
        // Handle PocketBase ClientResponseError
        if (error.response && error.response.data) {
          // Handle response format from some PocketBase versions
          const data = error.response.data;
          
          if (data.email && data.email.code === 'validation_not_unique') {
            this.emailError = 'Email already exists. Please use a different email.';
          } else if (data.name && data.name.code === 'validation_not_unique') {
            this.nameError = 'Name already in use. Please choose a different name.';
          }
        } else if (error.data) {
          // Standard PocketBase error format
          const data = error.data;

          // Check for specific field errors
          if (data.email) {
            if (data.email.code === 'validation_not_unique') {
              this.emailError = 'Email already exists. Please use a different email.';
            } else {
              this.emailError = data.email.message || 'Invalid email format';
            }
          }
          
          if (data.name) {
            if (data.name.code === 'validation_not_unique') {
              this.nameError = 'Name already in use. Please choose a different name.';
            } else {
              this.nameError = data.name.message || 'Invalid name format';
            }
          }
          
          if (data.password) {
            this.passwordError = data.password.message || 'Invalid password';
          }
        } else if (error.message) {
          // Extract field errors from the error message if possible
          const msg = error.message.toLowerCase();
          
          if (msg.includes('email') && msg.includes('unique')) {
            this.emailError = 'Email already exists. Please use a different email.';
          } else if (msg.includes('name') && msg.includes('unique')) {
            this.nameError = 'Name already in use. Please choose a different name.';
          } else {
            this.errorMessage = error.message;
          }
        } else {
          this.errorMessage = 'Failed to create account. Please try again later.';
        }

        // If we have no specific field errors but got an error response, show a general message
        if (!this.emailError && !this.nameError && !this.passwordError && !this.errorMessage) {
          this.errorMessage = 'Failed to create account. Please check your information and try again.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    async resendVerification() {
      if (this.resendingVerification) return;
      
      this.resendingVerification = true;
      
      try {
        // If we have saved the email from registration, use it
        const emailToVerify = this.userEmail || sessionStorage.getItem('newUserEmail');
        
        if (!emailToVerify) {
          this.successMessage = 'Cannot resend verification email. Email address not found.';
          return;
        }
        
        // Request verification email
        await this.pb.collection('users').requestVerification(emailToVerify);
        
        // Update success message
        this.successMessage = 'Verification email has been resent! Please check your inbox and follow the instructions to verify your account.';
      } catch (error) {
        console.error('Failed to resend verification:', error);
        this.successMessage = 'Failed to resend verification email. Please try again later.';
      } finally {
        this.resendingVerification = false;
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