const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RecurringNeedTemplate = require('../models/RecurringNeedTemplate');
const Need = require('../models/Need');
const Activity = require('../models/Activity');

// Helper to calculate the next occurrence date
function getNextOccurrenceDate(frequency, fromDate = new Date()) {
  const nextDate = new Date(fromDate);
  switch (frequency) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'BIWEEKLY':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    default:
      nextDate.setDate(nextDate.getDate() + 7);
  }
  return nextDate;
}

// @route   POST /api/recurring-needs
// @desc    Create a new recurring need template
// @access  Private (Organisation/NGO only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'ORGANISATION') {
      return res.status(403).json({ message: 'Only organisations can create recurring needs' });
    }

    const { title, category, quantity, unit, urgency, description, location, frequency } = req.body;

    if (!title || !quantity || !frequency) {
      return res.status(400).json({ message: 'Title, quantity, and frequency are required' });
    }

    const now = new Date();
    const template = new RecurringNeedTemplate({
      ngoId: req.user.id,
      title,
      category: category || 'Food',
      quantity: Number(quantity),
      unit: unit || 'servings',
      urgency: urgency || 'HIGH',
      description,
      frequency,
      status: 'ACTIVE',
      lastGenerated: now,
      nextOccurrence: getNextOccurrenceDate(frequency, now) // Trigger next time, first is created NOW
    });

    if (location && location.coordinates && location.coordinates.length === 2) {
      template.location = location;
    }

    await template.save();

    // Immediately generate the FIRST live occurrence!
    const firstNeed = new Need({
      ngoId: template.ngoId,
      title: template.title,
      category: template.category,
      quantity: template.quantity,
      unit: template.unit,
      urgency: template.urgency,
      description: template.description,
      location: template.location,
      status: 'ACTIVE',
      recurringTemplateId: template._id
    });
    
    await firstNeed.save();

    await Activity.create({
      userId: req.user.id,
      action: 'Created Recurring Need Template',
      details: `Title: ${title}, Frequency: ${frequency}`
    });

    // Broadcast the new need so the feed updates in real-time
    const io = req.app.get('io');
    if (io) {
      const populatedNeed = await Need.findById(firstNeed._id).populate('ngoId', 'orgName fullName phone email address city location');
      io.emit('NEW_NEED_LISTING', populatedNeed);
    }

    res.status(201).json(template);
  } catch (err) {
    console.error('Error creating recurring template:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/recurring-needs/my-templates
// @desc    Get current NGO's recurring need templates
// @access  Private (Organisation/NGO only)
router.get('/my-templates', auth, async (req, res) => {
  try {
    if (req.user.accountType !== 'ORGANISATION') {
      return res.status(403).json({ message: 'Only organisations can fetch their templates' });
    }

    const templates = await RecurringNeedTemplate.find({ ngoId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(templates);
  } catch (err) {
    console.error('Error fetching recurring templates:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PATCH /api/recurring-needs/:id
// @desc    Update a recurring need template (including Pause/Resume)
// @access  Private (Organisation/NGO only)
router.patch('/:id', auth, async (req, res) => {
  try {
    const template = await RecurringNeedTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    if (template.ngoId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, category, quantity, unit, urgency, description, frequency, status } = req.body;

    if (title) template.title = title;
    if (category) template.category = category;
    if (quantity !== undefined) template.quantity = Number(quantity);
    if (unit) template.unit = unit;
    if (urgency) template.urgency = urgency;
    if (description !== undefined) template.description = description;
    if (frequency) template.frequency = frequency;
    
    if (status) {
      if (status === 'ACTIVE' && template.status === 'PAUSED') {
        // Resume it right now if it was paused
        template.nextOccurrence = new Date();
      }
      template.status = status;
    }

    await template.save();
    res.json(template);
  } catch (err) {
    console.error('Error updating template:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/recurring-needs/:id
// @desc    Delete a recurring need template
// @access  Private (Organisation/NGO only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await RecurringNeedTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    if (template.ngoId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await RecurringNeedTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recurring need template deleted' });
  } catch (err) {
    console.error('Error deleting template:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
