import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/health', (req, res) => {
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    status: 'ok',
    message: 'SehatSetu API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatusMap[mongoose.connection.readyState] || 'unknown',
  });
});

export default router;
