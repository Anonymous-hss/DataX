import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { authMiddleware } from './server/authMiddleware.js';

export default defineConfig({
  base: '/datax/',
  plugins: [
    react(),
    {
      name: 'datax-auth-api-plugin',
      configureServer(server) {
        server.middlewares.use(authMiddleware);
      }
    }
  ],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/datax-api': {
        target: 'https://dataglow.ai',
        changeOrigin: true,
        secure: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor_xlsx: ['xlsx'],
          vendor_motion: ['framer-motion'],
          vendor_icons: ['lucide-react'],
        }
      }
    }
  }
});
