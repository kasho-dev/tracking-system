<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');
const router = useRouter();

const email = ref(''); // No default email
const password = ref(''); // No default password
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = '';
    pb.authStore.clear(); // Clear previous auth
    
    // This verifies against your actual PocketBase users collection
    const authData = await pb.collection('users').authWithPassword(
      email.value, 
      password.value
    );
    
    console.log('Logged in as:', authData.record);
    router.push('/home');
  } catch (err) {
    console.error('Login error:', err);
    error.value = 'Invalid email or password';
    pb.authStore.clear(); // Clear on failure
  } finally {
    loading.value = false;
  }
};
</script>


  <template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 class="text-2xl font-bold mb-6 text-center">Login</h1>
        
        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="email"
              type="email"
              id="email"
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>
          
          <div class="mb-6">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              v-model="password"
              type="password"
              id="password"
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>
          
          <button
            type="submit"
            class="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition"
            :disabled="loading"
          >
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
          
          <p v-if="error" class="mt-4 text-red-500 text-sm">{{ error }}</p>
        </form>
      </div>
    </div>
  </template>