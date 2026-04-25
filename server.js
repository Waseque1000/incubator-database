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

// MongoDB connection
let MONGODB_URI = (process.env.MONGODB_URI || process.env.MONGO_URI || "").trim();

console.log("System Check: NODE_ENV =", process.env.NODE_ENV);
console.log("System Check: URI Length =", MONGODB_URI.length);

let dbStatus = "Not Started";
let dbError = null;

if (MONGODB_URI) {
  dbStatus = "Connecting...";
  console.log("Attempting database connection...");
  
  mongoose.connect(MONGODB_URI, {
    dbName: 'incubator',
    serverSelectionTimeoutMS: 10000, // Increased to 10s for slow Vercel cold starts
    socketTimeoutMS: 45000,
  })
    .then(() => {
      dbStatus = "Connected";
      dbError = null;
      console.log("SUCCESS: MongoDB Connected");
    })
    .catch((err) => {
      dbStatus = "Failed";
      dbError = err.message;
      console.error("CRITICAL ERROR: MongoDB Connection Failed ->", err.message);
    });
} else {
  dbStatus = "Configuration Error";
  dbError = "MONGODB_URI environment variable is missing on Vercel Dashboard!";
  console.error("CRITICAL ERROR: No MONGODB_URI found in environment.");
}

// Root route for health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Incubator API is live!', 
    status: 'healthy', 
    database: dbStatus,
    error: dbError,
    envCheck: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      uriStart: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) + "..." : "none"
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
