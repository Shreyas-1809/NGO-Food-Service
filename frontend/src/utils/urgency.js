export const URGENT_THRESHOLD_HOURS = 4;
export const SOON_THRESHOLD_HOURS = 24;

/**
 * Calculates the urgency level and countdown text for a given listing based on its deadlines.
 * @param {Object} listing - The food listing object
 * @returns {Object} { level: 'HIGH' | 'MEDIUM' | 'LOW' | 'EXPIRED', text: string, bindingDeadline: 'PICKUP' | 'EXPIRY' }
 */
export const calculateListingUrgency = (listing) => {
  // If the listing is no longer active/available (e.g., claimed, cancelled, expired by status)
  // then we don't show an urgency state.
  const isInactive = 
    listing.status === 'COMPLETED' || 
    listing.status === 'CANCELLED' || 
    listing.status === 'REJECTED' || 
    listing.status === 'DECLINED' || 
    listing.status === 'NON_CLAIMED' ||
    listing.computedStatus === 'COMPLETED' ||
    listing.computedStatus === 'REJECTED' ||
    listing.computedStatus === 'NON_CLAIMED' ||
    listing.computedStatus === 'ACCEPTED' || // Reserved doesn't need "urgent to claim" since it's already claimed
    (listing.status !== 'AVAILABLE' && listing.status !== 'ACTIVE' && !listing.computedStatus);

  if (isInactive) {
    return { level: 'EXPIRED', text: '', bindingDeadline: null, earliestDeadline: null };
  }

  const now = new Date();
  const expiry = new Date(listing.overallExpiry || listing.expiryTime || listing.createdAt);
  
  let pickup = null;
  if (listing.pickupTimeSlot && listing.pickupTimeSlot.end) {
    pickup = new Date(listing.pickupTimeSlot.end);
  }

  // Find the earliest valid deadline
  let deadline = expiry;
  let bindingDeadline = 'EXPIRY';

  if (pickup && pickup < expiry) {
    deadline = pickup;
    bindingDeadline = 'PICKUP';
  }

  const msRemaining = deadline - now;
  const hoursRemaining = msRemaining / (1000 * 60 * 60);

  if (hoursRemaining <= 0) {
    return { level: 'EXPIRED', text: 'Expired', bindingDeadline, earliestDeadline: deadline };
  }

  // Determine text based on hours remaining
  let text = '';
  const action = bindingDeadline === 'PICKUP' ? 'Pickup needed' : 'Expires';
  
  if (hoursRemaining < 1) {
    const mins = Math.max(1, Math.floor(msRemaining / (1000 * 60)));
    text = `${action} within ${mins} min${mins !== 1 ? 's' : ''}`;
  } else if (hoursRemaining < 24) {
    const hrs = Math.floor(hoursRemaining);
    text = `${action} within ${hrs} hr${hrs !== 1 ? 's' : ''}`;
  } else if (hoursRemaining < 48) {
    text = `${action} tomorrow`;
  } else {
    const days = Math.floor(hoursRemaining / 24);
    text = `${action} in ${days} days`;
  }

  if (hoursRemaining <= URGENT_THRESHOLD_HOURS) {
    return { level: 'HIGH', text, bindingDeadline, earliestDeadline: deadline };
  } else if (hoursRemaining <= SOON_THRESHOLD_HOURS) {
    return { level: 'MEDIUM', text, bindingDeadline, earliestDeadline: deadline };
  } else {
    return { level: 'LOW', text, bindingDeadline, earliestDeadline: deadline };
  }
};
