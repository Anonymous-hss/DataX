import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/datax/',
  envPrefix: ['VITE_', 'PINECONE_', 'AZURE_', 'BIGQUERY_', 'DATABRICKS_', 'SALESFORCE_', 'AWS_'],
  plugins: [
    react(),
    {
      name: 'datax-auth-api-plugin',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            const { authMiddleware } = await import('./server/authMiddleware.js');
            authMiddleware(req, res, next);
          } catch (err) {
            next();
          }
        });
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
