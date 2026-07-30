import http from 'http';
import fs from 'fs';
import path from 'path';
import askHandler from '../api/ai/ask';
import analyzeHandler from '../api/ai/analyze';

// Manually load .env file if GEMINI_API_KEY is not already in process.env
if (!process.env.GEMINI_API_KEY) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split(/\r?\n/).forEach((line) => {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.includes('=')) return;
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      });
      console.log('✅ Loaded environment variables from .env file.');
    } else {
      console.warn('⚠️ No .env file found at project root.');
    }
  } catch (err) {
    console.error('❌ Failed to load .env file:', err);
  }
}

const server = http.createServer((req, res) => {
  // Mock Vercel response helper methods
  const mockRes = Object.assign(res, {
    status(statusCode: number) {
      res.statusCode = statusCode;
      return mockRes;
    },
    json(data: any) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return mockRes;
    }
  });

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Parse request body
  let bodyStr = '';
  req.on('data', (chunk) => {
    bodyStr += chunk;
  });

  req.on('end', async () => {
    let body = {};
    if (bodyStr) {
      try {
        body = JSON.parse(bodyStr);
      } catch (err) {
        // Body is not JSON or empty
      }
    }
    
    const mockReq = Object.assign(req, { body });
    const url = req.url?.split('?')[0];

    console.log(`[Dev Server] ${req.method} ${url}`);

    if (url === '/api/ai/ask') {
      try {
        await askHandler(mockReq, mockRes);
      } catch (err: any) {
        console.error(err);
        mockRes.status(500).json({ error: err.message });
      }
    } else if (url === '/api/ai/analyze') {
      try {
        await analyzeHandler(mockReq, mockRes);
      } catch (err: any) {
        console.error(err);
        mockRes.status(500).json({ error: err.message });
      }
    } else {
      mockRes.status(404).json({ error: 'Endpoint not found' });
    }
  });
});

import os from 'os';

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  // Find local network IP address
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        localIP = net.address;
        break;
      }
    }
  }

  console.log(`\n🚀 AI Local Dev Server running and listening on all interfaces ('0.0.0.0')`);
  console.log(`👉 Local:   http://localhost:${PORT}`);
  console.log(`👉 Network: http://${localIP}:${PORT}`);
  console.log(`👉 API Endpoints:`);
  console.log(`   - POST http://${localIP}:${PORT}/api/ai/ask`);
  console.log(`   - POST http://${localIP}:${PORT}/api/ai/analyze\n`);
});
