const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  currentModule: { type: String, required: true },
  assignedModule: { type: String, required: true },
  tomorrowTask: { type: String, required: true },
  needGuideline: { type: Boolean, default: false },
  guidelineResolved: { type: Boolean, default: false },
  customData: { type: Map, of: String, default: {} }
}, { timestamps: true });

// A student can submit only once per day per form
submissionSchema.index({ studentId: 1, formId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
