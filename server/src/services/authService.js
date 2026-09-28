import bcrypt from 'bcrypt';
import { prisma } from '../config/database.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { generateToken, hashToken } from '../utils/crypto.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';
import { AppError } from '../middleware/errorHandler.js';

function publicUser(user) {
  if (!user) return null;
  const {
    password,
    emailVerificationToken,
    passwordResetToken,
    passwordResetExpires,
    passwordChangedAt,
    updatedAt,
    ...rest
  } = user;
  return rest;
}

export async function register(name, email, password) {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new AppError('User with this email is already registered.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const rawToken = generateToken();
  const hashedEmailVerificationToken = hashToken(rawToken);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      emailVerificationToken: hashedEmailVerificationToken,
    },
  });

  try {
    await sendVerificationEmail(email, rawToken);
  } catch (err) {
    console.error(`[email] Verification delivery failed: ${err.message}`);
    await prisma.user.delete({ where: { id: newUser.id } });
    throw new AppError('Verification email could not be sent. Please try again later.', 500);
  }
  
  return { user: publicUser(newUser) };
}

export async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError('No account found with this email.', 404);
  }

  if (!await bcrypt.compare(password, user.password)) {
    throw new AppError('Invalid password. Please try again.', 401);
  }

  if (!user.emailVerified) {
    throw new AppError('The user email is not verified.', 403);
  }

  const accessToken = generateAccessToken({ userId: user.id });
  const refreshToken = generateRefreshToken({ userId: user.id });
  const expiresAt = new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_MS, 10));
  
  await prisma.refreshToken.create({
    data: { 
      token: refreshToken, 
      userId: user.id, 
      expiresAt: expiresAt 
    },
  });

  return {
    user: publicUser(user),
    accessToken: accessToken,
    refreshToken: refreshToken,
    expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_MS, 10) / 1000,
  };
}

export async function logout(token) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function refreshToken(token) {
  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }

  const stored = await prisma.refreshToken.findFirst({
    where: { 
      token: token, 
      userId: payload.userId 
    },
  });
  
  if (!stored || new Date() > stored.expiresAt) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
  
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  
  const newAccessToken = generateAccessToken({ userId: payload.userId });
  const newRefreshToken = generateRefreshToken({ userId: payload.userId });
  const expiresAt = new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_MS, 10));

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: payload.userId,
      expiresAt: expiresAt
    },
  });
  
  return { 
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_MS, 10) / 1000,
  };
}

export async function verifyEmail(token) {
  const hashedEmailToken = hashToken(token);

  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: hashedEmailToken },
  });
  
  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }
  
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null },
  });
  
  return { user: publicUser(updated) };
}

export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    return;
  }

  const rawToken = generateToken();
  const passwordResetToken = hashToken(rawToken);
  const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken, passwordResetExpires },
  });

  try {
    await sendPasswordResetEmail(user.email, rawToken);
  } catch (err) {
    throw new AppError('Password reset email could not be sent. Please try again later.', 500);
  }
}

export async function resetPassword(token, newPassword) {
  const hashed = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashed,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    }),
  
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
  ]);
}
