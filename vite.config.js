import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/datax/',
  envPrefix: ['VITE_', 'PINECONE_', 'AZURE_', 'BIGQUERY_', 'DATABRICKS_', 'SALESFORCE_', 'AWS_'],
  plugins: [
    react()
  ],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/datax-api': {
        target: 'http://127.0.0.1:8003',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/datax-api/, '')
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
