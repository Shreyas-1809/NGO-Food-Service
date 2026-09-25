const mongoose = require('mongoose');
require('dotenv').config();

async function debug() {
  await mongoose.connect(process.env.MONGO_URI);
  const Food = require('./models/Food');
  const Claim = require('./models/Claim');
  const User = require('./models/User');

  const req = {
    user: { id: '6a88c9dd7db2164aceb25bff', accountType: 'ORGANISATION' }
  };

  try {
    const activeStatuses = ['CLAIMED', 'ACCEPTED', 'IN_TRANSIT', 'COMPLETED'];
    let query = { status: { $in: activeStatuses } };
    if (req.user.accountType === 'DONOR') {
      query.donorId = req.user.id;
    } else {
      const acceptedClaims = await Claim.find({
        ngoId: req.user.id,
        status: { $in: ['ACCEPTED', 'COMPLETED'] }
      }).select('foodId');
      const foodIds = acceptedClaims.map(c => c.foodId).filter(Boolean);
      query.$or = [
        { claimantId: req.user.id },
        { _id: { $in: foodIds } }
      ];
    }
    const foods = await Food.find(query)
      .populate('donorId', 'orgName fullName phone email address city businessName businessDetails')
      .populate('claimantId', 'orgName fullName phone email address city')
      .sort({ updatedAt: -1 });
    console.log('SUCCESS! Found:', foods.length);
    foods.forEach(f => console.log('Title:', f.title, 'ID:', f._id, 'Donor:', f.donorId?.fullName || f.donorId?.orgName));
  } catch (err) {
    console.error('ERROR IN QUERY:', err);
  }
  process.exit(0);
}
debug();
