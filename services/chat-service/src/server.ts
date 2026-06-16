import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import chatRoutes from './routes/chat';

const app = express();
const PORT = process.env.CHAT_PORT || 3005;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('short'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'chat-service', timestamp: new Date().toISOString() });
});

app.use('/', chatRoutes);

app.listen(PORT, () => {
  console.log(`💬 Chat service running on port ${PORT}`);
});

export default app;
