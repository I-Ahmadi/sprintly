import { body } from 'express-validator';

export const register = [
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
];

export const login = [
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const refresh = [
  body("refreshToken")
    .optional()
    .notEmpty()
    .withMessage("Refresh token is required"),
];

export const logout = [
  body("refreshToken")
    .optional()
    .notEmpty()
    .withMessage("Refresh token is required"),
];

export const verifyEmail = [
  body("token")
    .notEmpty()
    .withMessage("Verification token is required"),
];


export const forgotPassword = [
  body("email")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage("Valid email is required"),
];

export const resetPassword = [
  body("token")
    .notEmpty()
    .withMessage("Reset token is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];
