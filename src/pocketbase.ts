// src/pocketbase.ts
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Debugging setup
pb.authStore.onChange((token, model) => {
  console.log('AuthStore changed:', {
    token,
    model,
    isValid: pb.authStore.isValid
  });
}, true);

export { pb };