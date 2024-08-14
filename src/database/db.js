import mongoose from "mongoose";

async function connectDatabase() {
  const connectionString = process.env.CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("no connecton String found!");
  }
  try {
    const connection = await mongoose.connect(connectionString, {
      dbName: "database_B_app",
      connectTimeoutMS: 10000,
    });
    return connection;
  } catch (error) {
    throw error;
  }
}

export { connectDatabase };
