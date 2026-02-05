import type { NextApiRequest, NextApiResponse } from 'next';

const SOUTH_INDIAN_STATES = [
  'tamil nadu', 'kerala', 'karnataka', 'andhra pradesh', 'telangana',
  'tn', 'kl', 'ka', 'ap', 'ts'
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get IP from request headers (handles proxies)
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' 
      ? forwarded.split(',')[0] 
      : req.socket.remoteAddress;

    // For localhost/development, return a test location
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip?.includes('localhost')) {
      return res.status(200).json({
        state: 'Karnataka',
        country: 'India',
        latitude: 12.9716,
        longitude: 77.5946,
        isSouthIndia: true
      });
    }

    // Fetch location data from ipapi.co with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'YourTube-App/1.0'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch location data: ${response.status}`);
    }

    const data = await response.json();
    
    // Check for API errors
    if (data.error) {
      throw new Error(data.reason || 'Location API error');
    }

    const state = data.region || data.region_code || '';
    const isSouthIndia = SOUTH_INDIAN_STATES.some(
      s => state.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase() === state.toLowerCase()
    );

    const locationData = {
      state: state,
      country: data.country_name || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      isSouthIndia
    };

    return res.status(200).json(locationData);
  } catch (error: any) {
    
    // Return a default location on error (South India for demo purposes)
    return res.status(200).json({
      state: 'Karnataka',
      country: 'India',
      latitude: 12.9716,
      longitude: 77.5946,
      isSouthIndia: true
    });
  }
}
