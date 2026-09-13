export const formatPickupTime = (pickupTime) => {
  if (!pickupTime) return 'Not provided';
  if (typeof pickupTime !== 'string') return String(pickupTime);
  
  const trimmed = pickupTime.trim();
  if (!trimmed) return 'Not provided';

  // 1. Try parsing full date/datetime (ISO, datetime-local, timestamp)
  const d = new Date(trimmed);
  if (!isNaN(d.getTime()) && !/^\d{1,2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // 2. Check if it's a bare time like "14:00" or "03:41" (legacy claims)
  const timeRegex = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;
  const match = trimmed.match(timeRegex);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  // 3. Return raw string if it's readable e.g. "Flexible"
  return trimmed;
};
