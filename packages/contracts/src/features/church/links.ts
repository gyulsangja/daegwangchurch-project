export function telephoneUrl(phone: string) {
  const value = phone.replace(/[\s().-]/g, '');
  return /^\+?\d{7,15}$/.test(value) ? `tel:${value}` : null;
}
export function emailUrl(email: string) {
  return /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email) ? `mailto:${encodeURIComponent(email)}` : null;
}
export function directionsUrl(location: { latitude: number | null; longitude: number | null; address: string }) {
  const destination = location.latitude !== null && location.longitude !== null ? `${location.latitude},${location.longitude}` : location.address.trim();
  return destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : null;
}
export function mapEmbedUrl(latitude: number | null | undefined, longitude: number | null | undefined) {
  if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  const query = new URLSearchParams({ bbox: `${longitude - .005},${latitude - .003},${longitude + .005},${latitude + .003}`, layer: 'mapnik', marker: `${latitude},${longitude}` });
  return `https://www.openstreetmap.org/export/embed.html?${query}`;
}
