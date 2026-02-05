// Theme Context Provider
import React, { createContext, useContext, useState, useEffect } from 'react';
import { shouldUseLightTheme, getCurrentISTTime } from './locationService';

interface ThemeContextType {
  theme: 'light' | 'dark';
  isLoading: boolean;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isLoading: true,
  refreshTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isLoading, setIsLoading] = useState(true);

  const updateTheme = async () => {
    setIsLoading(true);
    try {
      const useLightTheme = await shouldUseLightTheme();
      const newTheme = useLightTheme ? 'light' : 'dark';
      setTheme(newTheme);
      
      // Apply theme to document (only on client side)
      if (typeof window !== 'undefined' && window.localStorage) {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
        window.localStorage.setItem('appTheme', newTheme);
      }
    } catch (error) {
      setTheme('dark'); // Default to dark on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Initial theme check
    updateTheme();

    // Check theme every minute in case time changes
    const interval = setInterval(() => {
      updateTheme();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isLoading, refreshTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
