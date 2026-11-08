import mongoose from 'mongoose';
export default async function DB_Connection() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
  return mongoose.connection;
}
