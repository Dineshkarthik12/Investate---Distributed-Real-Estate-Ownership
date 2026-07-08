import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('short'));

// Rate limiting (100 req/min per IP)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use(limiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// Proxy routes
const services = {
  '/api/auth': process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  '/api/listings': process.env.LISTING_SERVICE_URL || 'http://localhost:3002',
  '/api/tokens': process.env.TOKEN_SERVICE_URL || 'http://localhost:3003',
  '/api/investments': process.env.INVESTMENT_SERVICE_URL || 'http://localhost:3004',
  '/api/chat': process.env.CHAT_SERVICE_URL || 'http://localhost:3005',
  '/api/marketplace': process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3006',
  '/api/notifications': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
  '/api/files': process.env.FILE_SERVICE_URL || 'http://localhost:3008',
};

Object.entries(services).forEach(([path, target]) => {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^${path}`]: '' },
    on: {
      proxyRes: (proxyRes: any, req: any, res: any) => {
          // Prevent 504 Gateway Timeout if service is down by handling errors
      },
      error: (err: any, req: any, res: any) => {
        console.error(`Proxy error for ${path}:`, err);
        if (!res.headersSent) {
            (res as express.Response).status(502).json({ success: false, error: 'Bad Gateway' });
        }
      }
    }
  }));
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});
