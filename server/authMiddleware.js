import { handleRegister, handleLogin, handleGetCurrentUser } from './authController.js';

/**
 * Connect/Vite/Express compatible middleware to process /api/auth requests.
 */
export function authMiddleware(req, res, next) {
  const url = req.url.split('?')[0];

  if (!url.startsWith('/api/auth')) {
    return next();
  }

  // Handle CORS preflight if needed
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 204;
    return res.end();
  }

  const sendJson = (status, payload) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.statusCode = status;
    res.end(JSON.stringify(payload));
  };

  const readBody = () => {
    return new Promise((resolve) => {
      if (req.body && typeof req.body === 'object') {
        return resolve(req.body);
      }
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch {
          resolve({});
        }
      });
    });
  };

  (async () => {
    try {
      if (url === '/api/auth/register' && req.method === 'POST') {
        const body = await readBody();
        const result = await handleRegister(body);
        return sendJson(result.status, result.data);
      }

      if (url === '/api/auth/login' && req.method === 'POST') {
        const body = await readBody();
        const result = await handleLogin(body);
        return sendJson(result.status, result.data);
      }

      if (url === '/api/auth/me' && req.method === 'GET') {
        const authHeader = req.headers['authorization'];
        const result = await handleGetCurrentUser(authHeader);
        return sendJson(result.status, result.data);
      }

      if (url === '/api/auth/logout' && req.method === 'POST') {
        return sendJson(200, { message: 'Logged out successfully.' });
      }

      return sendJson(404, { error: 'Unknown auth endpoint' });
    } catch (err) {
      console.error('[DataX Auth API Error]:', err);
      return sendJson(500, { error: 'Internal server error in auth pipeline.', details: err.message });
    }
  })();
}
