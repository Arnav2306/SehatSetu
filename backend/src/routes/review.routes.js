import { Router } from 'express';
import {
  createReview,
  getPublicProviderReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  getAdminReviews,
  updateReviewStatus,
} from '../controllers/review.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { checkDatabaseConnection } from '../middleware/dbCheck.js';

const router = Router();

// Public endpoints: Fetch approved reviews & aggregate ratings
router.get('/', checkDatabaseConnection, getPublicProviderReviews);
router.get('/doctor/:doctorId', checkDatabaseConnection, getPublicProviderReviews);
router.get('/hospital/:hospitalId', checkDatabaseConnection, getPublicProviderReviews);

// Patient endpoints: Submit, view, and manage own reviews
router.post('/', authenticate, authorize('patient', 'admin'), checkDatabaseConnection, createReview);
router.get('/my', authenticate, authorize('patient', 'admin'), checkDatabaseConnection, getMyReviews);
router.patch('/:id', authenticate, authorize('patient', 'admin'), checkDatabaseConnection, updateReview);
router.delete('/:id', authenticate, authorize('patient', 'admin'), checkDatabaseConnection, deleteReview);

// Admin moderation endpoints
router.get('/admin', authenticate, authorize('admin'), checkDatabaseConnection, getAdminReviews);
router.patch('/:id/moderate', authenticate, authorize('admin'), checkDatabaseConnection, updateReviewStatus);

export default router;
