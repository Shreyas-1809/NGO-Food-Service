// Smart Donor ↔ Receiver Weighted Matching Engine
import { MOCK_NGOS } from './mockData';

export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 3.5;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
};

/**
 * Calculates weighted match percentage between Donor Surplus and NGO Requirement
 * Formula:
 * 1. Category match: 30%
 * 2. Item match: 25%
 * 3. Location/distance: 20%
 * 4. Urgency: 15%
 * 5. Quantity compatibility: 10%
 */
export const calculateMatchScore = (donation, req, distanceKm) => {
  let categoryScore = 0;
  let itemScore = 0;
  let locationScore = 0;
  let urgencyScore = 0;
  let quantityScore = 0;

  // 1. Category Match (30%)
  const donCat = (donation.category || '').toLowerCase();
  const reqCat = (req.category || '').toLowerCase();
  if (donCat === reqCat || donCat.includes(reqCat) || reqCat.includes(donCat)) {
    categoryScore = 30;
  } else if (donCat === 'food' && reqCat === 'groceries') {
    categoryScore = 25;
  }

  // 2. Item Match (25%)
  const donItem = (donation.itemName || donation.title || '').toLowerCase();
  const reqItem = (req.item || '').toLowerCase();
  if (donItem === reqItem) {
    itemScore = 25;
  } else if (donItem.includes(reqItem) || reqItem.includes(donItem)) {
    itemScore = 20;
  } else if (categoryScore > 0) {
    itemScore = 12; // partial fallback if same category
  }

  // 3. Location / Distance (20%)
  if (distanceKm <= 3) locationScore = 20;
  else if (distanceKm <= 7) locationScore = 15;
  else if (distanceKm <= 15) locationScore = 10;
  else locationScore = 5;

  // 4. Urgency (15%)
  const urgency = req.urgency || req.priority || donation.urgency || 'NORMAL';
  if (urgency === 'HIGH' || urgency === 'Urgent' || urgency === '🔴 Urgent') urgencyScore = 15;
  else if (urgency === 'MEDIUM' || urgency === 'Medium' || urgency === '🟡 Medium') urgencyScore = 10;
  else urgencyScore = 5;

  // 5. Quantity Compatibility (10%)
  const donQty = Number(donation.quantity) || 1;
  const reqQty = Number(req.quantity) || 1;
  const ratio = Math.min(donQty, reqQty) / Math.max(donQty, reqQty);
  quantityScore = Math.round(ratio * 10);

  const totalScore = categoryScore + itemScore + locationScore + urgencyScore + quantityScore;
  return Math.min(99, Math.max(45, totalScore));
};

export const findSmartMatches = (donation, userLocation = null) => {
  const donorLat = donation.pickupCoords?.lat || userLocation?.lat || 18.5204;
  const donorLng = donation.pickupCoords?.lng || userLocation?.lng || 73.8567;

  const matches = MOCK_NGOS.map((ngo) => {
    const distKm = calculateHaversineDistance(donorLat, donorLng, ngo.location.lat, ngo.location.lng);
    const topReq = ngo.currentRequirements[0] || { item: donation.itemName || 'Surplus Supplies', category: donation.category || 'Food', quantity: 40, urgency: 'HIGH' };

    const score = calculateMatchScore(donation, topReq, distKm);

    return {
      ngoId: ngo.id,
      ngoName: ngo.name,
      verified: ngo.verified,
      addressVerified: ngo.addressVerified,
      logo: ngo.logo,
      city: ngo.city,
      area: ngo.area,
      address: ngo.address,
      phone: ngo.phone,
      email: ngo.email,
      distanceKm: distKm,
      matchedItem: topReq.item,
      requiredQuantity: topReq.quantity,
      requiredUnit: topReq.unit || donation.unit || 'kg',
      urgency: topReq.urgency || 'HIGH',
      matchScore: score,
      location: ngo.location,
      beneficiariesCount: ngo.beneficiariesCount
    };
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore);
};

export const findRecommendedDonationsForNGO = (ngoReq, donations = []) => {
  return donations.map(d => {
    const distKm = calculateHaversineDistance(18.5308, 73.8474, d.pickupCoords?.lat || 18.5204, d.pickupCoords?.lng || 73.8567);
    const score = calculateMatchScore(d, ngoReq, distKm);
    return {
      ...d,
      distanceKm: distKm,
      matchScore: score
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
};
