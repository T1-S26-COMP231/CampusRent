import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { authenticate, signToken } from '../middleware/auth';
import { serializeUser, UserModel } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { isInstitutionalEmail } from '../utils/validation';

const router = Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, first_name, last_name } = req.body as {
      email?: string;
      password?: string;
      first_name?: string;
      last_name?: string;
    };

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!isInstitutionalEmail(email)) {
      return res.status(400).json({
        error: 'Use an institutional email such as @mycentennialcollege.ca or .edu',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await UserModel.exists({ email: normalizedEmail })) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    try {
      const user = await UserModel.create({
        email: normalizedEmail,
        password_hash: await bcrypt.hash(password, 10),
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        role: 'student',
        verification_status: 'pending',
        status: 'active',
      });

      return res.status(201).json({
        message: 'Registration submitted for verification.',
        user: serializeUser(user),
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw error;
    }
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await UserModel.findOne({
      email: email.trim().toLowerCase(),
    }).select('+password_hash');
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    const safeUser = serializeUser(user);
    return res.json({
      token: signToken(safeUser),
      user: safeUser,
    });
  }),
);

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
