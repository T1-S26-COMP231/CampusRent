import mongoose from 'mongoose';

const defaultMongoUri = 'mongodb://127.0.0.1:27017/campusrent';

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  const mongoUri = process.env.MONGODB_URI || defaultMongoUri;
  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB database "${mongoose.connection.name}".`);
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function databaseStatus(): 'connected' | 'connecting' | 'disconnected' {
  if (mongoose.connection.readyState === 1) return 'connected';
  if (mongoose.connection.readyState === 2) return 'connecting';
  return 'disconnected';
}
