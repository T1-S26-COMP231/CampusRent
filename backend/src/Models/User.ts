import { HydratedDocument, model, Schema } from 'mongoose';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type AccountStatus = 'active' | 'suspended';
export type UserRole = 'student' | 'admin';

export interface User {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  verification_status: VerificationStatus;
  status: AccountStatus;
  created_at: Date;
  updated_at: Date;
}

export type UserDocument = HydratedDocument<User>;

export interface SafeUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  verification_status: VerificationStatus;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password_hash: {
      type: String,
      required: true,
      select: false,
    },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
      required: true,
    },
    verification_status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const UserModel = model<User>('User', userSchema);

export function serializeUser(user: UserDocument): SafeUser {
  return {
    id: user._id.toString(),
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    verification_status: user.verification_status,
    status: user.status,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
  };
}
