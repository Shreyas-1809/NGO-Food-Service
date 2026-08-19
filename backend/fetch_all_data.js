const mongoose = require('mongoose');
const fs = require('fs');

const Activity = require('./models/Activity');
const Claim = require('./models/Claim');
const Food = require('./models/Food');
const Listing = require('./models/Listing');
const Notification = require('./models/Notification');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food_bridge';

const fetchAllData = async () => {
  try {
    console.log('Connecting to MongoDB at', MONGO_URI, '...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('Connected to MongoDB.');

    console.log('Fetching data from all collections...');
    const data = {
      activities: await Activity.find({}),
      claims: await Claim.find({}),
      foods: await Food.find({}),
      listings: await Listing.find({}),
      notifications: await Notification.find({}),
      users: await User.find({}).select('-password'), // Exclude passwords for security
    };

    const outputPath = '../all_data.json';
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`All data fetched successfully and saved to ${outputPath}`);
    process.exit(0);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    process.exit(1);
  }
};

fetchAllData();
