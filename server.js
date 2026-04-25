require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin
// If you have a serviceAccountKey.json, you should use it here.
// For now, we'll try to initialize with the project ID.
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'incubator-2977e'
  });
}

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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student-tasks';
let dbError = null;

console.log('🔌 Connecting to MongoDB:', MONGODB_URI.substring(0, 20) + '...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    dbError = null;
    console.log('✅ MongoDB Connected Successfully!');
  })
  .catch((err) => {
    dbError = err.message;
    console.error('❌ MongoDB FAILED:', err.message);
  });

// Root route for health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Incubator API is live!', 
    status: 'healthy', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    error: dbError
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
