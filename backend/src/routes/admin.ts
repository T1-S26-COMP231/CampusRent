import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  serializeUser,
  UserModel,
  VerificationStatus,
} from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate, requireAdmin);

router.get(
  '/verifications',
  asyncHandler(async (_req, res) => {
    const pendingUsers = await UserModel.find({
      role: 'student',
      verification_status: 'pending',
    }).sort({ created_at: 1 });

    res.json({ users: pendingUsers.map(serializeUser) });
  }),
);

router.patch(
  '/verifications/:id',
  asyncHandler(async (req, res) => {
    const status = req.body.status as VerificationStatus | undefined;
    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be verified or rejected' });
    }
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Student account not found' });
    }

    const user = await UserModel.findOne({
      _id: req.params.id,
      role: 'student',
    });
    if (!user) {
      return res.status(404).json({ error: 'Student account not found' });
    }

    user.verification_status = status;
    await user.save();

    res.json({
      message: `Account ${status}.`,
      user: serializeUser(user),
    });
  }),
);

export default router;
