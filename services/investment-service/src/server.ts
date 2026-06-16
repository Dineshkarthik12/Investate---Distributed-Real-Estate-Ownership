import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import investmentRoutes from './routes/investments';

const app = express();
const PORT = process.env.INVESTMENT_PORT || 3004;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('short'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'investment-service', timestamp: new Date().toISOString() });
});

app.use('/', investmentRoutes);

app.listen(PORT, () => {
  console.log(`💰 Investment service running on port ${PORT}`);
});

export default app;
