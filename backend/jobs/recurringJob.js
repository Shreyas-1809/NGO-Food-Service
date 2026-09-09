const cron = require('node-cron');
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

const startRecurringJob = (io) => {
  // Run every 15 minutes for testing/production
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running recurring needs generator job...', new Date().toISOString());
    try {
      const now = new Date();
      // Find all active templates whose next occurrence is due or past due
      const dueTemplates = await RecurringNeedTemplate.find({
        status: 'ACTIVE',
        nextOccurrence: { $lte: now }
      });

      let generatedCount = 0;

      for (const template of dueTemplates) {
        // Concurrency check: check if an active (unresolved) Need already exists for this template
        const existingNeed = await Need.findOne({
          recurringTemplateId: template._id,
          status: 'ACTIVE'
        });

        if (existingNeed) {
          // If an unresolved need exists, we skip generation to avoid spam/duplicates.
          // Note: we don't update nextOccurrence here; we let it remain past due,
          // so next time the job runs, it checks again. If the NGO fulfills the active need,
          // it will then generate a new one. (Alternatively, we could push the date forward).
          continue;
        }

        // Generate the new Need
        const newNeed = new Need({
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

        await newNeed.save();

        // Update the template
        template.lastGenerated = now;
        template.nextOccurrence = getNextOccurrenceDate(template.frequency, now);
        await template.save();

        generatedCount++;

        // Broadcast to clients
        if (io) {
          // We can emit a general event or specifically a NEED_CREATED event.
          // Since the frontend relies on /api/needs to populate, we can emit an event that triggers refetch.
          const populatedNeed = await Need.findById(newNeed._id).populate('ngoId', 'orgName fullName phone email address city location');
          io.emit('NEW_NEED_LISTING', populatedNeed);
        }
      }

      if (generatedCount > 0) {
        console.log(`Generated ${generatedCount} recurring needs.`);
      }
    } catch (err) {
      console.error('Error in recurring needs job:', err);
    }
  });
};

module.exports = startRecurringJob;
