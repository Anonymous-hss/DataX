import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './authMiddleware.js';
import { initAuthDb } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.AUTH_PORT || process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Wire Auth Middleware
app.use(authMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'datax-auth-service', timestamp: new Date().toISOString() });
});

async function startServer() {
  await initAuthDb();
  app.listen(PORT, () => {
    console.log(`[DataX Auth Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[DataX Auth Server] Failed to start:', err);
  process.exit(1);
});
