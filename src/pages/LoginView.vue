<template>
  <div
    class="min-h-screen animated-bg relative overflow-hidden flex items-center justify-center p-4"
  >
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

        <!-- Quick Login (Remembered User) -->
        <div v-if="showQuickLogin" class="space-y-6">
          <h2 class="text-2xl font-semibold text-center text-gray-700 mb-6">
            Welcome Back
          </h2>

          <div
            v-if="errorMessage"
            class="p-4 bg-red-100 border border-red-400 text-red-700 rounded"
          >
            {{ errorMessage }}
          </div>

          <div
            v-if="verificationNeededMessage"
            class="p-4 mb-6 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-md shadow-sm"
          >
            <div class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 mt-0.5 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p class="font-medium">Verification Required</p>
                <p class="mt-1">{{ verificationNeededMessage }}</p>
                <div class="mt-3">
                  <button 
                    @click="resendVerification" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 ease-in-out text-sm font-medium flex items-center"
                    :disabled="resendingVerification"
                  >
                    <svg v-if="resendingVerification" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ resendingVerification ? 'Sending verification email...' : 'Resend verification email' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center">
            <button
              @click="quickLogin"
              type="button"
              class="w-auto h-auto flex flex-col items-center cursor-pointer transition-all duration-300 transform hover:scale-105 focus:outline-none"
              :disabled="isLoading"
            >
              <!-- User avatar or default icon -->
              <div
                v-if="rememberedUserAvatar"
                class="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg mb-4"
              >
                <img
                  :src="rememberedUserAvatar"
                  alt="User"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                class="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-500 shadow-lg mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-12 w-12 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>

              <p class="text-lg font-medium text-center text-gray-800">
                {{ rememberedUserName || rememberedUserEmail }}
              </p>
              <p
                class="text-sm text-center text-gray-500 mt-1"
                v-if="!isLoading"
              >
                Click to sign in
              </p>
              <p
                class="text-sm text-center text-blue-600 mt-1 flex items-center"
                v-else
              >
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </p>
            </button>

            <button
              @click="clearQuickLogin"
              class="mt-6 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              type="button"
            >
              Not you?
            </button>
          </div>
        </div>

        <!-- Standard Login Form -->
        <form v-else @submit.prevent="handleLogin" class="space-y-6">
          <h2 class="text-2xl font-semibold text-center text-gray-700 mb-6">
            Sign In
          </h2>

          <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 transform translate-y-4"
            enter-to-class="opacity-100 transform translate-y-0"
          >
            <div
              v-if="errorMessage"
              class="p-4 bg-red-100 border border-red-400 text-red-700 rounded"
            >
              {{ errorMessage }}
            </div>
          </transition>

          <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 transform translate-y-4"
            enter-to-class="opacity-100 transform translate-y-0"
          >
            <div
              v-if="verificationNeededMessage"
              class="p-4 mb-6 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-md shadow-sm"
            >
              <div class="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 mt-0.5 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p class="font-medium">Verification Required</p>
                  <p class="mt-1">{{ verificationNeededMessage }}</p>
                  <div class="mt-3">
                    <button 
                      @click="resendVerification" 
                      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 ease-in-out text-sm font-medium flex items-center"
                      :disabled="resendingVerification"
                    >
                      <svg v-if="resendingVerification" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ resendingVerification ? 'Sending verification email...' : 'Resend verification email' }}
                    </button>
                  </div>
                </div>
              </div>
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
              <label for="email" class="block text-sm font-medium text-gray-700"
                >Email ID</label
              >
              <input
                type="email"
                id="email"
                v-model="email"
                required
                placeholder="Enter your email"
                class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
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
              <label
                for="password"
                class="block text-sm font-medium text-gray-700"
                >Password</label
              >
              <div class="relative">
                <input
                  type="password"
                  id="password"
                  v-model="password"
                  required
                  placeholder="Enter your password"
                  class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <!-- No visibility toggle button -->
              </div>
              <p v-if="passwordError" class="text-sm text-red-600">
                {{ passwordError }}
              </p>
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
                />
                <label for="remember" class="ml-2 block text-sm text-gray-700"
                  >Remember me</label
                >
              </div>

              <a
                href="#"
                class="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                @click.prevent="handleForgotPassword"
              >
                Forgot Password?
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
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
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
                <router-link to="/signup" class="text-blue-600 hover:underline"
                  >Create an account</router-link
                >
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
      verificationNeededMessage: '',
      resendingVerification: false,
      logo,
      pb: new PocketBase('http://127.0.0.1:8090'), // Replace with your PocketBase URL

      // Quick login state
      showQuickLogin: false,
      rememberedUserEmail: '',
      rememberedUserName: '',
      rememberedUserAvatar: '',
      rememberedUserPassword: '',
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
      this.verificationNeededMessage = '';

      try {
        // Convert email to lowercase for case insensitivity
        const lowercaseEmail = this.email.toLowerCase();
        
        // Authenticate the user with lowercase email
        const authData = await this.pb.collection('users').authWithPassword(
          lowercaseEmail,
          this.password
        );

        // Check if login succeeded but user is not verified
        console.log("Auth successful, checking verification status...");
        if (authData && this.pb.authStore.isValid) {
          console.log("Verification status:", authData.record.verified);
          
          // If user is not verified, prevent login and show message
          if (authData.record.verified === false) {
            console.log("User not verified, clearing auth and showing message");
            // Clear the auth since we don't want unverified users to proceed
            this.pb.authStore.clear();
            localStorage.removeItem('pocketbase_auth');
            sessionStorage.removeItem('pocketbase_auth');
            
            // Display verification message
            this.verificationNeededMessage = 'Your email address has not been verified. Please check your inbox and spam folder for the verification email and confirm your account before signing in.';
            this.isLoading = false;
            return;
          }

          console.log('Login successful and user is verified!', authData);

          // Store auth data based on remember me option
          const authStoreData = this.pb.authStore.exportToCookie();

          if (this.rememberMe) {
            // Save to localStorage for persistent login
            localStorage.setItem('pocketbase_auth', authStoreData);

            // Save additional user info for quick login
            const userInfo = {
              email: lowercaseEmail,
              password: this.password, // Store encrypted or hashed in a real production app
              name: this.pb.authStore.model?.name || '',
              avatar: this.pb.authStore.model?.avatar ? this.pb.files.getUrl(this.pb.authStore.model, this.pb.authStore.model.avatar) : ''
            };
            localStorage.setItem('remembered_user', JSON.stringify(userInfo));
          } else {
            // Save to sessionStorage for session-only login
            sessionStorage.setItem('pocketbase_auth', authStoreData);

            // Clear any remembered user
            localStorage.removeItem('remembered_user');
          }

          // CRITICAL: Force a full page reload to ensure the router's PocketBase instance
          // gets the updated auth state from storage
          console.log("Redirecting to home page...");

          // First force a reload of the current page to refresh the auth state
          window.location.reload();

          // Set a timeout to redirect after reload
          setTimeout(() => {
            window.location.replace('/home');
          }, 300);

          return; // Early return to prevent further execution
        } else {
          // Handle unexpected response format
          throw new Error('Authentication response was invalid');
        }

      } catch (error) {
        console.error('Login failed:', error);

        // Clear any potentially saved auth data
        this.pb.authStore.clear();
        localStorage.removeItem('pocketbase_auth');
        sessionStorage.removeItem('pocketbase_auth');

        this.errorMessage = 'Invalid email or password. Please try again.';
      } finally {
        this.isLoading = false;
      }
    },

    async quickLogin() {
      if (this.isLoading) return; // Prevent multiple clicks

      this.isLoading = true;
      this.errorMessage = '';
      this.verificationNeededMessage = '';

      try {
        console.log('Attempting quick login with:', this.rememberedUserEmail);

        // Convert email to lowercase for case insensitivity
        const lowercaseEmail = this.rememberedUserEmail.toLowerCase();
        
        // Use stored credentials for quick login with lowercase email
        const authData = await this.pb.collection('users').authWithPassword(
          lowercaseEmail,
          this.rememberedUserPassword
        );

        // Check if login succeeded but user is not verified
        console.log("Quick login successful, checking verification status...");
        if (authData && this.pb.authStore.isValid) {
          console.log("Verification status:", authData.record.verified);
          
          // If user is not verified, prevent login and show message
          if (authData.record.verified === false) {
            console.log("User not verified, clearing auth and showing message");
            // Clear the auth since we don't want unverified users to proceed
            this.pb.authStore.clear();
            localStorage.removeItem('pocketbase_auth');
            sessionStorage.removeItem('pocketbase_auth');
            
            // Display verification message and switch to regular login
            this.verificationNeededMessage = 'Your email address has not been verified. Please check your inbox and spam folder for the verification email and confirm your account before signing in.';
            this.isLoading = false;
            this.clearQuickLogin(); // Fall back to regular login
            this.email = lowercaseEmail; // Pre-fill the email for convenience
            return;
          }
          
          console.log('Quick login successful and user is verified!', authData);

          // Store auth data in localStorage (since this is a remembered user)
          const authStoreData = this.pb.authStore.exportToCookie();
          localStorage.setItem('pocketbase_auth', authStoreData);

          // CRITICAL: Force a full page reload to ensure the router's PocketBase instance
          // gets the updated auth state from storage. This is necessary because the router
          // is using a different PocketBase instance than this component.
          console.log("Redirecting to home page after quick login...");

          // First force a reload of the current page to refresh the auth state
          window.location.reload();

          // Set a timeout to redirect after reload
          setTimeout(() => {
            window.location.replace('/home');
          }, 300);

          return; // Early return to prevent further execution
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Quick login failed:', error);
        
        // Clear auth and quick login data
        this.pb.authStore.clear();
        this.clearQuickLogin();
        
        this.errorMessage = 'Quick login failed. Please sign in manually.';
      } finally {
        this.isLoading = false;
      }
    },

    clearQuickLogin() {
      // Clear remembered user data and show regular login form
      localStorage.removeItem('remembered_user');
      this.showQuickLogin = false;
      this.rememberedUserEmail = '';
      this.rememberedUserPassword = '';
      this.rememberedUserName = '';
      this.rememberedUserAvatar = '';
    },

    handleForgotPassword() {
      // Handle forgot password logic
      console.log('Forgot password clicked');
      // You might redirect to a password reset page
      this.$router.push('/forgot-password');
    },

    async resendVerification() {
      if (this.resendingVerification || !this.email) return;
      
      this.resendingVerification = true;
      
      try {
        // Convert email to lowercase for case insensitivity
        const lowercaseEmail = this.email.toLowerCase();
        
        // Request verification email
        await this.pb.collection('users').requestVerification(lowercaseEmail);
        
        // Update the verification message to indicate success
        this.verificationNeededMessage = 'Verification email has been resent! Please check your inbox and spam folder. You must verify your email address before signing in.';
      } catch (error) {
        console.error('Failed to resend verification:', error);
        
        // Handle specific error cases
        if (error.status === 404) {
          this.verificationNeededMessage = 'We couldn\'t find an account with this email address. Please check your email or create a new account.';
        } else {
          this.verificationNeededMessage = 'Failed to resend verification email. Please try again later or contact support if the problem persists.';
        }
      } finally {
        this.resendingVerification = false;
      }
    },
  },

  mounted() {
    console.log("LoginView mounted");

    // 1. First check if user is already authenticated via PocketBase's internal state
    if (this.pb.authStore.isValid) {
      console.log("User already authenticated in PocketBase state, redirecting to home...");
      window.location.replace('/home');
      return;
    }

    // 2. Next, try to restore authentication from storage
    let authData = localStorage.getItem('pocketbase_auth') || sessionStorage.getItem('pocketbase_auth');

    if (authData) {
      try {
        // Import the auth data using the cookie method
        console.log("Found stored auth data, loading...");
        this.pb.authStore.loadFromCookie(authData);

        if (this.pb.authStore.isValid) {
          console.log("Valid authentication restored from storage, redirecting to home...");

          // First force a reload of the current page to refresh the auth state
          window.location.reload();

          // Set a timeout to redirect after reload
          setTimeout(() => {
            window.location.replace('/home');
          }, 300);
          return;
        } else {
          console.log("Found auth data but it's invalid, clearing...");
          this.pb.authStore.clear();
          localStorage.removeItem('pocketbase_auth');
          sessionStorage.removeItem('pocketbase_auth');
        }
      } catch (e) {
        console.error('Failed to restore auth:', e);
        this.pb.authStore.clear();
        localStorage.removeItem('pocketbase_auth');
        sessionStorage.removeItem('pocketbase_auth');
      }
    }

    // 3. If we get here, there's no valid auth, check for remembered user for quick login
    console.log("No valid auth, checking for remembered user...");
    const rememberedUser = localStorage.getItem('remembered_user');
    if (rememberedUser) {
      try {
        const userData = JSON.parse(rememberedUser);
        this.rememberedUserEmail = userData.email || '';
        this.rememberedUserPassword = userData.password || '';
        this.rememberedUserName = userData.name || '';
        this.rememberedUserAvatar = userData.avatar || '';

        if (this.rememberedUserEmail && this.rememberedUserPassword) {
          console.log("Found remembered user, showing quick login");
          this.showQuickLogin = true;
          return;
        }
      } catch (e) {
        console.error('Failed to parse remembered user data:', e);
        localStorage.removeItem('remembered_user');
      }
    }

    // 4. Finally, check for credentials from signup
    const newUserEmail = sessionStorage.getItem('newUserEmail');
    const newUserPassword = sessionStorage.getItem('newUserPassword');

    if (newUserEmail && newUserPassword) {
      console.log("Found credentials from signup");
      this.email = newUserEmail;
      this.password = newUserPassword;

      sessionStorage.removeItem('newUserEmail');
      sessionStorage.removeItem('newUserPassword');
    }

    console.log("Showing standard login form");
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

.logo-pulse {
  animation: pulseGlow 2s ease-in-out infinite;
  max-width: 100px;
}
@keyframes pulseGlow {
  0%,
  100% {
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
  }
}
</style>
