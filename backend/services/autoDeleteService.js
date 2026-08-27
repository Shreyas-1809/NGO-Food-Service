const Food = require('../models/Food');
const Claim = require('../models/Claim');

const cleanupExpiredFood = async () => {
  try {
    const now = new Date();
    const expiredFoods = await Food.find({
      autoDeleteAt: { $exists: true, $ne: null, $lte: now }
    });

    if (expiredFoods.length > 0) {
      for (const food of expiredFoods) {
        await Claim.deleteMany({ foodId: food._id });
        await food.deleteOne();
        console.log(`[Auto-Delete] Cleaned up expired food listing: "${food.title}" (${food._id})`);
      }
    }
  } catch (err) {
    console.error('[Auto-Delete] Error running cleanup:', err.message);
  }
};

const startAutoDeleteJob = (intervalMs = 5 * 60 * 1000) => {
  // Run once immediately on start
  cleanupExpiredFood();
  // Schedule periodic interval
  return setInterval(cleanupExpiredFood, intervalMs);
};

module.exports = {
  cleanupExpiredFood,
  startAutoDeleteJob
};
