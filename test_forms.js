require('dotenv').config();
const mongoose = require('mongoose');
const Form = require('./models/Form');
const Student = require('./models/Student');
const Submission = require('./models/Submission');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      const forms = await Form.find().sort({ createdAt: -1 }).lean();
      
      const today = new Date().toISOString().split('T')[0];

      const formsWithStats = await Promise.all(forms.map(async (form) => {
        const totalParticipants = await Student.countDocuments({ formId: form._id });
        const todayUpdates = await Submission.countDocuments({ formId: form._id, date: today });
        return { ...form, totalParticipants, todayUpdates };
      }));

      console.log(JSON.stringify(formsWithStats, null, 2));
    } catch (e) {
      console.error("Error", e);
    }
    process.exit(0);
  });
