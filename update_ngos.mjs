import fs from 'fs';

let content = fs.readFileSync('frontend/src/services/ngoDirectoryService.js', 'utf8');

const coords = {
  'Deccan / FC Road': { lat: 18.5196, lng: 73.8411 },
  'Shivajinagar': { lat: 18.5308, lng: 73.8475 },
  'Hadapsar': { lat: 18.5089, lng: 73.9259 },
  'Viman Nagar': { lat: 18.5679, lng: 73.9143 },
  'Kharadi': { lat: 18.5515, lng: 73.9348 },
  'Pimpri-Chinchwad': { lat: 18.6298, lng: 73.7997 },
  'Kothrud': { lat: 18.5074, lng: 73.8077 },
  'Sinhagad Road': { lat: 18.4725, lng: 73.8341 }, // approx
  'Bibwewadi': { lat: 18.4747, lng: 73.8603 },
  'Kondhwa': { lat: 18.4637, lng: 73.8868 },
};

const types = {
  'demo-ngo-1': 'ngo',
  'demo-ngo-2': 'food bank',
  'demo-ngo-3': 'ngo',
  'demo-ngo-4': 'community kitchen',
  'demo-ngo-5': 'ngo',
  'demo-ngo-6': 'ngo',
  'demo-orphanage-1': 'orphanage',
  'demo-orphanage-2': 'orphanage',
  'demo-oldage-1': 'shelter',
  'demo-oldage-2': 'shelter',
};

const regex = /{([\s\S]*?)id:\s*'([^']+)'([\s\S]*?)area:\s*'([^']+)'([\s\S]*?)}/g;

content = content.replace(regex, (match, before, id, middle, area, after) => {
  const coord = coords[area];
  const type = types[id] || 'ngo';
  if (coord) {
    return '{' + before + 'id: \'' + id + '\'' + middle + 'area: \'' + area + '\',\n    type: \'' + type + '\',\n    lat: ' + coord.lat + ',\n    lng: ' + coord.lng + after + '}';
  }
  return match;
});

fs.writeFileSync('frontend/src/services/ngoDirectoryService.js', content);
console.log('NGOs updated.');
