// Donation Service: Manages Donations, Requests, Volunteer Logistics, NGO Directory, and Real-time Tracking

import { MOCK_INITIAL_DONATIONS, MOCK_NOTIFICATIONS, MOCK_NGOS } from './mockData';

const DONATIONS_STORAGE_KEY = 'donor_bridge_donations_v1';
const REQUESTS_STORAGE_KEY = 'donor_bridge_requests_v1';
const NOTIFICATIONS_STORAGE_KEY = 'donor_bridge_notifications_v1';
const NGOS_STORAGE_KEY = 'donor_bridge_ngos_v1';

const listeners = new Set();

export const subscribeToDonationUpdates = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const notifyListeners = () => {
  listeners.forEach(cb => cb());
};

// Initializer
export const getStoredDonations = () => {
  try {
    const data = localStorage.getItem(DONATIONS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read stored donations:', e);
  }
  localStorage.setItem(DONATIONS_STORAGE_KEY, JSON.stringify(MOCK_INITIAL_DONATIONS));
  return MOCK_INITIAL_DONATIONS;
};

export const getStoredNgos = () => {
  try {
    const data = localStorage.getItem(NGOS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read stored NGOs:', e);
  }
  localStorage.setItem(NGOS_STORAGE_KEY, JSON.stringify(MOCK_NGOS));
  return MOCK_NGOS;
};

export const registerNgo = (ngoData) => {
  const ngos = getStoredNgos();
  const isVerified = ngoData.verificationStatus === 'VERIFIED_PARTNER';
  const newNgo = {
    id: `ngo-${Date.now()}`,
    name: ngoData.name,
    verified: isVerified,
    verificationStatus: ngoData.verificationStatus || (isVerified ? 'VERIFIED_PARTNER' : 'COMMUNITY_RECEIVER'),
    addressVerified: Boolean(isVerified),
    logo: ngoData.logo || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=150&auto=format&fit=crop&q=80',
    description: ngoData.description || 'Registered organization on the Food Donation ↔ Receiver Bridge Platform.',
    city: ngoData.city || 'Pune',
    area: ngoData.area || 'Central Area',
    address: ngoData.address,
    location: ngoData.location || { lat: 18.5204, lng: 73.8567 },
    distanceKm: 3.0,
    phone: ngoData.phone,
    email: ngoData.email,
    website: ngoData.website || '',
    foodTypesAccepted: ngoData.foodTypesAccepted || ['Cooked Food', 'Raw Grains', 'Packaged Food'],
    capacity: ngoData.capacity || '500 meals/day',
    areasOfSupport: ['Surplus Food Distribution', 'Emergency Relief'],
    beneficiariesCount: 250,
    pastDonationsCount: 0,
    impactScore: isVerified ? '100%' : '90%',
    currentRequirements: []
  };

  const updated = [newNgo, ...ngos];
  localStorage.setItem(NGOS_STORAGE_KEY, JSON.stringify(updated));

  // Notification
  addNotification({
    title: 'New NGO Registered 🏛️',
    message: `${newNgo.name} joined as ${isVerified ? 'Verified Partner' : 'Community Receiver'}.`,
    type: 'SUCCESS'
  });

  notifyListeners();
  return newNgo;
};

export const updateNgoProfile = (ngoId, updatePayload) => {
  const ngos = getStoredNgos();
  const updated = ngos.map(ngo => {
    if (ngo.id === ngoId) {
      return { ...ngo, ...updatePayload };
    }
    return ngo;
  });
  localStorage.setItem(NGOS_STORAGE_KEY, JSON.stringify(updated));
  notifyListeners();
  return updated.find(n => n.id === ngoId);
};

export const getStoredRequests = () => {
  try {
    const data = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read stored requests:', e);
  }
  const ngos = getStoredNgos();
  const initialRequests = ngos.flatMap(ngo => (ngo.currentRequirements || []).map(req => ({
    ...req,
    ngoId: ngo.id,
    ngoName: ngo.name,
    ngoLocation: ngo.location,
    city: ngo.city,
    area: ngo.area,
    status: 'ACTIVE'
  })));
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(initialRequests));
  return initialRequests;
};

export const getStoredNotifications = () => {
  try {
    const data = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read stored notifications:', e);
  }
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(MOCK_NOTIFICATIONS));
  return MOCK_NOTIFICATIONS;
};

export const addNotification = (notif) => {
  const current = getStoredNotifications();
  const newNotif = {
    id: `notif-${Date.now()}`,
    time: 'Just now',
    read: false,
    ...notif
  };
  const updated = [newNotif, ...current.slice(0, 19)];
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  notifyListeners();
  return newNotif;
};

export const createDonation = (donationData, user = null) => {
  const donations = getStoredDonations();
  const newId = `DON-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

  // Default coordinates fallback
  const donorCoords = donationData.pickupCoords || { lat: 18.5204, lng: 73.8567 };

  const newDonation = {
    id: newId,
    title: donationData.title || `${donationData.quantity} ${donationData.unit || 'kg'} ${donationData.foodType || 'Food'}`,
    category: donationData.category || 'Food',
    foodType: donationData.foodType || 'Cooked Food',
    itemName: donationData.itemName || donationData.foodType || 'Food Item',
    excessDetails: donationData.excessDetails || donationData.description || 'Surplus prepared meals / grocery stock',
    quantity: Number(donationData.quantity) || 10,
    unit: donationData.unit || 'kg',
    condition: donationData.condition || 'Fresh',
    expiryDate: donationData.expiryDate || new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10),
    preparedDate: donationData.preparedDate || new Date().toISOString().slice(0, 10),
    storageCondition: donationData.storageCondition || 'Normal',
    pickupLocation: donationData.pickupLocation || 'FC Road, Deccan Gymkhana, Pune',
    pickupCoords: donorCoords,
    volunteerId: null,
    volunteerName: null,
    volunteerPhone: null,
    volunteerCoords: null,
    ngoCoords: { lat: 18.5308, lng: 73.8474 }, // Default Helping Hands
    availabilityDate: donationData.availabilityDate || new Date().toISOString().slice(0, 10),
    availabilityTime: donationData.availabilityTime || '14:00 - 18:00',
    urgency: donationData.urgency || 'HIGH',
    notes: donationData.notes || '',
    status: 'CREATED',
    matchedNgoId: null,
    matchedNgoName: null,
    createdAt: new Date().toISOString(),
    donorName: user?.name || donationData.donorName || 'Ananya Sharma (Donor)',
    donorPhone: user?.phone || '+91 98220 54321',
    trackingTimeline: [
      { status: 'CREATED', label: 'Donation Created 📍', timestamp: new Date().toISOString(), completed: true },
      { status: 'MATCHED', label: 'Receiver Matched 🏛️', timestamp: null, completed: false },
      { status: 'VOLUNTEER_ASSIGNED', label: 'Volunteer Assigned 🚴', timestamp: null, completed: false },
      { status: 'FOOD_PICKED_UP', label: 'Food Picked Up 🍱', timestamp: null, completed: false },
      { status: 'IN_TRANSIT', label: 'Out for Delivery 🚚', timestamp: null, completed: false },
      { status: 'DELIVERED', label: 'Delivered to Receiver 📍', timestamp: null, completed: false }
    ]
  };

  const updated = [newDonation, ...donations];
  localStorage.setItem(DONATIONS_STORAGE_KEY, JSON.stringify(updated));

  addNotification({
    title: 'Donation Created 📦',
    message: `Your food surplus listing ${newId} (${newDonation.quantity} ${newDonation.unit}) is now live for matching.`,
    type: 'SUCCESS'
  });

  notifyListeners();
  return newDonation;
};

export const createReceiverRequest = (requestData, user = null) => {
  const requests = getStoredRequests();
  const orgTitle = user?.orgName || user?.name || user?.fullName || 'Helping Hands Foundation';
  const orgLocation = user?.location || { lat: 18.5308, lng: 73.8474 };
  const orgCity = user?.city || 'Pune';
  const orgArea = requestData.area || requestData.location || user?.address || 'Shivajinagar';

  const newReq = {
    id: `req-${Date.now()}`,
    ngoId: user?.id || user?._id || 'ngo-101',
    ngoName: orgTitle,
    ngoLocation: orgLocation,
    item: requestData.item || requestData.itemName || 'Food Supplies',
    category: requestData.category || 'Food',
    quantity: Number(requestData.quantity) || 10,
    unit: requestData.unit || 'kg',
    urgency: requestData.urgency || 'HIGH',
    requiredBy: requestData.requiredBy || new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10),
    description: requestData.description || requestData.notes || '',
    city: orgCity,
    area: orgArea,
    address: requestData.address || user?.address || orgArea,
    contactPhone: requestData.phone || user?.phone || '',
    beneficiaries: requestData.beneficiaries || 100,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const updated = [newReq, ...requests];
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated));

  addNotification({
    title: 'Requirement Published 📢',
    message: `Requirement for ${newReq.quantity} ${newReq.unit} of ${newReq.item} published by ${orgTitle}.`,
    type: 'INFO'
  });

  notifyListeners();
  return newReq;
};

export const confirmDonationMatch = (donationId, ngoId, ngoName) => {
  const donations = getStoredDonations();
  const ngos = getStoredNgos();
  const matchedNgo = ngos.find(n => n.id === ngoId);

  const updated = donations.map(d => {
    if (d.id === donationId) {
      const now = new Date().toISOString();
      const updatedTimeline = (d.trackingTimeline || []).map(step => {
        if (step.status === 'CREATED' || step.status === 'MATCHED') {
          return { ...step, completed: true, timestamp: step.timestamp || now };
        }
        return step;
      });

      return {
        ...d,
        status: d.status === 'CREATED' ? 'MATCHED' : d.status,
        matchedNgoId: ngoId,
        matchedNgoName: ngoName,
        ngoCoords: matchedNgo?.location || d.ngoCoords || { lat: 18.5308, lng: 73.8474 },
        trackingTimeline: updatedTimeline
      };
    }
    return d;
  });

  localStorage.setItem(DONATIONS_STORAGE_KEY, JSON.stringify(updated));

  addNotification({
    title: 'Receiver Matched 🤝',
    message: `Donation ${donationId} matched with ${ngoName}. Awaiting volunteer pickup assignment.`,
    type: 'SUCCESS'
  });

  notifyListeners();
  return updated.find(d => d.id === donationId);
};

// Volunteer Actions
export const assignVolunteerToDonation = (donationId, volunteer = { name: 'Rahul Verma (Rider)', phone: '+91 98233 44112', coords: { lat: 18.5240, lng: 73.8445 } }) => {
  const donations = getStoredDonations();
  const now = new Date().toISOString();

  const updated = donations.map(d => {
    if (d.id === donationId) {
      const updatedTimeline = (d.trackingTimeline || []).map(step => {
        if (['CREATED', 'MATCHED', 'VOLUNTEER_ASSIGNED'].includes(step.status)) {
          return { ...step, completed: true, timestamp: step.timestamp || now };
        }
        return step;
      });

      return {
        ...d,
        status: 'VOLUNTEER_ASSIGNED',
        volunteerId: `vol-${Date.now()}`,
        volunteerName: volunteer.name || 'Volunteer Rider',
        volunteerPhone: volunteer.phone || '+91 98233 44112',
        volunteerCoords: volunteer.coords || { lat: 18.5240, lng: 73.8445 },
        trackingTimeline: updatedTimeline
      };
    }
    return d;
  });

  localStorage.setItem(DONATIONS_STORAGE_KEY, JSON.stringify(updated));

  addNotification({
    title: 'Volunteer Assigned 🚴',
    message: `${volunteer.name} accepted pickup for ${donationId}. Heading to donor pickup location.`,
    type: 'INFO'
  });

  notifyListeners();
  return updated.find(d => d.id === donationId);
};

export const updateVolunteerLocation = (donationId, coords) => {
  const donations = getStoredDonations();
  const updated = donations.map(d => {
    if (d.id === donationId) {
      return {
        ...d,
        volunteerCoords: coords
      };
    }
    return d;
  });
  localStorage.setItem(DONATIONS_STORAGE_KEY, JSON.stringify(updated));
  notifyListeners();
  return updated.find(d => d.id === donationId);
};

export const markFoodPickedUp = (donationId) => {
  const donations = getStoredDonations();
  const now = new Date().toISOString();

  const updated = donations.map(d => {
    if (d.id === donationId) {
      const updatedTimeline = (d.trackingTimeline || []).map(step => {
        if (['CREATED', 'MATCHED', 'VOLUNTEER_ASSIGNED', 'FOOD_PICKED_UP', 'IN_TRANSIT'].includes(step.status)) {
          return { ...step, completed: true, timestamp: step.timestamp || now };
        }
        return step;
      });

      return {
        ...d,
        status: 'IN_TRANSIT',
        trackingTimeline: updatedTimeline
      };
    }
    return d;
  });

  localStorage.setItem(DONATIONS_STORAGE_KEY, JSON.stringify(updated));

  addNotification({
    title: 'Food Picked Up 🍱',
    message: `Volunteer has collected donation ${donationId}. Currently out for delivery to receiver.`,
    type: 'INFO'
  });

  notifyListeners();
  return updated.find(d => d.id === donationId);
};

export const markFoodDelivered = (donationId) => {
  const donations = getStoredDonations();
  const now = new Date().toISOString();

  const updated = donations.map(d => {
    if (d.id === donationId) {
      const updatedTimeline = (d.trackingTimeline || []).map(step => {
        return { ...step, completed: true, timestamp: step.timestamp || now };
      });

      return {
        ...d,
        status: 'DELIVERED',
        trackingTimeline: updatedTimeline
      };
    }
    return d;
  });

  localStorage.setItem(DONATIONS_STORAGE_KEY, JSON.stringify(updated));

  addNotification({
    title: 'Food Delivered Successfully! 🎉',
    message: `Donation ${donationId} delivered to ${updated.find(d => d.id === donationId)?.matchedNgoName || 'Receiver NGO'}. Certificate ready.`,
    type: 'SUCCESS'
  });

  notifyListeners();
  return updated.find(d => d.id === donationId);
};

export const updateDonationStatus = (donationId, newStatus) => {
  const donations = getStoredDonations();
  const now = new Date().toISOString();

  const statusOrder = ['CREATED', 'MATCHED', 'VOLUNTEER_ASSIGNED', 'FOOD_PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'];
  const targetIndex = statusOrder.indexOf(newStatus);

  const updated = donations.map(d => {
    if (d.id === donationId) {
      const updatedTimeline = (d.trackingTimeline || []).map(step => {
        const stepIndex = statusOrder.indexOf(step.status);
        if (stepIndex <= targetIndex && stepIndex !== -1) {
          return { ...step, completed: true, timestamp: step.timestamp || now };
        }
        return step;
      });

      return {
        ...d,
        status: newStatus,
        trackingTimeline: updatedTimeline
      };
    }
    return d;
  });

  localStorage.setItem(DONATIONS_STORAGE_KEY, JSON.stringify(updated));
  notifyListeners();
  return updated.find(d => d.id === donationId);
};

// ── Org Receiver Request Management ─────────────────────────────────────────

/** Update editable fields (quantity, urgency) on a receiver/shortage request. */
export const updateReceiverRequest = (requestId, changes = {}) => {
  const requests = getStoredRequests();
  const updated = requests.map(r =>
    r.id === requestId ? { ...r, ...changes, updatedAt: new Date().toISOString() } : r
  );
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated));
  notifyListeners();
  return updated.find(r => r.id === requestId);
};

/** Mark a receiver/shortage request as fulfilled (soft-deletes from active view). */
export const markRequestFulfilled = (requestId) => {
  const requests = getStoredRequests();
  const updated = requests.map(r =>
    r.id === requestId
      ? { ...r, status: 'FULFILLED', fulfilledAt: new Date().toISOString() }
      : r
  );
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated));
  notifyListeners();
};

/** Hard-delete a receiver/shortage request posted by the org. */
export const deleteReceiverRequest = (requestId) => {
  const requests = getStoredRequests();
  const updated = requests.filter(r => r.id !== requestId);
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated));
  notifyListeners();
};