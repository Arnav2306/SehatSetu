import { Router } from 'express';
import {
  getAdminProviders,
  updateProviderVerification,
} from '../controllers/admin.controller.js';
import {
  getAdminReviews,
  updateReviewStatus,
} from '../controllers/review.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { checkDatabaseConnection } from '../middleware/dbCheck.js';

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(authorize('admin'));
router.use(checkDatabaseConnection);

router.get('/providers', getAdminProviders);
router.patch('/providers/:type/:id/verify', updateProviderVerification);

// Review moderation endpoints
router.get('/reviews', getAdminReviews);
router.patch('/reviews/:id/status', updateReviewStatus);

export default router;

