import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import notificationRoutes from './routes/notifications';

const app = express();
const PORT = process.env.NOTIFICATION_PORT || 3007;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('short'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() });
});

app.use('/', notificationRoutes);

app.listen(PORT, () => {
  console.log(`🔔 Notification service running on port ${PORT}`);
});

export default app;
