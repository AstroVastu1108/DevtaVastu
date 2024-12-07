import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', // Allows the server to be accessed via IP address
    port: 3001, // Specifies the port to use
    // strictPort: true, // Ensures the server will fail if port 3000 is unavailable
  },
  plugins: [react()],
  // optimizeDeps: {
  //   exclude: ['lucide-react'],
  // },
});
