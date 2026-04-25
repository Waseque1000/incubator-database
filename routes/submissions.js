const express = require('express');
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const Student = require('../models/Student');
const Form = require('../models/Form');
const auth = require('../middleware/auth');
const router = express.Router();

// Student submits daily task
router.post('/submit', async (req, res) => {
  try {
    const { formId, name, email, phone, batch, date, currentModule, tomorrowTask, needGuideline, customData } = req.body;
    
    // Find or create student
    let student = await Student.findOne({ email, formId });
    if (!student) {
      student = new Student({ name, email, phone, batch, formId });
      await student.save();
    }

    // Calculate assignedModule: Use student's pre-assigned module if exists, otherwise auto-calculate
    let assignedModule = student.assignedModule;
    
    if (!assignedModule) {
      let assignedModuleStr = String(currentModule);
      assignedModule = assignedModuleStr;
      const match = assignedModuleStr.match(/(\d+)/);
      if (match) {
         const num = parseInt(match[1]) + 1;
         assignedModule = assignedModuleStr.replace(match[1], num);
      } else {
         assignedModule = currentModule + ' + 1';
      }
    } else {
      // Clear the assignedModule from student record as it's now being used in a submission
      student.assignedModule = "";
      await student.save();
    }

    const now = new Date();
    // Calculate date in Bangladesh Time (YYYY-MM-DD)
    const bangladeshDate = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Dhaka' });
    
    const submissionTime = now.toLocaleTimeString('en-US', { 
      timeZone: 'Asia/Dhaka', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    });

    const submission = new Submission({
      studentId: student._id,
      formId,
      date: bangladeshDate,
      submissionTime,
      currentModule,
      assignedModule,
      tomorrowTask,
      needGuideline: needGuideline || false,
      customData: customData || {}
    });

    await submission.save();

    // --- Discord Notification Integration ---
    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
    if (DISCORD_WEBHOOK_URL) {
      try {
        const form = await Form.findById(formId);
        
        const embed = {
          title: needGuideline ? '🚨 GUIDELINE HELP REQUESTED 🚨' : '✅ DAILY PROGRESS SUBMITTED',
          description: `**Form:** ${form?.formName || 'General Campaign'}\n**Status:** ${needGuideline ? 'Requires Attention ⚠️' : 'On Track 💎'}`,
          color: needGuideline ? 0xEF4444 : 0x10B981,
          thumbnail: { url: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' },
          fields: [
            { name: '👤 Student Identity', value: `**Name:** ${name}\n**Email:** ${email}\n**Batch:** ${batch || 'N/A'}`, inline: false },
            { name: '📊 Progress Details', value: `**Current Module:** ${currentModule}\n**Submission Time:** ${submissionTime}`, inline: false },
            { name: '🎯 Tomorrow\'s Mission', value: tomorrowTask || '_No plan provided_', inline: false },
          ],
          timestamp: new Date().toISOString(),
          footer: { 
            text: 'Incubator Management System • Built with Antigravity',
            icon_url: 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png'
          }
        };

        if (customData && Object.keys(customData).length > 0) {
          let customFieldsText = Object.entries(customData)
            .map(([key, val]) => `🔹 **${key}:** ${val}`)
            .join('\n');
          embed.fields.push({ name: '📋 Additional Info', value: customFieldsText });
        }

        console.log(`📡 Sending professional Discord notification...`);
        const response = await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Incubator Bot',
            avatar_url: 'https://cdn-icons-png.flaticon.com/512/1782/1782803.png',
            embeds: [embed]
          })
        });

        if (response.ok) {
          console.log('✅ Discord notification sent successfully!');
        } else {
          const errorData = await response.text();
          console.error(`❌ Discord Webhook Failed: ${response.status} ${response.statusText}`, errorData);
        }
      } catch (discordErr) {
        console.error('❌ Discord Webhook Error:', discordErr.message);
      }
    }

    res.status(201).json(submission);
  } catch (err) {
    if (err.code === 11000) {
       return res.status(400).json({ message: 'You have already submitted for today.' });
    }
    res.status(400).json({ message: err.message });
  }
});

// Admin get submissions by form
router.get('/:formId', auth, async (req, res) => {
  try {
    const submissions = await Submission.find({ formId: req.params.formId }).populate('studentId').sort({ date: 1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin get all submissions structured by student (Optimized with Aggregation)
router.get('/structured/:formId', auth, async (req, res) => {
  try {
    const formId = new mongoose.Types.ObjectId(req.params.formId);
    
    const structuredData = await Student.aggregate([
      { $match: { formId } },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'studentId',
          as: 'submissions'
        }
      },
      { $sort: { name: 1 } }
    ]);
    
    // Sort submissions within each student by date
    const result = structuredData.map(student => ({
      ...student,
      submissions: student.submissions.sort((a, b) => new Date(a.date) - new Date(b.date))
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin update submission details
router.put('/:id', auth, async (req, res) => {
  try {
    const { currentModule, customData, assignedModule } = req.body;
    const update = {};
    if (currentModule !== undefined) update.currentModule = currentModule;
    if (customData !== undefined) update.customData = customData;
    if (assignedModule !== undefined) update.assignedModule = assignedModule;
    
    const submission = await Submission.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(submission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin resolve guideline request
router.put('/:id/resolve-guideline', auth, async (req, res) => {
  try {
    const submission = await Submission.findByIdAndUpdate(req.params.id, { guidelineResolved: true }, { new: true });
    res.json(submission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin update student details (e.g. assignedModule)
router.put('/students/:id', auth, async (req, res) => {
  try {
    const { assignedModule, batch, name, phone } = req.body;
    const update = {};
    if (assignedModule !== undefined) update.assignedModule = assignedModule;
    if (batch !== undefined) update.batch = batch;
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;

    const student = await Student.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin get rewards eligibility
// Get advanced stats for the dashboard using MongoDB aggregations
router.get('/stats/:formId', auth, async (req, res) => {
  try {
    const formId = new mongoose.Types.ObjectId(req.params.formId);

    // 1. Basic counts and stats
    const stats = await Student.aggregate([
      { $match: { formId } },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'studentId',
          as: 'studentSubmissions'
        }
      },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          allSubmissions: { $push: '$studentSubmissions' }
        }
      }
    ]);

    // 2. Module distribution and highest module
    // We need to look at the latest submission for each student
    const moduleStats = await Submission.aggregate([
      { $match: { formId } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$studentId',
          latestModule: { $first: '$currentModule' },
          pendingGuideline: { 
            $sum: { 
              $cond: [{ $and: ['$needGuideline', { $ne: ['$guidelineResolved', true] }] }, 1, 0] 
            } 
          }
        }
      }
    ]);

    let totalPending = 0;
    let highestMod = 0;
    const distribution = {};

    moduleStats.forEach(stat => {
      totalPending += stat.pendingGuideline;
      const modMatch = stat.latestModule?.match(/\d+/);
      const mod = modMatch ? parseInt(modMatch[0]) : 0;
      if (mod > highestMod) highestMod = mod;
      if (mod > 0) distribution[mod] = (distribution[mod] || 0) + 1;
    });

    const formattedDistribution = Object.keys(distribution).map(mod => ({
      name: `Mod ${mod}`,
      count: distribution[mod],
      level: parseInt(mod)
    })).sort((a, b) => a.level - b.level);

    res.json({
      totalStudents: stats[0]?.totalStudents || 0,
      totalPendingGuidelines: totalPending,
      highestModule: highestMod,
      moduleDistribution: formattedDistribution
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Optimized rewards route using aggregation
router.get('/rewards/:formId', auth, async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const requiredDays = Math.ceil(durationDays * 0.6);

    const rewardsData = await Student.aggregate([
      { $match: { formId: new mongoose.Types.ObjectId(req.params.formId) } },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'studentId',
          as: 'subs'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          submissionCount: { $size: '$subs' },
          isEligible: { $gte: [{ $size: '$subs' }, requiredDays] },
          requiredDays: { $literal: requiredDays }
        }
      },
      { $sort: { submissionCount: -1 } }
    ]);

    res.json(rewardsData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin check list of emails against submissions
router.post('/check-emails/:formId', auth, async (req, res) => {
  try {
    const { emails } = req.body; // Array of emails from CSV
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ message: 'Invalid email list' });
    }

    const formId = new mongoose.Types.ObjectId(req.params.formId);

    // Find all students who HAVE submitted for this form and are in our email list
    const submissions = await Submission.find({ formId })
      .populate('studentId')
      .lean();

    const submittedEmails = new Set(submissions.map(s => s.studentId.email.toLowerCase()));

    const results = emails.map(email => {
      const normalizedEmail = email.trim().toLowerCase();
      return {
        email: normalizedEmail,
        hasSubmitted: submittedEmails.has(normalizedEmail)
      };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
