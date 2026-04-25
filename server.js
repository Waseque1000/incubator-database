require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const adminRoutes = require('./routes/admin');
const formRoutes = require('./routes/forms');
const submissionRoutes = require('./routes/submissions');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/submissions', submissionRoutes);

// MongoDB connection management
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const MONGODB_URI = (process.env.MONGODB_URI || process.env.MONGO_URI || "").trim();
  
  if (!MONGODB_URI) {
    console.error("CRITICAL: MONGODB_URI is missing!");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'incubator',
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
  }
};

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Root route for health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Incubator API is live!', 
    database: isConnected ? "Connected" : "Disconnected",
    envCheck: {
      hasMongoUri: !!(process.env.MONGODB_URI || process.env.MONGO_URI),
      nodeEnv: process.env.NODE_ENV
    }
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
