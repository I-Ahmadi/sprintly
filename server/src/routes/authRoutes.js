import express from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import * as authValidators from '../validators/authValidator.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, error: { message: 'Too many login attempts', statusCode: 429 } },
});

const forgotResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, error: { message: 'Too many attempts', statusCode: 429 } },
});

router.post('/register', authValidators.register, validate, authController.register);
router.post('/login', authValidators.login, validate, loginLimiter, authController.login);
router.post('/refresh', authValidators.refresh, validate, authController.refresh);
router.post('/logout', authValidators.logout, validate, authController.logout);
router.post('/verify-email', authValidators.verifyEmail, validate, authController.verifyEmail);
router.post('/forgot-password', authValidators.forgotPassword, validate, forgotResetLimiter, authController.forgotPassword);
router.post('/reset-password', authValidators.resetPassword, validate, authController.resetPassword);

export default router;
