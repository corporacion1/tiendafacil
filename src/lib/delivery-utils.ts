import { DeliveryFeeCalculationResult } from './types';

export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const isPointInZone = (
  pointLat: number,
  pointLon: number,
  zoneCenterLat: number,
  zoneCenterLon: number,
  zoneRadiusKm: number
): boolean => {
  const distance = calculateDistanceKm(pointLat, pointLon, zoneCenterLat, zoneCenterLon);
  return distance <= zoneRadiusKm;
};

export const calculateEstimatedMinutes = (
  distanceKm: number,
  minutesPerKm: number = 5
): number => {
  return Math.ceil(distanceKm * minutesPerKm);
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
};

export const formatGoogleMapsUrl = (
  lat: number,
  lon: number
): string => {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
};

export const formatGoogleMapsDirectionsUrl = (
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number
): string => {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destLat},${destLon}`;
};

export const formatWhatsAppLink = (
  phone: string,
  message?: string
): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  let url = `https://wa.me/${cleanPhone}`;
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  return url;
};

export const formatCurrency = (
  amount: number,
  symbol: string = '$'
): string => {
  return `${symbol}${amount.toFixed(2)}`;
};
