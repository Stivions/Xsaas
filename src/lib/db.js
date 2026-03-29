import mongoose from "mongoose";

let connectionPromise = null;

export async function connectToDatabase(mongodbUri) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(mongodbUri, {
      autoIndex: true
    });
  }

  await connectionPromise;
  return mongoose.connection;
}
