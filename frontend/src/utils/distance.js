/**
 * Haversine distance formula to calculate distance between two coordinates in kilometers.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Number(distance.toFixed(1));
}

// Alias for convenience
export const calculateDistance = calculateDistanceKm;

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display.
 * @param {number} km 
 * @returns {string} e.g. "1.2 km" or "800 m"
 */
export function formatDistance(km) {
  if (km == null || isNaN(km)) return "-- km";
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Sorts suppliers nearest to the user coordinates.
 * @param {Array} suppliers 
 * @param {{lat: number, lng: number}} userCoords 
 * @returns {Array} suppliers with added distanceKm property sorted ascending
 */
export function sortSuppliersByDistance(suppliers = [], userCoords) {
  if (!userCoords || userCoords.lat == null || userCoords.lng == null) {
    return suppliers.map(s => ({ ...s, distanceKm: 0 }));
  }

  return suppliers
    .map(s => ({
      ...s,
      distanceKm: calculateDistanceKm(userCoords.lat, userCoords.lng, s.lat, s.lng)
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
