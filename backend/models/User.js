const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ['DONOR', 'RECEIVER', 'VOLUNTEER'], 
    default: 'DONOR' 
  },
  accountType: { 
    type: String, 
    enum: ['ORGANISATION', 'DONOR', 'RECEIVER', 'VOLUNTEER'], 
    default: 'DONOR' 
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  // Organisation / Receiver fields
  orgName: { type: String },
  city: { type: String },
  pincode: { type: String },
  address: { type: String },
  // Personal / Donor / Volunteer fields
  fullName: { type: String },
  businessName: { type: String },
  businessDetails: {
    shopAddress: String,
    shopPincode: String,
    shopEmail: String,
    shopPhone: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0] // Default [longitude, latitude]
    }
  }
}, { timestamps: true });

UserSchema.index({ location: '2dsphere' }, { sparse: true });

UserSchema.pre('save', async function() {
  // Synchronize role and accountType for backward compatibility
  if (this.accountType === 'ORGANISATION' && !this.role) {
    this.role = 'RECEIVER';
  } else if (this.role === 'RECEIVER' && (!this.accountType || this.accountType === 'DONOR')) {
    this.accountType = 'ORGANISATION';
  } else if (this.role && !this.accountType) {
    this.accountType = this.role;
  } else if (this.accountType && !this.role) {
    this.role = this.accountType === 'ORGANISATION' ? 'RECEIVER' : this.accountType;
  }

  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
