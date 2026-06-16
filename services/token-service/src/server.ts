import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import tokenRoutes from './routes/tokens';

const app = express();
const PORT = process.env.TOKEN_PORT || 3003;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('short'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'token-service', timestamp: new Date().toISOString() });
});

app.use('/', tokenRoutes);

app.listen(PORT, () => {
  console.log(`🪙 Token service running on port ${PORT}`);
});

export default app;
