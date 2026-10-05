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
