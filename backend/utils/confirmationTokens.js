const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_for_development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Generate signed, single-use tokens for a task/food listing
 */
function generateTokensForFood(foodId) {
  const nonce = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const pickupToken = jwt.sign(
    { taskId: foodId.toString(), type: 'PICKUP', nonce },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const deliveryToken = jwt.sign(
    { taskId: foodId.toString(), type: 'DELIVERY', nonce },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const volunteerToken = jwt.sign(
    { taskId: foodId.toString(), type: 'VOLUNTEER', nonce },
    JWT_SECRET,
    { expiresIn: '14d' }
  );

  return { pickupToken, deliveryToken, volunteerToken };
}

/**
 * Verify a confirmation token against secret and expected type
 */
function verifyConfirmationToken(token, expectedType) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (expectedType && decoded.type !== expectedType) {
      return { valid: false, error: `Invalid token type. Expected ${expectedType}.` };
    }
    return { valid: true, decoded };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'Confirmation link has expired.' };
    }
    return { valid: false, error: 'Invalid confirmation link or signature.' };
  }
}

/**
 * Construct full client-accessible URLs for sharing
 */
function buildConfirmationUrls(food) {
  if (!food || !food._id) return {};
  const tokens = food.confirmationTokens || {};
  return {
    confirmPickupUrl: tokens.pickupToken
      ? `${FRONTEND_URL}/confirm-pickup/${food._id}?token=${tokens.pickupToken}`
      : '',
    confirmDeliveryUrl: tokens.deliveryToken
      ? `${FRONTEND_URL}/confirm-delivery/${food._id}?token=${tokens.deliveryToken}`
      : '',
    volunteerTaskUrl: tokens.volunteerToken
      ? `${FRONTEND_URL}/pickup/${food._id}?token=${tokens.volunteerToken}`
      : ''
  };
}

module.exports = {
  generateTokensForFood,
  verifyConfirmationToken,
  buildConfirmationUrls
};
