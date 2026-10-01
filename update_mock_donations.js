const fs = require('fs');

const coords = {
  'FC Road, Deccan Gymkhana, Pune': { lat: 18.5196, lng: 73.8411 },
  'Market Yard, Gultekdi, Pune': { lat: 18.4968, lng: 73.8652 }, // approx
  'Aundh DP Road, Pune': { lat: 18.5580, lng: 73.8075 },
  'Kharadi IT Park, Pune': { lat: 18.5515, lng: 73.9348 },
};

let content = fs.readFileSync('frontend/src/services/mockData.js', 'utf8');

const regex = /{([\s\S]*?)id:\s*'([^']+)'([\s\S]*?)pickupLocation:\s*'([^']+)'([\s\S]*?)}/g;

content = content.replace(regex, (match, before, id, middle, pickupLocation, after) => {
  if (id.startsWith('DON-')) {
    const coord = coords[pickupLocation] || { lat: 18.5204, lng: 73.8567 };
    
    // Check if it already has donorId
    if (match.includes('donorId:')) {
      return match;
    }
    
    let donorId = 'donor-1';
    let donorName = 'Green Bite Restaurant & Catering';
    if (pickupLocation.includes('Kharadi')) {
      donorId = 'donor-2';
      donorName = 'Fresh Farms Grocery';
    } else if (pickupLocation.includes('Viman Nagar')) {
      donorId = 'donor-3';
      donorName = 'Daily Bread Bakery';
    }

    return '{' + before + 'id: \'' + id + '\'' + middle + 'pickupLocation: \'' + pickupLocation + '\',\n    lat: ' + coord.lat + ',\n    lng: ' + coord.lng + ',\n    type: \'surplus\',\n    donorId: \'' + donorId + '\',\n    donorName: \'' + donorName + '\'' + after + '}';
  }
  return match;
});

fs.writeFileSync('frontend/src/services/mockData.js', content);
console.log('MOCK_INITIAL_DONATIONS updated');
