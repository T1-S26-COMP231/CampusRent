import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from './db';
import { UserModel, UserRole } from './models/User';

interface DemoUser {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

const demoUsers: DemoUser[] = [
  {
    email: 'admin@mycentennialcollege.ca',
    password: 'admin123',
    first_name: 'CampusRent',
    last_name: 'Admin',
    role: 'admin',
  },
  {
    email: 'student@mycentennialcollege.ca',
    password: 'student123',
    first_name: 'Demo',
    last_name: 'Student',
    role: 'student',
  },
];

async function seed() {
  await connectDatabase();

  for (const demo of demoUsers) {
    await UserModel.updateOne(
      { email: demo.email },
      {
        $setOnInsert: {
          email: demo.email,
          password_hash: await bcrypt.hash(demo.password, 10),
          first_name: demo.first_name,
          last_name: demo.last_name,
          role: demo.role,
          verification_status: 'verified',
          status: 'active',
        },
      },
      { upsert: true },
    );
  }

  console.log('MongoDB demo accounts are ready.');
}

void seed()
  .catch((error) => {
    console.error('Could not seed MongoDB:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
