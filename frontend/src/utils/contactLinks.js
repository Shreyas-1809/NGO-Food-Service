/**
 * Utility functions for generating direct communication links:
 * - tel:+<number> for phone calls
 * - https://wa.me/<number>?text=<encoded message> for WhatsApp chats
 * - mailto:<email> for direct email
 */

/**
 * Normalizes phone number into an international E.164-compatible tel: URL
 * e.g., "98220 11223" -> "tel:+919822011223"
 *       "+91 98220-11223" -> "tel:+919822011223"
 */
export const getTelLink = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  const digitsOnly = phone.replace(/[^0-9+]/g, '');
  if (!digitsOnly) return null;

  if (digitsOnly.startsWith('+')) {
    return `tel:${digitsOnly}`;
  }
  
  // Standard Indian 10-digit mobile number without country code
  if (digitsOnly.length === 10) {
    return `tel:+91${digitsOnly}`;
  }

  return `tel:+${digitsOnly}`;
};

/**
 * Normalizes phone number and encodes message for WhatsApp wa.me URL.
 * Note: WhatsApp API strictly requires digits ONLY (no '+', no spaces, no dashes).
 */
export const getWhatsAppLink = (phone, customMessage) => {
  if (!phone || typeof phone !== 'string') return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  // If 10-digit Indian number, prepend 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  const defaultMsg = 'Hello, contacting you regarding the food donation on FoodBridge.';
  const msg = customMessage || defaultMsg;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
};

/**
 * Formats an email into a mailto: URL with optional subject
 */
export const getMailtoLink = (email, subject = 'FoodBridge Donation Coordination') => {
  if (!email || typeof email !== 'string') return null;
  const cleanEmail = email.trim();
  if (!cleanEmail || !cleanEmail.includes('@')) return null;

  return `mailto:${cleanEmail}?subject=${encodeURIComponent(subject)}`;
};
