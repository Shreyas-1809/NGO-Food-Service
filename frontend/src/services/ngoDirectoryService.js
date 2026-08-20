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
    phone: '+91 98765 43210',
    email: 'contact@robinhoodarmy.com',
    website: 'https://robinhoodarmy.com',
    socials: {
      instagram: 'https://instagram.com/rha_india',
      facebook: 'https://facebook.com/robinhoodarmy',
      twitter: 'https://twitter.com/rha_india',
      linkedin: 'https://linkedin.com/company/robinhoodarmy'
    },
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
    phone: '+91 91234 56789',
    email: 'hello@feedingindia.org',
    website: 'https://feedingindia.org',
    socials: {
      instagram: 'https://instagram.com/feedingindia',
      twitter: 'https://twitter.com/feedingindia'
    },
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
    phone: '+91 99887 76655',
    email: 'pune@ivolunteer.in',
    website: 'https://ivolunteer.in',
    socials: {
      facebook: 'https://facebook.com/iVolunteerIndia',
      linkedin: 'https://linkedin.com/company/ivolunteer'
    },
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
    phone: '+91 80 2345 6789',
    email: 'info@akshayapatra.org',
    website: 'https://akshayapatra.org',
    socials: {
      twitter: 'https://twitter.com/AkshayaPatra',
      instagram: 'https://instagram.com/theakshayapatrafoundation'
    },
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
    phone: '+91 11 4123 4567',
    email: 'mail@goonj.org',
    website: 'https://goonj.org',
    socials: {
      facebook: 'https://facebook.com/goonj.org',
      instagram: 'https://instagram.com/goonj'
    },
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
    phone: '+91 22 2345 6789',
    email: 'contact@muktangan.org',
    website: 'https://muktangan.org',
    socials: {
      linkedin: 'https://linkedin.com/company/muktangan-education-trust'
    },
    foodTypesAccepted: ['Cooked Meals', 'Snacks', 'Milk & Dairy'],
    capacity: '1200 meals/day (student program)',
    causes: ['Education', 'Child Welfare', 'Mid-Day Meals'],
    acceptingFood: true,
    urgency: 'LOW'
  },
  {
    id: 'demo-orphanage-1',
    name: 'Snehalaya Orphanage — Pune',
    isDemoData: true,
    demoLabel: 'Demo Organization',
    verified: true,
    description: 'A shelter and rehabilitation center for orphaned, abandoned, and destitute children. Provides education, nutrition, and vocational training to 200+ children.',
    category: 'Orphanage & Child Care',
    city: 'Pune',
    area: 'Kothrud',
    address: 'Kothrud, Pune, Maharashtra 411038',
    location: { lat: 18.5074, lng: 73.8077 },
    phone: '+91 20 2546 1234',
    email: 'info@snehalayapune.org',
    foodTypesAccepted: ['Cooked Meals', 'Milk & Dairy', 'Fruits', 'Snacks'],
    capacity: '200+ children daily',
    causes: ['Orphan Care', 'Child Welfare', 'Education', 'Hunger Relief'],
    acceptingFood: true,
    urgency: 'HIGH'
  },
  {
    id: 'demo-orphanage-2',
    name: 'Bal Kalyan Sanstha — Children\'s Home',
    isDemoData: true,
    demoLabel: 'Demo Organization',
    verified: true,
    description: 'Government-recognized children\'s home providing shelter, food, healthcare, and primary education to orphaned and underprivileged children in Pune.',
    category: 'Orphanage & Child Care',
    city: 'Pune',
    area: 'Sinhagad Road',
    address: 'Sinhagad Road, Pune, Maharashtra 411030',
    location: { lat: 18.4750, lng: 73.8250 },
    phone: '+91 20 2435 7890',
    foodTypesAccepted: ['Cooked Meals', 'Dry Rations', 'Fruits', 'Milk & Dairy'],
    capacity: '150 children daily',
    causes: ['Orphan Care', 'Child Welfare', 'Healthcare'],
    acceptingFood: true,
    urgency: 'MEDIUM'
  },
  {
    id: 'demo-oldage-1',
    name: 'Matoshree Vriddhashram — Senior Care Home',
    isDemoData: true,
    demoLabel: 'Demo Organization',
    verified: true,
    description: 'A dignified living facility for senior citizens without family support. Houses 80+ elderly residents and provides medical care, meals, and recreational activities.',
    category: 'Old Age Home & Elder Care',
    city: 'Pune',
    area: 'Bibwewadi',
    address: 'Bibwewadi, Pune, Maharashtra 411037',
    location: { lat: 18.4810, lng: 73.8590 },
    phone: '+91 20 2421 5678',
    foodTypesAccepted: ['Cooked Meals', 'Soft Foods', 'Fruits', 'Milk & Dairy'],
    capacity: '80+ residents daily',
    causes: ['Elder Care', 'Healthcare', 'Hunger Relief'],
    acceptingFood: true,
    urgency: 'HIGH'
  },
  {
    id: 'demo-oldage-2',
    name: 'Jeevan Sandhya Old Age Home',
    isDemoData: true,
    demoLabel: 'Demo Organization',
    verified: true,
    description: 'A charitable trust-run old age home providing food, shelter, and companionship to abandoned and destitute senior citizens. Currently houses 60 residents.',
    category: 'Old Age Home & Elder Care',
    city: 'Pune',
    area: 'Kondhwa',
    address: 'Kondhwa Budruk, Pune, Maharashtra 411048',
    location: { lat: 18.4630, lng: 73.8890 },
    phone: '+91 20 2683 4567',
    foodTypesAccepted: ['Cooked Meals', 'Soft Foods', 'Fruits', 'Dry Rations'],
    capacity: '60 residents daily',
    causes: ['Elder Care', 'Hunger Relief', 'Community Service'],
    acceptingFood: true,
    urgency: 'MEDIUM'
  }
];

/**
 * Fetch NGOs — designed to be replaced with real API call.
 * @returns {Promise<Array>} List of NGO objects
 */
export const fetchNGOs = async ({ city = 'Pune', category = null, searchTerm = '', areaSearch = '' } = {}) => {
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
    
    // Area filter
    if (areaSearch && !ngo.address.toLowerCase().includes(areaSearch.toLowerCase()) && 
        !ngo.area.toLowerCase().includes(areaSearch.toLowerCase())) return false;

    // Search Term filter
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
  'Orphan Care',
  'Elder Care',
  'Education',
  'Clothes & Blankets',
  'Medical Supplies',
  'Disaster Relief',
  'Community Volunteering'
];
