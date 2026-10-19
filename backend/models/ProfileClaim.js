const mongoose = require('mongoose');

/**
 * ProfileClaim — stores a request from a donor/user asking to claim
 * an external (non-registered) NGO from the Discover tab so an admin
 * can verify and onboard them into FoodBridge as a registered org.
 */
const ProfileClaimSchema = new mongoose.Schema({
  // Identity of the org being claimed (from Overpass / external source)
  externalOsmId:  { type: String },                      // OSM node/way id
  externalName:   { type: String, required: true },      // Name as shown on card
  externalSource: { type: String, default: 'openstreetmap' },
  externalAddress:{ type: String },
  city:           { type: String },
  coordinates:    { type: [Number] },                    // [longitude, latitude]

  // Claimant-supplied details
  orgName:        { type: String, required: true },
  contactEmail:   { type: String, required: true },
  contactPhone:   { type: String },
  regNumber:      { type: String },                      // registration number (optional)
  proofDocUrl:    { type: String },                      // base64 or URL of uploaded doc

  // Who submitted
  submittedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submitterEmail: { type: String },

  // Admin review
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes:     { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ProfileClaim', ProfileClaimSchema);
