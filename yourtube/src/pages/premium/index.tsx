import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/AuthContext';
import axios from '../../lib/axiosinstance';
import { Crown, Check, Download, Zap, Shield, Clock } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PremiumPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('Silver');
  const [loading, setLoading] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    checkPremiumStatus();

    return () => {
      document.body.removeChild(script);
    };
  }, [user]);

  const checkPremiumStatus = async () => {
    try {
      const response = await axios.get(`/premium/status/${user._id}`);
      setPremiumStatus(response.data);
    } catch (error) {
    }
  };

  const handlePayment = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Create order
      const orderResponse = await axios.post('/premium/create-order', {
        userId: user._id,
        plan: selectedPlan
      });

      const { orderId, amount, currency, keyId, mockMode } = orderResponse.data;

      // If in mock mode, bypass Razorpay and directly verify
      if (mockMode) {
        
        try {
          const verifyResponse = await axios.post('/premium/verify-payment', {
            razorpay_order_id: orderId,
            razorpay_payment_id: `mock_payment_${Date.now()}`,
            razorpay_signature: 'mock_signature',
            userId: user._id,
            plan: selectedPlan
          });

          if (verifyResponse.data.success) {
            alert(`✅ Plan upgraded successfully!\n\n🎉 You are now on the ${selectedPlan} plan.\n\nNote: Mock payment mode active (Razorpay not configured)`);
            router.push('/');
          } else {
            alert('Plan activation failed. Please try again.');
          }
        } catch (error) {
          alert('Plan activation failed. Please try again.');
        } finally {
          setLoading(false);
        }
        return;
      }

      // Configure Razorpay options for real payment
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'YouTube Premium',
        description: `${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Premium Subscription`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await axios.post('/premium/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user._id,
              plan: selectedPlan
            });

            if (verifyResponse.data.success) {
              alert('Payment successful! You are now a premium member.');
              router.push('/downloads');
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            alert('Payment verification failed. Please try again.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#8B5CF6'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      alert('Error initiating payment. Please try again.');
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'Bronze',
      name: 'Bronze',
      price: '₹10',
      period: '/month',
      color: 'from-orange-600 to-amber-700',
      badge: 'bg-orange-600',
      features: [
        '7 minutes watch time per day',
        '1 video download per day',
        'HD quality streaming',
        'Ad-supported'
      ]
    },
    {
      id: 'Silver',
      name: 'Silver',
      price: '₹50',
      period: '/month',
      popular: true,
      color: 'from-gray-400 to-gray-600',
      badge: 'bg-gray-500',
      features: [
        '10 minutes watch time per day',
        '5 video downloads per day',
        'Full HD quality',
        'Ad-free experience',
        'Priority support'
      ]
    },
    {
      id: 'Gold',
      name: 'Gold',
      price: '₹100',
      period: '/month',
      color: 'from-yellow-500 to-yellow-700',
      badge: 'bg-yellow-600',
      features: [
        '⭐ Unlimited watch time',
        '⭐ Unlimited downloads',
        '⭐ 4K quality streaming',
        '⭐ Ad-free experience',
        '⭐ Priority support',
        '⭐ Exclusive content'
      ]
    }
  ];

  if (premiumStatus?.isPremium) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="text-center">
          <div className="relative inline-block mb-6 sm:mb-8">
            <Crown className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto text-yellow-500 animate-pulse" />
            <div className="absolute inset-0 blur-2xl bg-yellow-500/30 rounded-full"></div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
            You're on {premiumStatus.planType} Plan!
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
            {premiumStatus.planType === 'Gold' 
              ? 'Enjoy unlimited watch time and downloads!' 
              : 'Enjoying premium features'}
          </p>
          <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border border-gray-800 shadow-xl max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 mb-6">
              <div className="text-center sm:text-left">
                <p className="text-sm sm:text-base lg:text-lg mb-2 text-gray-400">Current Plan:</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                  {premiumStatus.planType}
                </p>
              </div>
              <div className="bg-yellow-500/10 p-3 sm:p-4 rounded-full">
                <Crown className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-yellow-500" />
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4 sm:pt-6">
              <p className="text-sm sm:text-base lg:text-lg mb-2 text-gray-400">Plan valid until:</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-2 sm:mb-3">
                {new Date(premiumStatus.premiumExpiry).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <div className="inline-block bg-green-500/10 border border-green-500/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mt-2">
                <p className="text-sm sm:text-base text-green-400 font-semibold">
                  ⏰ {premiumStatus.daysRemaining} days remaining
                </p>
              </div>
            </div>
            
            {premiumStatus.planType !== 'Gold' && (
              <button
                onClick={() => {
                  setPremiumStatus(null);
                  setSelectedPlan('Gold');
                }}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl font-semibold text-sm sm:text-base lg:text-lg hover:shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 mt-4 sm:mt-6 transform hover:scale-105 active:scale-95"
              >
                ⭐ Upgrade to Gold (Unlimited)
              </button>
            )}
          </div>
          <button
            onClick={() => router.push('/downloads')}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-sm sm:text-base lg:text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            Go to Downloads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-12 lg:mb-16 pt-2 sm:pt-4 lg:pt-6">
        <div className="relative inline-block mb-4 sm:mb-6">
          <Crown className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 mx-auto text-yellow-500 animate-pulse" />
          <div className="absolute inset-0 blur-xl bg-yellow-500/20 rounded-full"></div>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-tight px-4">
          Upgrade to Premium
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
          Unlock unlimited downloads and exclusive features
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 xl:gap-6 mb-8 sm:mb-12 lg:mb-16">
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 text-center border border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
          <div className="bg-blue-500/10 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-blue-500" />
          </div>
          <h3 className="text-xs sm:text-sm lg:text-base xl:text-lg font-semibold mb-1 sm:mb-2">Extended Watch Time</h3>
          <p className="text-[10px] sm:text-xs lg:text-sm text-gray-400 leading-tight">
            Watch more videos every day
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 text-center border border-gray-800 hover:border-green-500/50 transition-all duration-300 hover:scale-105">
          <div className="bg-green-500/10 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
            <Download className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-green-500" />
          </div>
          <h3 className="text-xs sm:text-sm lg:text-base xl:text-lg font-semibold mb-1 sm:mb-2">More Downloads</h3>
          <p className="text-[10px] sm:text-xs lg:text-sm text-gray-400 leading-tight">
            Download videos for offline viewing
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 text-center border border-gray-800 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105">
          <div className="bg-yellow-500/10 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-yellow-500" />
          </div>
          <h3 className="text-xs sm:text-sm lg:text-base xl:text-lg font-semibold mb-1 sm:mb-2">Better Quality</h3>
          <p className="text-[10px] sm:text-xs lg:text-sm text-gray-400 leading-tight">
            Stream in HD, Full HD, or 4K
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 text-center border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
          <div className="bg-purple-500/10 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-purple-500" />
          </div>
          <h3 className="text-xs sm:text-sm lg:text-base xl:text-lg font-semibold mb-1 sm:mb-2">Ad-Free</h3>
          <p className="text-[10px] sm:text-xs lg:text-sm text-gray-400 leading-tight">
            Enjoy uninterrupted viewing
          </p>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 mb-6 sm:mb-8 lg:mb-12">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 cursor-pointer transition-all duration-300 ${
                    selectedPlan === plan.id
                      ? 'ring-2 ring-purple-500 shadow-2xl shadow-purple-500/20 scale-105'
                      : 'hover:scale-102 border border-gray-800'
                  } ${plan.popular ? 'border-2 border-yellow-500/30 shadow-lg shadow-yellow-500/10' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold shadow-lg shadow-yellow-500/50 animate-pulse">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r ${plan.color} text-white font-bold text-base sm:text-lg shadow-lg`}>
                      {plan.name}
                    </div>
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 ${
                      selectedPlan === plan.id
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 border-purple-400 shadow-lg shadow-purple-500/50'
                        : 'border-gray-600 bg-gray-800'
                    } flex items-center justify-center transition-all duration-300`}>
                      {selectedPlan === plan.id && (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{plan.price}</span>
                    <span className="text-gray-400 text-sm sm:text-base">{plan.period}</span>
                  </div>
                  
                  <ul className="space-y-2.5 sm:space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 sm:gap-3">
                        <div className="bg-green-500/10 rounded-full p-1 mt-0.5">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        </div>
                        <span className="text-gray-300 text-xs sm:text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Payment Button */}
      <div className="text-center px-2 sm:px-4">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full sm:w-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-3 sm:py-3.5 lg:py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-xl font-semibold text-sm sm:text-base lg:text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </span>
          ) : (
            `Upgrade to ${selectedPlan} Plan`
          )}
        </button>
        <p className="text-gray-500 text-[10px] sm:text-xs lg:text-sm mt-3 sm:mt-4">
          🔒 Secure payment powered by Razorpay • Test Mode Active
        </p>
        <p className="text-gray-400 text-[10px] sm:text-xs mt-2">
          📧 Email invoice will be sent after successful payment
        </p>
      </div>
    </div>
  );
};

export default PremiumPage;
