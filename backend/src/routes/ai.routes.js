import { Router } from 'express';
import { triageSymptoms } from '../controllers/ai.controller.js';

const router = Router();

router.post('/symptom-triage', triageSymptoms);

export default router;
