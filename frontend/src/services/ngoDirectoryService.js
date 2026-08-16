/**
 * NGO Directory Service Layer
 * 
 * Architecture designed for real API integration.
 * Currently uses clearly-labelled DEMO data.
 * 
 * To connect a real NGO API, replace fetchNGOs() with:
 *   const response = await fetch(import.meta.env.VITE_NGO_API_URL + '/organizations');
 *   return response.json();
 * 
 * Potential real data sources:
 *   - GuideStar India API (https://www.guidestarindia.org)
 *   - NGO Darpan (India Gov) API (https://ngodarpan.gov.in)
 *   - Custom verified NGO dataset from your backend
 */

export const NGO_DATA_SOURCE = 'DEMO'; // 'DEMO' | 'API' | 'BACKEND'

/**
 * DEMO ORGANIZATIONS — clearly labelled.
 * These are representative organizational profiles for development/demo purposes.
 * In production, replace with verified data from a real NGO registry API.
 */
const DEMO_NGOS = [
  {
    id: 'demo-ngo-1',
    name: 'Robin Hood Army — Pune Chapter',
    isDemoData: true,
    demoLabel: 'Demo Organization',
    realOrgWebsite: 'https://robinhoodarmy.com',
    verified: true,
    description: 'A zero-funds volunteer organization that works with restaurants and home kitchens to feed the less fortunate. Active across 150+ cities.',
    category: 'Food Security & Hunger Relief',
    city: 'Pune',
    area: 'Deccan / FC Road',
    address: 'Deccan Gymkhana Area, Pune, Maharashtra 411004',
    location: { lat: 18.5196, lng: 73.8412 },
    distanceKm: 1.8,
    phone: null,
    email: null,
    website: 'https://robinhoodarmy.com',
    foodTypesAccepted: ['Cooked Meals', 'Bakery Surplus', 'Event Buffet Leftovers'],
    capacity: '500–2000 meals/event',
    causes: ['Hunger Relief', 'Food Rescue'],
    acceptingFood: true,
    urgency: 'HIGH'
  },
  {
    id: 'demo-ngo-2',
    name: 'Feeding India (Zomato Giving) — Pune Hub',
    isDemoData: true,
    demoLabel: 'Demo Organization',
    realOrgWebsite: 'https://feedingindia.org',
    verified: true,
    description: 'Now part of Zomato Feeding India initiative. Focuses on eliminating hunger through food rescue, mid-day meal programs, and ration distribution.',
    category: 'Food Security & Child Nutrition',
    city: 'Pune',
    area: 'Kharadi',
    address: 'Kharadi Hub, EON IT Park Area, Pune, Maharashtra 411014',
    location: { lat: 18.5528, lng: 73.9412 },
    distanceKm: 8.4,
    phone: null,
    email: null,
    website: 'https://feedingindia.org',
    foodTypesAccepted: ['Dry Rations', 'Packaged Food', 'Grains & Pulses'],
    capacity: '10,000+ ration packs/month',
    causes: ['Hunger Relief', 'Child Nutrition', 'Mid-Day Meals'],
    acceptingFood: true,
    urgency: 'HIGH'
  },
  {
    id: 'demo-ngo-3',
    name: 'iVolunteer India — Pune Network',
    isDemoData: true,
    demoLabel: 'Demo Organization',
    realOrgWebsite: 'https://ivolunteer.in',
    verified: true,
    description: 'Volunteer management and community service network that coordinates food rescue missions, blood camps, and skill-sharing programs.',
    category: 'Community Volunteering & Food Rescue',
    city: 'Pune',
    area: 'Viman Nagar',
    address: 'Viman Nagar, Pune, Maharashtra 411014',
    location: { lat: 18.5679, lng: 73.9143 },
    distanceKm: 7.8,
    phone: null,
    email: null,
    website: 'https://ivolunteer.in',
    foodTypesAccepted: ['All Food Types'],
    capacity: 'Variable per drive',
    causes: ['Food Rescue', 'Community Service', 'Volunteering'],
    acceptingFood: true,
    urgency: 'MEDIUM'
  },
  {
    id: 'demo-ngo-4',
    name: 'Akshaya Patra Foundation — Pune Kitchen',
    isDemoData: true,
    demoLabel: 'Demo Organization',
    realOrgWebsite: 'https://akshayapatra.org',
    verified: true,
    description: 'One of the world\'s largest NGO-run school meal programs. Provides mid-day meals to 2+ million children daily across India.',
    category: 'Child Nutrition & Mid-Day Meals',
    city: 'Pune',
    area: 'Pimpri-Chinchwad',
    address: 'PCMC Area, Pimpri-Chinchwad, Pune, Maharashtra 411018',
    location: { lat: 18.6186, lng: 73.8006 },
    distanceKm: 12.3,
    phone: null,
    email: null,
    website: 'https://akshayapatra.org',
    foodTypesAccepted: ['Grains', 'Vegetables', 'Cooking Oil', 'Lentils'],
    capacity: '50,000+ meals/day (national scale)',
    causes: ['Child Nutrition', 'Education Support', 'Mid-Day Meals'],
    acceptingFood: true,
    urgency: 'MEDIUM'
  },
  {
    id: 'demo-ngo-5',
    name: 'Goonj — Pune Collection Center',
    isDemoData: true,
    demoLabel: 'Demo Organization',
    realOrgWebsite: 'https://goonj.org',
    verified: true,
    description: 'A Delhi-based national NGO channelizing urban surplus — clothes, food, household items — as a development resource for rural and disaster-hit communities.',
    category: 'Resource Redistribution & Disaster Relief',
    city: 'Pune',
    area: 'Hadapsar',
    address: 'Hadapsar, Pune, Maharashtra 411028',
    location: { lat: 18.5089, lng: 73.9259 },
    distanceKm: 6.2,
    phone: null,
    email: null,
    website: 'https://goonj.org',
    foodTypesAccepted: ['Packaged Food', 'Dry Rations', 'Non-perishables'],
    capacity: 'Tonnes of material per month',
    causes: ['Clothes', 'Food', 'Disaster Relief', 'Rural Development'],
    acceptingFood: true,
    urgency: 'MEDIUM'
  },
  {
    id: 'demo-ngo-6',
    name: 'Muktangan Education Trust',
    isDemoData: true,
    demoLabel: 'Demo Organization',
    realOrgWebsite: 'https://muktangan.org',
    verified: true,
    description: 'Running alternative schools for underprivileged children in Pune. Also coordinates mid-day meal programs for 1200+ students.',
    category: 'Education & Child Welfare',
    city: 'Pune',
    area: 'Shivajinagar',
    address: 'Shivajinagar, Pune, Maharashtra 411005',
    location: { lat: 18.5308, lng: 73.8474 },
    distanceKm: 2.4,
    phone: null,
    email: null,
    website: 'https://muktangan.org',
    foodTypesAccepted: ['Cooked Meals', 'Snacks', 'Milk & Dairy'],
    capacity: '1200 meals/day (student program)',
    causes: ['Education', 'Child Welfare', 'Mid-Day Meals'],
    acceptingFood: true,
    urgency: 'LOW'
  }
];

/**
 * Fetch NGOs — designed to be replaced with real API call.
 * @returns {Promise<Array>} List of NGO objects
 */
export const fetchNGOs = async ({ city = 'Pune', category = null, searchTerm = '' } = {}) => {
  // In production: uncomment and use real API
  // if (NGO_DATA_SOURCE === 'API') {
  //   const url = new URL(import.meta.env.VITE_NGO_API_URL + '/organizations');
  //   if (city) url.searchParams.set('city', city);
  //   if (category) url.searchParams.set('category', category);
  //   const res = await fetch(url.toString());
  //   return res.json();
  // }

  // Demo data (client-side filtering)
  let results = DEMO_NGOS.filter(ngo => {
    if (city && ngo.city.toLowerCase() !== city.toLowerCase()) return false;
    if (category && !ngo.causes.some(c => c.toLowerCase().includes(category.toLowerCase()))) return false;
    if (searchTerm && !ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !ngo.area.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !ngo.category.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return results;
};

export const getAllDemoNGOs = () => DEMO_NGOS;

export const getNGOById = (id) => DEMO_NGOS.find(n => n.id === id) || null;

export const AVAILABLE_CITIES = ['Pune', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad'];
export const AVAILABLE_CAUSES = [
  'Food Security & Hunger Relief',
  'Child Nutrition',
  'Education',
  'Clothes & Blankets',
  'Medical Supplies',
  'Disaster Relief',
  'Community Volunteering'
];
