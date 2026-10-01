const fs = require('fs');
let content = fs.readFileSync('frontend/src/services/mockData.js', 'utf8');

const MOCK_DONORS = `
// ==========================================
// DEMO DATA - HARDCODED DONORS FOR SEEDING
// ==========================================
export const MOCK_DONORS = [
  { id: 'donor-1', name: 'Green Bite Restaurant & Catering', type: 'donor', category: 'restaurant', area: 'Deccan / FC Road', lat: 18.5196, lng: 73.8411, isDemoData: true, email: 'contact@greenbite.demo', phone: '+919999999991' },
  { id: 'donor-2', name: 'Fresh Farms Grocery', type: 'donor', category: 'grocery', area: 'Kharadi', lat: 18.5515, lng: 73.9348, isDemoData: true, email: 'contact@freshfarms.demo', phone: '+919999999992' },
  { id: 'donor-3', name: 'Daily Bread Bakery', type: 'donor', category: 'bakery', area: 'Viman Nagar', lat: 18.5679, lng: 73.9143, isDemoData: true, email: 'contact@dailybread.demo', phone: '+919999999993' },
];
`;

if (!content.includes('MOCK_DONORS')) {
  content += '\n' + MOCK_DONORS;
  fs.writeFileSync('frontend/src/services/mockData.js', content);
  console.log('MOCK_DONORS added');
} else {
  console.log('MOCK_DONORS already exists');
}
