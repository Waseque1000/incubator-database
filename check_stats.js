require('dotenv').config();
const mongoose = require('mongoose');
const Form = require('./models/Form');
const Student = require('./models/Student');
const Submission = require('./models/Submission');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const forms = await Form.find().lean();
    console.log("Forms found:", forms.length);
    for (const f of forms) {
      console.log(`Form: ${f.formName} (ID: ${f._id})`);
      const students = await Student.countDocuments({ formId: f._id });
      const subs = await Submission.countDocuments({ formId: f._id });
      const dateString = new Date().toISOString().split('T')[0];
      const todaySubs = await Submission.countDocuments({ formId: f._id, date: dateString });
      console.log(`  Students: ${students}, Total Submissions: ${subs}, Today Subs: ${todaySubs}`);
    }
    process.exit(0);
  });
