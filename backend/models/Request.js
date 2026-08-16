const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  ngoId: { type: String, required: true },
  ngoName: { type: String, required: true },
  category: { type: String, required: true },
  item: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  description: { type: String },
  requiredBy: { type: String },
  priority: { type: String, enum: ['Urgent', 'Medium', 'Normal', 'HIGH'], default: 'Normal' },
  beneficiaries: { type: Number, default: 50 },
  location: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'MATCHED', 'FULFILLED'], default: 'ACTIVE' },
  imageUrl: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Request', RequestSchema);
