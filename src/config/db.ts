import mongoose from "mongoose";

export const connectDb = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000
  });
};
