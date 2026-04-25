const express = require('express');
const Form = require('../models/Form');
const Student = require('../models/Student');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all forms with stats (Admin)
router.get('/', auth, async (req, res) => {
  try {
    console.log("GET /forms called!");
    const forms = await Form.find().sort({ createdAt: -1 }).lean();
    
    // Get today's date string (YYYY-MM-DD format as saved in submissions)
    const today = new Date().toISOString().split('T')[0];

    const formsWithStats = await Promise.all(forms.map(async (form) => {
      const totalParticipants = await Student.countDocuments({ formId: form._id });
      const todayUpdates = await Submission.countDocuments({ formId: form._id, date: today });
      
      // Check if updatedAt is today
      const isUpdatedToday = new Date(form.updatedAt).toISOString().split('T')[0] === today;
      
      return { ...form, totalParticipants, todayUpdates, isUpdatedToday };
    }));

    console.log("Sending response:", JSON.stringify(formsWithStats, null, 2));
    res.json(formsWithStats);
  } catch (err) {
    console.error("GET /forms ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Create new form (Admin)
router.post('/create', auth, async (req, res) => {
  try {
    const { formName, formSlug, startDate, endDate, customFields } = req.body;
    const form = new Form({ formName, formSlug, startDate, endDate, customFields });
    await form.save();
    res.status(201).json(form);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Edit form (Admin)
router.put('/edit/:id', auth, async (req, res) => {
  try {
    const form = await Form.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(form);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get single form by ID (Admin)
router.get('/id/:id', auth, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    res.json(form);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single form by slug (Student Public)
router.get('/:slug', async (req, res) => {
  try {
    const form = await Form.findOne({ formSlug: req.params.slug, isClosed: false });
    if (!form) return res.status(404).json({ message: 'Form not found or closed' });
    res.json(form);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete form (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const formId = req.params.id;
    await Form.findByIdAndDelete(formId);
    // Cascade delete associated students and submissions
    await Student.deleteMany({ formId });
    await Submission.deleteMany({ formId });
    res.json({ message: 'Form and all associated data deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
