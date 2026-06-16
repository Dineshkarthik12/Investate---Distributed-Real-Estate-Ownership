import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fileRoutes from './routes/files';

const app = express();
const PORT = process.env.FILE_PORT || 3008;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('short'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'file-service', timestamp: new Date().toISOString() });
});

app.use('/', fileRoutes);

app.listen(PORT, () => {
  console.log(`📂 File service running on port ${PORT}`);
});

export default app;
