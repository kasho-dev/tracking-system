<template>
  <div class="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
    <transition
      appear
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 transform scale-95"
      enter-to-class="opacity-100 transform scale-100"
    >
      <div class="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">Welcome</h1>
        
        <form @submit.prevent="handleLogin" class="space-y-6">
          <h2 class="text-2xl font-semibold text-center text-gray-700 mb-6">Sign In</h2>
          
          <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 transform translate-y-4"
            enter-to-class="opacity-100 transform translate-y-0"
          >
            <div v-if="errorMessage" class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {{ errorMessage }}
            </div>
          </transition>
          
          <!-- Email Field -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 transform -translate-x-10"
            enter-to-class="opacity-100 transform translate-x-0"
          >
            <div class="space-y-2">
              <label for="email" class="block text-sm font-medium text-gray-700">Email ID</label>
              <input
                type="email"
                id="email"
                v-model="email"
                required
                placeholder="Enter your email"
                class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
            </div>
          </transition>
          
          <!-- Password Field -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 transform -translate-x-10"
            enter-to-class="opacity-100 transform translate-x-0"
            :style="{ transitionDelay: '100ms' }"
          >
            <div class="space-y-2">
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <div class="relative">
                <input
                  type="password"
                  id="password"
                  v-model="password"
                  required
                  placeholder="Enter your password"
                  class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                <!-- No visibility toggle button -->
              </div>
              <p v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</p>
            </div>
          </transition>
          
          <!-- Remember Me & Forgot Password -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 transform -translate-x-10"
            enter-to-class="opacity-100 transform translate-x-0"
            :style="{ transitionDelay: '200ms' }"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  v-model="rememberMe"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
                <label for="remember" class="ml-2 block text-sm text-gray-700">Remember me</label>
              </div>
              
              <a
                href="#"
                class="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                @click.prevent="handleForgotPassword"
              >
                Forget Password
              </a>
            </div>
          </transition>
          
          <!-- Submit Button -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 transform translate-y-10"
            enter-to-class="opacity-100 transform translate-y-0"
            :style="{ transitionDelay: '300ms' }"
          >
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 active:scale-95 active:shadow-blue-500/75 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <span v-if="!isLoading">Sign in</span>
              <span v-else class="flex justify-center items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            </button>
          </transition>
          
          <!-- Sign Up Link -->
          <transition
            appear
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            :style="{ transitionDelay: '400ms' }"
          >
            <div class="text-center mt-4">
              <p class="text-sm text-gray-700">
                Don't have an account? 
                <router-link to="/signup" class="text-blue-600 hover:underline">Create an account</router-link>
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

export default {
  name: 'LoginView',
  
  data() {
    return {
      email: '',
      password: '',
      rememberMe: false,
      isLoading: false,
      errorMessage: '',
      passwordError: '',
      showPassword: false,
      pb: new PocketBase('http://127.0.0.1:8090') // Replace with your PocketBase URL
    }
  },
  
  methods: {
    validateForm() {
      let isValid = true;
      
      // Reset errors
      this.errorMessage = '';
      this.passwordError = '';
      
      // Simple validation for password
      if (!this.password) {
        this.passwordError = 'Password is required';
        isValid = false;
      } else if (this.password.length < 8) {
        this.passwordError = 'Password must be at least 8 characters long';
        isValid = false;
      }
      
      return isValid;
    },
    
    async handleLogin() {
      // Validate form first
      if (!this.validateForm()) {
        return;
      }
      
      this.isLoading = true;
      this.errorMessage = '';
      
      try {
        // Authenticate the user
        const authData = await this.pb.collection('users').authWithPassword(
          this.email,
          this.password
        );
        console.log('Login successful!', authData);
        
        // Redirect to dashboard or home page after successful login
        this.$router.push('/home'); // Change this to your desired route
        
      } catch (error) {
        console.error('Login failed:', error);
        this.errorMessage = 'Invalid email or password. Please try again.';
      } finally {
        this.isLoading = false;
      }
    },

    handleForgotPassword() {
      // Handle forgot password logic
      console.log('Forgot password clicked');
      // You might redirect to a password reset page
      this.$router.push('/forgot-password');
    }
  },

  mounted() {
    // Check if user is already authenticated
    if (this.pb.authStore.isValid) {
      this.$router.push('/home'); // Redirect to dashboard if already logged in
      return;
    }
    
    // Check for credentials from signup
    const newUserEmail = sessionStorage.getItem('newUserEmail');
    const newUserPassword = sessionStorage.getItem('newUserPassword');
    
    if (newUserEmail && newUserPassword) {
      // Populate the login form with credentials from signup
      this.email = newUserEmail;
      this.password = newUserPassword;
      
      // Remove the stored credentials for security
      sessionStorage.removeItem('newUserEmail');
      sessionStorage.removeItem('newUserPassword');
    }
    
    // Try to restore authentication from storage
    const authData = localStorage.getItem('pocketbase_auth') || sessionStorage.getItem('pocketbase_auth');
    if (authData) {
      try {
        this.pb.authStore.import(JSON.parse(authData));
        if (this.pb.authStore.isValid) {
          this.$router.push('/home');
        }
      } catch (e) {
        console.error('Failed to restore auth:', e);
        this.pb.authStore.clear();
        localStorage.removeItem('pocketbase_auth');
        sessionStorage.removeItem('pocketbase_auth');
      }
    }
  }
}
</script>

<style scoped>
/* Add transition delay styling */
[style*="transitionDelay"] {
  transition-delay: var(--delay);
}
</style>