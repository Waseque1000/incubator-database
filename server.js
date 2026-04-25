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
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/submissions', submissionRoutes);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student-tasks';
let dbError = null;

mongoose.connect(MONGODB_URI)
  .then((conn) => {
    dbError = null;
  })
  .catch((err) => {
    dbError = err.message;
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
