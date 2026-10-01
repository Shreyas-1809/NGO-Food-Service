const fs = require('fs');

const centers = {
  'deccan': { lat: 18.5196, lng: 73.8411 },
  'shivajinagar': { lat: 18.5308, lng: 73.8475 },
  'hadapsar': { lat: 18.5089, lng: 73.9259 },
  'viman nagar': { lat: 18.5679, lng: 73.9143 },
  'kharadi': { lat: 18.5515, lng: 73.9348 },
  'pimpri': { lat: 18.6298, lng: 73.7997 },
  'chinchwad': { lat: 18.6298, lng: 73.7997 },
  'kothrud': { lat: 18.5074, lng: 73.8077 },
  'koregaon park': { lat: 18.5362, lng: 73.8940 },
  'camp': { lat: 18.5146, lng: 73.8786 },
  'swargate': { lat: 18.5018, lng: 73.8636 },
  'baner': { lat: 18.5590, lng: 73.7868 },
  'katraj': { lat: 18.4575, lng: 73.8677 },
  'kondhwa': { lat: 18.4637, lng: 73.8868 },
  'bibwewadi': { lat: 18.4747, lng: 73.8603 },
  'magarpatta': { lat: 18.5158, lng: 73.9272 }
};

const offsets = {};

function getCoord(localityOrArea) {
  const loc = (localityOrArea || '').toLowerCase();
  let base = { lat: 18.5204, lng: 73.8567 };
  
  for (const [key, val] of Object.entries(centers)) {
    if (loc.includes(key)) {
      base = { lat: val.lat, lng: val.lng };
      break;
    }
  }

  const key = base.lat + "_" + base.lng;
  if (!offsets[key]) offsets[key] = 0;
  
  const off = offsets[key];
  offsets[key]++;
  
  return {
    lat: base.lat + (off * 0.001),
    lng: base.lng + (off * 0.001)
  };
}

const ngoPath = 'frontend/src/services/ngoDirectoryService.js';
let ngoContent = fs.readFileSync(ngoPath, 'utf8');

let match = ngoContent.match(/export\s+const\s+DEMO_NGOS\s*=\s*(\[[\s\S]*?\]);/);
if (match) {
  let arr = eval(match[1]);
  arr = arr.map(item => {
    const coord = getCoord(item.area || item.city || item.address);
    item.location = coord;
    if (!item.type) {
      let iName = (item.name || '').toLowerCase();
      if (iName.includes('orphanage')) item.type = 'orphanage';
      else if (iName.includes('shelter') || iName.includes('old age') || iName.includes('vriddhashram')) item.type = 'shelter';
      else if (iName.includes('kitchen') || iName.includes('food bank')) item.type = 'community kitchen';
      else item.type = 'ngo';
    }
    return item;
  });
  const newArrStr = JSON.stringify(arr, null, 2);
  ngoContent = ngoContent.replace(match[1], newArrStr);
  fs.writeFileSync(ngoPath, ngoContent);
  console.log('Updated ngoDirectoryService.js');
}

const mockPath = 'frontend/src/services/mockData.js';
let mockContent = fs.readFileSync(mockPath, 'utf8');

let mockMatch1 = mockContent.match(/export\s+const\s+MOCK_DONORS\s*=\s*(\[[\s\S]*?\]);/);
if (mockMatch1) {
  let arr = eval(mockMatch1[1]);
  arr = arr.map(item => {
    const coord = getCoord(item.area || item.city);
    item.location = coord;
    item.type = 'donor';
    return item;
  });
  mockContent = mockContent.replace(mockMatch1[1], JSON.stringify(arr, null, 2));
}

let mockMatch2 = mockContent.match(/export\s+const\s+MOCK_INITIAL_DONATIONS\s*=\s*(\[[\s\S]*?\]);/);
if (mockMatch2) {
  let arr = eval(mockMatch2[1]);
  arr = arr.map(item => {
    const donorMatch = mockMatch1 ? eval(mockMatch1[1]).find(d => d.id === (item.donorId?._id || item.donorId)) : null;
    const coord = getCoord(donorMatch ? (donorMatch.area || donorMatch.city) : '');
    item.location = coord;
    item.type = 'surplus';
    return item;
  });
  mockContent = mockContent.replace(mockMatch2[1], JSON.stringify(arr, null, 2));
}

fs.writeFileSync(mockPath, mockContent);
console.log('Updated mockData.js');
