// Donation Service: Manages Donations, Requests, Matching, Notifications, and Status Updates

import { MOCK_INITIAL_DONATIONS, MOCK_NOTIFICATIONS, MOCK_NGOS, IMPACT_METRICS } from './mockData';

const DONATIONS_STORAGE_KEY = 'donor_bridge_donations_v1';
const REQUESTS_STORAGE_KEY = 'donor_bridge_requests_v1';
const NOTIFICATIONS_STORAGE_KEY = 'donor_bridge_notifications_v1';

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

export const getStoredRequests = () => {
  try {
    const data = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read stored requests:', e);
  }
  // Default mock receiver requests
  const initialRequests = MOCK_NGOS.flatMap(ngo => ngo.currentRequirements.map(req => ({
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
    console.error('Failed to read notifications:', e);
  }
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(MOCK_NOTIFICATIONS));
  return MOCK_NOTIFICATIONS;
};

/**
 * Creates a new donation and generates a unique Donation ID (e.g., DON-2026-00482)
 */
export const createDonation = (formData, user) => {
  const donations = getStoredDonations();
  
  // Unique ID generation formula
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const donationId = `DON-${year}-${randomNum}`;

  const newDonation = {
    id: donationId,
    title: formData.title || `${formData.quantity || 1} ${formData.unit || 'units'} of ${formData.itemName || 'Supplies'}`,
    category: formData.category || 'Food',
    itemName: formData.itemName || 'Surplus Supplies',
    quantity: Number(formData.quantity) || 1,
    unit: formData.unit || 'kg',
    description: formData.description || 'Donation provided via Donor ↔ Receiver Bridge.',
    condition: formData.condition || 'New / Fresh',
    pickupLocation: formData.pickupLocation || 'Deccan Gymkhana, Pune',
    pickupCoords: formData.pickupCoords || { lat: 18.5204, lng: 73.8567 },
    availabilityDate: formData.availabilityDate || new Date().toISOString().slice(0, 10),
    availabilityTime: formData.availabilityTime || '12:00 - 18:00',
    urgency: formData.urgency || 'MEDIUM',
    notes: formData.notes || '',
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    donorName: user?.name || user?.fullName || 'Anonymous Donor',
    donorPhone: user?.phone || '+91 98000 11122',
    trackingTimeline: [
      { status: 'CREATED', label: 'Donation Created', timestamp: new Date().toISOString(), completed: true },
      { status: 'MATCHED', label: 'Receiver Matched', timestamp: null, completed: false },
      { status: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled', timestamp: null, completed: false },
      { status: 'IN_TRANSIT', label: 'In Transit', timestamp: null, completed: false },
      { status: 'DELIVERED', label: 'Delivered', timestamp: null, completed: false },
      { status: 'COMPLETED', label: 'Donation Completed', timestamp: null, completed: false }
    ]
  };

  const updated = [newDonation, ...donations];
  localStorage.setItem(DONATIONS_STORAGE_KEY, JSON.stringify(updated));

  // Add Notification
  addNotification({
    title: 'Donation Created!',
    message: `Your donation ${donationId} was created successfully. Matching with nearby verified NGOs...`,
    type: 'SUCCESS'
  });

  notifyListeners();
  return newDonation;
};

/**
 * Confirms a match between a donation and a receiver/NGO
 */
export const confirmDonationMatch = (donationId, ngoId, ngoName) => {
  const donations = getStoredDonations();
  const updated = donations.map(d => {
    if (d.id === donationId) {
      const now = new Date().toISOString();
      const updatedTimeline = d.trackingTimeline.map(step => {
        if (step.status === 'MATCHED') return { ...step, timestamp: now, completed: true };
        if (step.status === 'PICKUP_SCHEDULED') return { ...step, timestamp: new Date(Date.now() + 3600000).toISOString(), completed: true };
        return step;
      });
      return {
        ...d,
        status: 'PICKUP_SCHEDULED',
        matchedNgoId: ngoId,
        matchedNgoName: ngoName,
        trackingTimeline: updatedTimeline
      };
    }
    return d;
  });

  localStorage.setItem(DONATIONS_STORAGE_KEY, JSON.stringify(updated));

  addNotification({
    title: 'Match Confirmed! 🎉',
    message: `You matched donation ${donationId} with ${ngoName}. Pickup has been scheduled!`,
    type: 'SUCCESS'
  });

  notifyListeners();
  return updated.find(d => d.id === donationId);
};

/**
 * Updates donation status step-by-step
 */
export const updateDonationStatus = (donationId, nextStatus) => {
  const donations = getStoredDonations();
  const updated = donations.map(d => {
    if (d.id === donationId) {
      const now = new Date().toISOString();
      let foundStep = false;
      const updatedTimeline = d.trackingTimeline.map(step => {
        if (step.status === nextStatus) {
          foundStep = true;
          return { ...step, timestamp: now, completed: true };
        }
        if (!foundStep) {
          return { ...step, completed: true };
        }
        return step;
      });

      return {
        ...d,
        status: nextStatus,
        trackingTimeline: updatedTimeline
      };
    }
    return d;
  });

  localStorage.setItem(DONATIONS_STORAGE_KEY, JSON.stringify(updated));

  addNotification({
    title: `Donation Status: ${nextStatus.replace('_', ' ')}`,
    message: `Donation ${donationId} status changed to ${nextStatus}.`,
    type: 'INFO'
  });

  notifyListeners();
  return updated.find(d => d.id === donationId);
};

/**
 * Creates a Receiver Request
 */
export const createReceiverRequest = (requestData, ngoUser) => {
  const requests = getStoredRequests();
  const newRequest = {
    id: `req-${Date.now()}`,
    item: requestData.item,
    category: requestData.category || 'Food',
    quantity: Number(requestData.quantity),
    unit: requestData.unit || 'kg',
    description: requestData.description,
    location: requestData.location || 'Pune',
    requiredBy: requestData.requiredBy || new Date().toISOString().slice(0, 10),
    urgency: requestData.urgency || 'HIGH',
    beneficiaries: Number(requestData.beneficiaries) || 50,
    ngoId: ngoUser?.id || 'ngo-101',
    ngoName: ngoUser?.name || 'Helping Hands Foundation',
    ngoLocation: { lat: 18.5204, lng: 73.8567 },
    status: 'ACTIVE'
  };

  const updated = [newRequest, ...requests];
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated));

  addNotification({
    title: 'Requirement Request Published',
    message: `Request for ${requestData.quantity} ${requestData.unit} of ${requestData.item} posted.`,
    type: 'SUCCESS'
  });

  notifyListeners();
  return newRequest;
};

/**
 * Helper to add notification
 */
export const addNotification = (notif) => {
  const notifications = getStoredNotifications();
  const newNotif = {
    id: `notif-${Date.now()}`,
    title: notif.title,
    message: notif.message,
    time: 'Just now',
    read: false,
    type: notif.type || 'INFO'
  };
  const updated = [newNotif, ...notifications];
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  notifyListeners();
};

export const markNotificationRead = (notifId) => {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  notifyListeners();
};
