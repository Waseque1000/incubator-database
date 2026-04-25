const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let admin = await Admin.findOne({ email });
    if (!admin) {
      if (email === 'admin@admin.com') {
        admin = new Admin({ name: 'Administrator', email, password });
        await admin.save();
      } else {
         return res.status(400).json({ message: 'Invalid credentials' });
      }
    } else {
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ _id: admin._id }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1d' });
    res.json({ token, admin: { name: admin.name, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
