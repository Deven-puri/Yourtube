import { useTheme } from '@/lib/ThemeContext';
import { Sun, Moon, MapPin, Clock } from 'lucide-react';

export default function ThemeIndicator() {
  const { theme, location } = useTheme();
  
  // Get current IST time
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const currentHour = istTime.getHours();
  const isTargetTime = currentHour >= 10 && currentHour < 12;
  
  const southIndianStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
  const isSouthIndia = location && southIndianStates.includes(location.state);

  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-xl shadow-2xl border-2 p-4 backdrop-blur-sm ${
      theme === 'light' 
        ? 'bg-white/90 border-yellow-400 text-gray-900' 
        : 'bg-gray-900/90 border-blue-500 text-white'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        {theme === 'light' ? (
          <Sun className="h-6 w-6 text-yellow-600" />
        ) : (
          <Moon className="h-6 w-6 text-blue-400" />
        )}
        <div>
          <h3 className="font-bold text-lg">
            {theme === 'light' ? 'Light Theme' : 'Dark Theme'}
          </h3>
          <p className="text-xs opacity-75">Context-Aware Theming Active</p>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 opacity-60" />
          <span className="font-medium">Location:</span>
          <span>{location?.state || 'Detecting...'}</span>
          {isSouthIndia && <span className="ml-1 text-green-600 font-bold">✓ South India</span>}
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 opacity-60" />
          <span className="font-medium">IST Time:</span>
          <span>{istTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          {isTargetTime && <span className="ml-1 text-green-600 font-bold">✓ 10-12 PM</span>}
        </div>
      </div>
      
      <div className={`mt-3 pt-3 border-t text-xs ${
        theme === 'light' ? 'border-gray-200' : 'border-gray-700'
      }`}>
        <strong>Rule:</strong> Light theme = South India + 10AM-12PM IST
      </div>
    </div>
  );
}
