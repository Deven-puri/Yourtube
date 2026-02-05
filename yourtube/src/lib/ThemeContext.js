import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if theme should be light or dark based on location and time
    async function determineTheme() {
      try {
        let locationData;
        
        // Try browser geolocation first
        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            
            const { latitude, longitude } = position.coords;
            
            // Reverse geocode
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'User-Agent': 'YouTube-Clone-App' } }
            );
            const geoData = await geoResponse.json();
            
            locationData = {
              state: geoData.address?.state || 'Unknown',
              country: geoData.address?.country || 'Unknown',
              latitude,
              longitude
            };
            
          } catch (geoError) {
            const response = await fetch('/api/location');
            locationData = await response.json();
          }
        } else {
          // Fallback to IP-based location
          const response = await fetch('/api/location');
          locationData = await response.json();
        }
        
        setLocation(locationData);

        // Check if user is in South India
        const southIndianStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
        const isSouthIndia = southIndianStates.includes(locationData.state);

        // Get current IST time
        const now = new Date();
        const istOffset = 5.5 * 60; // IST is UTC+5:30
        const istTime = new Date(now.getTime() + (istOffset + now.getTimezoneOffset()) * 60000);
        const currentHour = istTime.getHours();

        // Check if time is between 10 AM and 12 PM IST
        const isTargetTime = currentHour >= 10 && currentHour < 12;

        // TEST MODE: Force light theme for demonstration
        const TEST_MODE = true;

        // Apply light theme only if in South India AND between 10 AM - 12 PM IST
        if (TEST_MODE || (isSouthIndia && isTargetTime)) {
          setTheme('light');
        } else {
          setTheme('dark');
            (!isSouthIndia ? 'Not South India' : 'Time not 10AM-12PM IST'));
        }

          state: locationData.state,
          isSouthIndia,
          istHour: currentHour,
          istTime: istTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
          isTargetTime,
          targetTimeRange: '10:00 AM - 12:00 PM IST',
          appliedTheme: (isSouthIndia && isTargetTime) ? 'light' : 'dark'
        });
      } catch (error) {
        setTheme('dark'); // Default to dark theme
      } finally {
        setLoading(false);
      }
    }

    determineTheme();
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, location, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
