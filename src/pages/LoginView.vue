<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-md w-full max-w-md p-8">
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">Welcome</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <h2 class="text-2xl font-semibold text-center text-gray-700 mb-6">Sign In</h2>
        
        <div v-if="errorMessage" class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ errorMessage }}
        </div>
        
        <div class="space-y-2">
          <label for="email" class="block text-sm font-medium text-gray-700">Email ID</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="Enter your email"
            class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
        </div>
        
        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="Enter your password"
            class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
        </div>
        
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
        
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!isLoading">Sign in</span>
          <span v-else>Signing in...</span>
        </button>
      </form>
    </div>
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
      pb: new PocketBase('http://127.0.0.1:8090') // Replace with your PocketBase URL
    }
  },
  
  methods: {
    async handleLogin() {
      this.isLoading = true;
      this.errorMessage = '';
      
      try {
        // Authenticate the user
        const authData = await this.pb.collection('users').authWithPassword(
          this.email,
          this.password
        );
        console.log(this.email);
        console.log(this.password);
        console.log('Login successful!', authData);

        
        // If remember me is checked, store the token in localStorage
        // if (this.rememberMe) {
        //   localStorage.setItem('pocketbase_auth', JSON.stringify(this.pb.authStore.export()));
        // } else {
        //   // Otherwise, use sessionStorage
        //   sessionStorage.setItem('pocketbase_auth', JSON.stringify(this.pb.authStore.export()));
        // }
        
        // Redirect to dashboard or home page after successful login
        this.$router.push('/'); // Change this to your desired route
        
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
      this.$router.push('/'); // Redirect to dashboard if already logged in
    }
    
    // Try to restore authentication from storage
    const authData = localStorage.getItem('pocketbase_auth') || sessionStorage.getItem('pocketbase_auth');
    if (authData) {
      try {
        this.pb.authStore.import(JSON.parse(authData));
        if (this.pb.authStore.isValid) {
          this.$router.push('/');
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

// async function testLogin() {
//   const pb = new PocketBase('http://127.0.0.1:8090');
  
//   try {
//     const authData = await pb.collection('users').authWithPassword(
//       'kylegabrielarana@gmail.com',
//       '12345678' // Use the actual password here
//     );
//     console.log('Login successful!', authData);
//   } catch (error) {
//     console.error('Login failed:', error.response);
//   }
// }

// testLogin();
</script>