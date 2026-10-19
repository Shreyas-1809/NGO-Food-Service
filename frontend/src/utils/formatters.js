export const formatPickupTime = (pickupTime, referenceDate = null) => {
  if (!pickupTime) return 'As scheduled';
  if (typeof pickupTime === 'object' && pickupTime !== null) {
    if (pickupTime.start) return formatPickupTime(pickupTime.start, referenceDate);
    if (pickupTime instanceof Date && !isNaN(pickupTime.getTime())) {
      const day = pickupTime.getDate();
      const month = pickupTime.toLocaleString('en-US', { month: 'short' });
      let hours = pickupTime.getHours();
      const minutes = String(pickupTime.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
    }
    return 'As scheduled';
  }
  
  const trimmed = String(pickupTime).trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed.toLowerCase() === 'invalid date') {
    return 'As scheduled';
  }

  // 1. Check if it's a bare time like "14:00" or "02:08" (legacy claims)
  const timeRegex = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;
  const match = trimmed.match(timeRegex);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const baseDate = referenceDate ? new Date(referenceDate) : new Date();
    if (!isNaN(baseDate.getTime())) {
      baseDate.setHours(hours, minutes, 0, 0);
      const day = baseDate.getDate();
      const month = baseDate.toLocaleString('en-US', { month: 'short' });
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      const mStr = String(minutes).padStart(2, '0');
      return `${day} ${month}, ${h12}:${mStr} ${ampm}`;
    }
  }

  // 2. Try parsing full date/datetime (ISO, datetime-local, timestamp)
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
  }

  // 3. Return raw string if readable e.g. "Flexible"
  return trimmed !== 'Invalid Date' ? trimmed : 'As scheduled';
};
