import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Mail, Phone, Lock, Shield, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useUser } from '@/lib/AuthContext';
import axiosInstance from '@/lib/axiosinstance';

export default function SignIn() {
  const router = useRouter();
  const { handlegooglesignin } = useUser();
  
  // State
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [location, setLocation] = useState<any>(null);
  const [authType, setAuthType] = useState('email'); // 'email' or 'phone'
  const [otpSent, setOtpSent] = useState(false);
  
  // Form data
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');

  // Detect location on mount
  useEffect(() => {
    async function detectLocation() {
      try {
        // Try browser geolocation first for more accurate location
        if (navigator.geolocation) {
          console.log('🌍 Requesting browser geolocation...');
          
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              // Got coordinates, now reverse geocode to get state
              const { latitude, longitude } = position.coords;
              console.log('📍 Got coordinates:', { latitude, longitude });
              
              try {
                // Use a geocoding service to convert coordinates to location
                const geoResponse = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                  { headers: { 'User-Agent': 'YouTube-Clone-App' } }
                );
                const geoData = await geoResponse.json();
                
                const state = geoData.address?.state || 'Unknown';
                const country = geoData.address?.country || 'Unknown';
                
                const locationData = {
                  state,
                  country,
                  latitude,
                  longitude
                };
                
                setLocation(locationData);
                console.log('✅ Real location detected:', locationData);
                
                // Determine auth type
                const southIndianStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
                const isSouthIndia = southIndianStates.includes(state);
                setAuthType(isSouthIndia ? 'email' : 'phone');
                setLoadingLocation(false);
                
                logThemePreview(locationData);
              } catch (error) {
                console.error('Geocoding error, falling back to IP:', error);
                fallbackToIP();
              }
            },
            (error) => {
              console.log('⚠️ Geolocation permission denied or error:', error.message);
              console.log('📡 Falling back to IP-based location...');
              fallbackToIP();
            },
            { timeout: 10000 }
          );
        } else {
          console.log('📡 Browser geolocation not available, using IP...');
          fallbackToIP();
        }
        
        async function fallbackToIP() {
          const response = await fetch('/api/location');
          const data = await response.json();
          setLocation(data);
          
          const southIndianStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
          const isSouthIndia = southIndianStates.includes(data.state);
          setAuthType(isSouthIndia ? 'email' : 'phone');
          
          console.log('📍 IP-based location:', data);
          setLoadingLocation(false);
          logThemePreview(data);
        }
        
        function logThemePreview(locationData: any) {
          console.log('🔐 Auth type:', authType === 'email' ? 'Email OTP' : 'Phone OTP');
          
          const now = new Date();
          const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          const currentHour = istTime.getHours();
          const isTargetTime = currentHour >= 10 && currentHour < 12;
          const southIndianStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
          const isSouthIndia = southIndianStates.includes(locationData.state);
          
          console.log('🎨 Theme Preview:', {
            location: locationData.state,
            isSouthIndia,
            currentTime: istTime.toLocaleTimeString('en-IN'),
            isTargetTime,
            willApplyLightTheme: isSouthIndia && isTargetTime
          });
        }
      } catch (error) {
        console.error('Location detection error:', error);
        setAuthType('email'); // Default to email
        setLoadingLocation(false);
      }
    }
    
    detectLocation();
  }, []);

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await handlegooglesignin();
      toast.success('Logged in with Google!');
      setTimeout(() => router.push("/"), 100);
    } catch (error) {
      toast.error('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  // Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        state: location?.state || 'Karnataka',
        ...(authType === 'email' ? { email } : { phone })
      };
      
      const response = await axiosInstance.post('/user/request-otp', payload);
      
      if (response.data.success) {
        setOtpSent(true);
        toast.success(response.data.message);
        
        // In development, show OTP in console/toast
        if (response.data.otp) {
          console.log('🔑 Development OTP:', response.data.otp);
          toast.info(`Dev OTP: ${response.data.otp}`, { duration: 10000 });
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and Login
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        otp,
        name: name || 'User',
        state: location?.state || 'Karnataka',
        ...(authType === 'email' ? { email } : { phone })
      };
      
      const response = await axiosInstance.post('/user/verify-otp', payload);
      
      if (response.data.result) {
        // Store user data
        localStorage.setItem('Profile', JSON.stringify(response.data.result));
        toast.success(response.data.message);
        setTimeout(() => router.push("/"), 100);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 px-4 py-12 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            YouTube Clone
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to continue
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800 sm:p-8">
          
          {/* Google Sign-In Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full mb-6 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 py-6 text-base font-medium flex items-center justify-center gap-3"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-gray-800 px-3 text-gray-500 dark:text-gray-400">
                Or sign in with OTP
              </span>
            </div>
          </div>

          {/* Location Info */}
          {loadingLocation ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Detecting your location...</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Please allow location access for accurate authentication
              </p>
            </div>
          ) : (
            <>
              {/* Location Badge */}
              <div className="mb-5 flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>Location:</strong> {location?.state || 'Unknown'} • 
                  <strong className="ml-1">Auth:</strong> {authType === 'email' ? 'Email OTP' : 'Phone OTP (Simulated)'}
                </p>
              </div>

              {/* OTP Form */}
              <form className="space-y-5" onSubmit={otpSent ? handleVerifyOTP : handleRequestOTP}>
                {!otpSent ? (
                  <>
                    {/* Name Field (always show) */}
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Your name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-1.5 h-11 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    {/* Email or Phone based on region */}
                    {authType === 'email' ? (
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email address
                        </Label>
                        <div className="relative mt-1.5">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11 w-full pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          OTP will be sent to your email (South India region)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Phone number
                        </Label>
                        <div className="relative mt-1.5">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="h-11 w-full pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          OTP will be sent via SMS (Simulated - Check console)
                        </p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-base font-medium"
                    >
                      {loading ? 'Sending OTP...' : 'Send OTP →'}
                    </Button>
                  </>
                ) : (
                  <>
                    {/* OTP Input */}
                    <div>
                      <Label htmlFor="otp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enter OTP
                      </Label>
                      <div className="relative mt-1.5">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                          required
                          className="h-12 w-full pl-10 text-lg text-center tracking-widest dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        OTP sent to {authType === 'email' ? email : phone}
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full bg-green-600 hover:bg-green-700 py-6 text-base font-medium"
                    >
                      {loading ? 'Verifying...' : 'Verify & Login →'}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp('');
                      }}
                      variant="outline"
                      className="w-full py-6 text-base font-medium dark:border-gray-600 dark:text-gray-300"
                    >
                      Change {authType === 'email' ? 'Email' : 'Phone'}
                    </Button>
                  </>
                )}
              </form>
            </>
          )}

          {/* Info Box */}
          <div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  Region-Based Authentication
                </h3>
                <p className="text-xs text-blue-800 dark:text-blue-400">
                  • <strong>South India (TN, KL, KA, AP, TS):</strong> Email OTP<br />
                  • <strong>Other regions:</strong> Phone OTP (Simulated - Check console for OTP)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 rounded-xl bg-gray-900 dark:bg-gray-800 p-5 shadow-md">
          <p className="text-xs uppercase tracking-wider text-gray-400">CONTEXT-AWARE SECURITY</p>
          <p className="mt-2 text-sm text-white dark:text-gray-300">
            Dynamic theme and authentication based on your location and time.
          </p>
        </div>
      </div>
    </main>
  );
}
