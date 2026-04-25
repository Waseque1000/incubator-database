const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  formName: { type: String, required: true },
  formSlug: { type: String, required: true, unique: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isClosed: { type: Boolean, default: false },
  customFields: [{
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'textarea', 'number'], default: 'text' },
    placeholder: String,
    required: { type: Boolean, default: false }
  }],
  enrolledEmails: [{ type: String }] // Master list of emails for enrollment check
}, { timestamps: true });

module.exports = mongoose.model('Form', formSchema);
