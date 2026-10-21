import { Router } from 'express';
import { getHospitals, getHospitalById } from '../controllers/hospital.controller.js';
import { checkDatabaseConnection } from '../middleware/dbCheck.js';

const router = Router();

router.use(checkDatabaseConnection);

router.get('/', getHospitals);
router.get('/:id', getHospitalById);

export default router;
