import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import marketplaceRoutes from './routes/marketplace';

const app = express();
const PORT = process.env.MARKETPLACE_PORT || 3006;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('short'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'marketplace-service', timestamp: new Date().toISOString() });
});

app.use('/', marketplaceRoutes);

app.listen(PORT, () => {
  console.log(`🏪 Marketplace service running on port ${PORT}`);
});

export default app;
