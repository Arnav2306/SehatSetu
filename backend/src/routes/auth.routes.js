import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { checkDatabaseConnection } from '../middleware/dbCheck.js';

const router = Router();

router.post('/register', checkDatabaseConnection, register);
router.post('/login', checkDatabaseConnection, login);
router.post('/logout', logout);
router.get('/me', authenticate, checkDatabaseConnection, getMe);

export default router;
