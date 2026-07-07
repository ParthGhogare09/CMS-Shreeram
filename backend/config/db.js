const mongoose = require('mongoose');

// Disable command buffering so queries fail immediately if MongoDB is unreachable
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // Fail after 5 seconds instead of 30 seconds
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Server is running in DISCONNECTED database mode. Database operations will fail fast.');
  }
};

module.exports = connectDB;
