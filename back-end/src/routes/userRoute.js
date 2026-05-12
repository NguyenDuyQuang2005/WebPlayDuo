import express from 'express';
import { authMe } from '../controllers/userController.js';
import { protectedRoute } from '../middlewares/authmiddle.js';

const router = express.Router();

router.get('/me', protectedRoute, authMe);

export default router;