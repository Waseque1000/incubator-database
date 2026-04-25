const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  batch: { type: String },
  assignedModule: { type: String },
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
