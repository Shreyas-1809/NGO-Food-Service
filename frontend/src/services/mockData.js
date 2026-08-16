// Centralized Mock Data System for DONOR ↔ RECEIVER BRIDGE PLATFORM

export const MOCK_NGOS = [
  {
    id: 'ngo-101',
    name: 'Helping Hands Foundation',
    verified: true,
    addressVerified: true,
    logo: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=150&auto=format&fit=crop&q=80',
    description: 'Dedicated to mitigating urban hunger and supporting under-resourced schools with essential meals and study materials.',
    city: 'Pune',
    area: 'Shivajinagar',
    address: '42 University Road, Shivajinagar, Pune',
    location: { lat: 18.5308, lng: 73.8474 },
    distanceKm: 2.4,
    phone: '+91 98220 11223',
    email: 'contact@helpinghands.org',
    website: 'https://helpinghands.org.in',
    areasOfSupport: ['Food Security', 'Educational Materials', 'Clothes & Blankets'],
    beneficiariesCount: 1450,
    pastDonationsCount: 320,
    impactScore: '98%',
    currentRequirements: [
      { id: 'req-1', item: 'Rice & Pulses', category: 'Food', quantity: 50, unit: 'kg', urgency: 'HIGH', requiredBy: '2026-08-20', beneficiaries: 120 },
      { id: 'req-2', item: 'School Textbooks (Std 5-8)', category: 'Books', quantity: 40, unit: 'Sets', urgency: 'MEDIUM', requiredBy: '2026-08-25', beneficiaries: 40 }
    ]
  },
  {
    id: 'ngo-102',
    name: 'Food Relief Foundation',
    verified: true,
    addressVerified: true,
    logo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=150&auto=format&fit=crop&q=80',
    description: 'Providing daily hot meals and surplus food redistribution to street shelters and community kitchens across Pune.',
    city: 'Pune',
    area: 'Kothrud',
    address: '18 Paud Road, Kothrud, Pune',
    location: { lat: 18.5074, lng: 73.8077 },
    distanceKm: 5.1,
    phone: '+91 98221 44556',
    email: 'help@foodrelief.org',
    website: 'https://foodrelief.org.in',
    areasOfSupport: ['Surplus Food Distribution', 'Emergency Rations', 'Community Kitchens'],
    beneficiariesCount: 2800,
    pastDonationsCount: 640,
    impactScore: '96%',
    currentRequirements: [
      { id: 'req-3', item: 'Fresh Cooked Meals', category: 'Food', quantity: 100, unit: 'Portions', urgency: 'HIGH', requiredBy: '2026-08-17', beneficiaries: 100 },
      { id: 'req-4', item: 'Cooking Oil', category: 'Food', quantity: 20, unit: 'Liters', urgency: 'MEDIUM', requiredBy: '2026-08-22', beneficiaries: 80 }
    ]
  },
  {
    id: 'ngo-103',
    name: 'Seva Asha Community Shelter',
    verified: true,
    addressVerified: true,
    logo: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=150&auto=format&fit=crop&q=80',
    description: 'Shelter home supporting homeless families, women, and children with shelter, warm clothes, and basic healthcare supplies.',
    city: 'Pune',
    area: 'Viman Nagar',
    address: '89 Nagar Road, Viman Nagar, Pune',
    location: { lat: 18.5679, lng: 73.9143 },
    distanceKm: 7.8,
    phone: '+91 98225 77889',
    email: 'info@sevaasha.org',
    website: 'https://sevaasha.org',
    areasOfSupport: ['Clothes', 'Medical Supplies', 'Electronics / Appliances'],
    beneficiariesCount: 920,
    pastDonationsCount: 210,
    impactScore: '99%',
    currentRequirements: [
      { id: 'req-5', item: 'Winter Jackets & Blankets', category: 'Clothes', quantity: 60, unit: 'Pieces', urgency: 'HIGH', requiredBy: '2026-08-19', beneficiaries: 60 },
      { id: 'req-6', item: 'First Aid Supplies & Antiseptics', category: 'Medical Supplies', quantity: 15, unit: 'Kits', urgency: 'HIGH', requiredBy: '2026-08-18', beneficiaries: 150 }
    ]
  },
  {
    id: 'ngo-104',
    name: 'Gyan Jyoti Shikshan Trust',
    verified: true,
    addressVerified: true,
    logo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=150&auto=format&fit=crop&q=80',
    description: 'Empowering children in slum clusters through digital literacy, school books, and refurbished educational electronics.',
    city: 'Pune',
    area: 'Hadapsar',
    address: '104 Solapur Highway, Hadapsar, Pune',
    location: { lat: 18.5089, lng: 73.9260 },
    distanceKm: 9.3,
    phone: '+91 98229 99001',
    email: 'contact@gyanjyoti.org',
    website: 'https://gyanjyoti.org',
    areasOfSupport: ['Educational Materials', 'Electronics', 'Books'],
    beneficiariesCount: 1600,
    pastDonationsCount: 310,
    impactScore: '97%',
    currentRequirements: [
      { id: 'req-7', item: 'Laptops / Tablets for Digital Lab', category: 'Electronics', quantity: 5, unit: 'Units', urgency: 'MEDIUM', requiredBy: '2026-08-30', beneficiaries: 80 },
      { id: 'req-8', item: 'Stationery Kits (Notebooks, Pens)', category: 'Educational Materials', quantity: 150, unit: 'Packs', urgency: 'HIGH', requiredBy: '2026-08-21', beneficiaries: 150 }
    ]
  },
  {
    id: 'ngo-105',
    name: 'Aarogya Care Foundation',
    verified: true,
    addressVerified: false,
    logo: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=150&auto=format&fit=crop&q=80',
    description: 'Mobile healthcare units providing free basic medical kits, adult diapers, and sanitation items to elder care homes.',
    city: 'Pune',
    area: 'Baner',
    address: '55 Baner Main Road, Baner, Pune',
    location: { lat: 18.5590, lng: 73.7868 },
    distanceKm: 4.2,
    phone: '+91 98230 33445',
    email: 'support@aarogyacare.org',
    website: 'https://aarogyacare.org',
    areasOfSupport: ['Medical Supplies', 'Other'],
    beneficiariesCount: 780,
    pastDonationsCount: 180,
    impactScore: '94%',
    currentRequirements: [
      { id: 'req-9', item: 'Medical Hygiene & Sanitizer Supplies', category: 'Medical Supplies', quantity: 30, unit: 'Boxes', urgency: 'HIGH', requiredBy: '2026-08-18', beneficiaries: 90 }
    ]
  }
];

export const MOCK_INITIAL_DONATIONS = [
  {
    id: 'DON-2026-00482',
    title: '50 kg Basmati Rice & Grain Stock',
    category: 'Food',
    itemName: 'Basmati Rice',
    quantity: 50,
    unit: 'kg',
    description: 'Sealed 25kg sacks of premium Basmati rice, freshly sourced for donation.',
    condition: 'New / Sealed',
    pickupLocation: 'FC Road, Deccan Gymkhana, Pune',
    pickupCoords: { lat: 18.5196, lng: 73.8412 },
    availabilityDate: '2026-08-17',
    availabilityTime: '14:00 - 18:00',
    urgency: 'HIGH',
    notes: 'Please bring a small van or carrier vehicle.',
    status: 'MATCHED', // AVAILABLE, MATCHED, PICKUP_SCHEDULED, IN_TRANSIT, DELIVERED, COMPLETED
    matchedNgoId: 'ngo-101',
    matchedNgoName: 'Helping Hands Foundation',
    createdAt: '2026-08-16T10:30:00Z',
    donorName: 'Green Bite Restaurant',
    donorPhone: '+91 98111 22334',
    trackingTimeline: [
      { status: 'CREATED', label: 'Donation Created', timestamp: '2026-08-16T10:30:00Z', completed: true },
      { status: 'MATCHED', label: 'Receiver Matched', timestamp: '2026-08-16T11:15:00Z', completed: true },
      { status: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled', timestamp: '2026-08-16T15:00:00Z', completed: false },
      { status: 'IN_TRANSIT', label: 'In Transit', timestamp: null, completed: false },
      { status: 'DELIVERED', label: 'Delivered', timestamp: null, completed: false },
      { status: 'COMPLETED', label: 'Donation Completed', timestamp: null, completed: false }
    ]
  },
  {
    id: 'DON-2026-00391',
    title: '30 Gently Used Kids Blankets & Sweaters',
    category: 'Clothes',
    itemName: 'Children Winter Clothes',
    quantity: 30,
    unit: 'Pieces',
    description: 'Cleaned and packed winter clothes for children aged 5-12.',
    condition: 'Gently Used',
    pickupLocation: 'Aundh DP Road, Pune',
    pickupCoords: { lat: 18.5602, lng: 73.8031 },
    availabilityDate: '2026-08-18',
    availabilityTime: '10:00 - 16:00',
    urgency: 'MEDIUM',
    notes: 'Cardboard boxes ready for pick up.',
    status: 'IN_TRANSIT',
    matchedNgoId: 'ngo-103',
    matchedNgoName: 'Seva Asha Community Shelter',
    createdAt: '2026-08-15T09:00:00Z',
    donorName: 'Ananya Sharma',
    donorPhone: '+91 98222 55667',
    trackingTimeline: [
      { status: 'CREATED', label: 'Donation Created', timestamp: '2026-08-15T09:00:00Z', completed: true },
      { status: 'MATCHED', label: 'Receiver Matched', timestamp: '2026-08-15T10:20:00Z', completed: true },
      { status: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled', timestamp: '2026-08-16T08:00:00Z', completed: true },
      { status: 'IN_TRANSIT', label: 'In Transit', timestamp: '2026-08-16T12:30:00Z', completed: true },
      { status: 'DELIVERED', label: 'Delivered', timestamp: null, completed: false },
      { status: 'COMPLETED', label: 'Donation Completed', timestamp: null, completed: false }
    ]
  },
  {
    id: 'DON-2026-00215',
    title: '15 Refurbished School Laptops',
    category: 'Electronics',
    itemName: 'Dell & HP Laptops',
    quantity: 15,
    unit: 'Units',
    description: 'Working laptops with Windows 10 & educational apps pre-installed.',
    condition: 'Refurbished',
    pickupLocation: 'Kharadi IT Park, Pune',
    pickupCoords: { lat: 18.5515, lng: 73.9348 },
    availabilityDate: '2026-08-12',
    availabilityTime: '11:00 - 17:00',
    urgency: 'HIGH',
    notes: 'Chargers and carry bags included.',
    status: 'COMPLETED',
    matchedNgoId: 'ngo-104',
    matchedNgoName: 'Gyan Jyoti Shikshan Trust',
    createdAt: '2026-08-11T14:00:00Z',
    donorName: 'TechSolutions Pvt Ltd',
    donorPhone: '+91 98765 43210',
    trackingTimeline: [
      { status: 'CREATED', label: 'Donation Created', timestamp: '2026-08-11T14:00:00Z', completed: true },
      { status: 'MATCHED', label: 'Receiver Matched', timestamp: '2026-08-11T15:30:00Z', completed: true },
      { status: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled', timestamp: '2026-08-12T10:00:00Z', completed: true },
      { status: 'IN_TRANSIT', label: 'In Transit', timestamp: '2026-08-12T11:45:00Z', completed: true },
      { status: 'DELIVERED', label: 'Delivered', timestamp: '2026-08-12T14:15:00Z', completed: true },
      { status: 'COMPLETED', label: 'Donation Completed', timestamp: '2026-08-12T16:00:00Z', completed: true }
    ]
  }
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Donation Accepted!',
    message: 'Helping Hands Foundation accepted your donation DON-2026-00482.',
    time: '10 mins ago',
    read: false,
    type: 'SUCCESS'
  },
  {
    id: 'notif-2',
    title: 'Pickup Scheduled',
    message: 'Volunteer courier assigned for pickup at 4:30 PM today.',
    time: '1 hour ago',
    read: false,
    type: 'INFO'
  },
  {
    id: 'notif-3',
    title: 'Donation In Transit 🚚',
    message: 'Donation DON-2026-00391 is on the way to Seva Asha Shelter.',
    time: '3 hours ago',
    read: true,
    type: 'WARNING'
  },
  {
    id: 'notif-4',
    title: 'Donation Completed 🎉',
    message: 'Certificate available for donation DON-2026-00215.',
    time: '2 days ago',
    read: true,
    type: 'SUCCESS'
  }
];

export const IMPACT_METRICS = {
  totalKgResources: 12450,
  familiesHelped: 3820,
  activeDonorsCount: 126,
  partnerNgosCount: 48,
  categoryBreakdown: [
    { category: 'Food', percentage: 45, color: '#10B981' },
    { category: 'Clothes', percentage: 22, color: '#3B82F6' },
    { category: 'Books', percentage: 14, color: '#F59E0B' },
    { category: 'Medical Supplies', percentage: 11, color: '#EF4444' },
    { category: 'Electronics', percentage: 8, color: '#8B5CF6' }
  ],
  monthlyDonationStats: [
    { month: 'Mar', kg: 1400 },
    { month: 'Apr', kg: 1850 },
    { month: 'May', kg: 2100 },
    { month: 'Jun', kg: 2400 },
    { month: 'Jul', kg: 2800 },
    { month: 'Aug', kg: 3900 }
  ]
};
