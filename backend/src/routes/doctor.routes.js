import { Router } from 'express';
import { getDoctors, getDoctorById } from '../controllers/doctor.controller.js';
import { getMySchedule, updateMySchedule } from '../controllers/doctorSchedule.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { checkDatabaseConnection } from '../middleware/dbCheck.js';

const router = Router();

router.use(checkDatabaseConnection);

router.get('/', getDoctors);

// Doctor-only schedule management — must be before /:id to avoid being matched as an ObjectId
router.get('/schedule/me', authenticate, authorize('doctor'), getMySchedule);
router.put('/schedule/me', authenticate, authorize('doctor'), updateMySchedule);

router.get('/:id', getDoctorById);

export default router;

