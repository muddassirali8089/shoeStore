import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('MongoDB connected successfully ✅');
  } catch (err) {
    console.error('MongoDB connection failed ❌', err.message);
    process.exit(1); // optional: exit app if DB fails
  }
};

export default connectDB;
