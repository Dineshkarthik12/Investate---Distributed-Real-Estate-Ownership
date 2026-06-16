import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import listingRoutes from './routes/listings';

const app = express();
const PORT = process.env.LISTING_PORT || 3002;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('short'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'listing-service', timestamp: new Date().toISOString() });
});

app.use('/listings', listingRoutes);

app.listen(PORT, () => {
  console.log(`📋 Listing service running on port ${PORT}`);
});

export default app;
