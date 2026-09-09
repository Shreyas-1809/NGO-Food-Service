const mongoose = require('mongoose');

const RecurringNeedTemplateSchema = new mongoose.Schema({
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Food', 'Cooked Meals', 'Cooked Meal', 'Clothes', 'Books', 'Medical Supplies', 'Food & Rations', 'Raw Produce', 'Baked Goods', 'Packaged'],
    default: 'Food'
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: 'servings'
  },
  urgency: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW', 'High / Urgent Deficit', 'Medium Priority'],
    default: 'HIGH'
  },
  description: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  frequency: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'],
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  nextOccurrence: {
    type: Date,
    required: true
  },
  lastGenerated: {
    type: Date
  }
}, { timestamps: true });

RecurringNeedTemplateSchema.index({ location: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('RecurringNeedTemplate', RecurringNeedTemplateSchema);
