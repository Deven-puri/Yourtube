// Location and Theme Service

export interface LocationData {
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  isSouthIndia: boolean;
}

const SOUTH_INDIAN_STATES = [
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'TN', 'KL', 'KA', 'AP', 'TS' // Abbreviations
];

/**
 * Get user's location using server-side API route
 */
export const getUserLocation = async (): Promise<LocationData | null> => {
  try {
    // Call our Next.js API route instead of ipapi.co directly to avoid CORS
    const response = await fetch('/api/location');
    
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const locationData: LocationData = await response.json();

    // Store in localStorage for persistence (only on client side)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('userLocation', JSON.stringify(locationData));
    }

    return locationData;
  } catch (error) {
    console.error('Error fetching location:', error);
    
    // Try to get from localStorage as fallback (only on client side)
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('userLocation');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    
    // Return default location if all else fails
    return {
      state: 'Unknown',
      country: 'Unknown',
      latitude: 0,
      longitude: 0,
      isSouthIndia: false
    };
  }
};

/**
 * Get current time in IST
 */
export const getCurrentISTTime = (): Date => {
  // Get current time and convert to IST (UTC+5:30)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (3600000 * 5.5));
  return istTime;
};

/**
 * Check if current time is between 10 AM and 12 PM IST
 */
export const isWithinThemeTimeRange = (): boolean => {
  const istTime = getCurrentISTTime();
  const hours = istTime.getHours();
  return hours >= 10 && hours < 12;
};

/**
 * Determine if light theme should be applied
 * Light theme: South India + 10 AM - 12 PM IST
 * Dark theme: All other cases
 */
export const shouldUseLightTheme = async (): Promise<boolean> => {
  const location = await getUserLocation();
  const isCorrectTime = isWithinThemeTimeRange();
  
  // Light theme only if in South India AND between 10-12 PM IST
  return location?.isSouthIndia === true && isCorrectTime;
};

/**
 * Get cached location data without fetching
 */
export const getCachedLocation = (): LocationData | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  
  const stored = window.localStorage.getItem('userLocation');
  return stored ? JSON.parse(stored) : null;
};

/**
 * Validate if user is in South India for authentication purposes
 */
export const isSouthIndianUser = async (): Promise<boolean> => {
  const location = await getUserLocation();
  return location?.isSouthIndia || false;
};
