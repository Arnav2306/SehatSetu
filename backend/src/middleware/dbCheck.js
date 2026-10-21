import mongoose from 'mongoose';

export const checkDatabaseConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      status: 'error',
      code: 'DB_UNAVAILABLE',
      message: 'MongoDB is currently unavailable. Live database records cannot be fetched.',
    });
  }
  next();
};
