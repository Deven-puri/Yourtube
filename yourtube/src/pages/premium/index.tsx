import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import axios from '../lib/axiosinstance';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { Crown, Check, Download, Zap, Shield } from 'lucide-react';

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
      console.error('Error checking premium status:', error);
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

      const { orderId, amount, currency, keyId } = orderResponse.data;

      // Configure Razorpay options
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
            console.error('Error verifying payment:', error);
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
      console.error('Error creating order:', error);
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
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-6 ml-64">
            <div className="max-w-4xl mx-auto text-center py-16">
              <Crown className="w-24 h-24 mx-auto mb-6 text-yellow-500" />
              <h1 className="text-4xl font-bold mb-4">You're on {premiumStatus.planType} Plan!</h1>
              <p className="text-xl text-gray-400 mb-8">
                {premiumStatus.planType === 'Gold' 
                  ? 'Enjoy unlimited watch time and downloads!' 
                  : 'Enjoying premium features'}
              </p>
              <div className="bg-gray-900 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg mb-2">Current Plan:</p>
                    <p className="text-3xl font-semibold text-yellow-500">
                      {premiumStatus.planType}
                    </p>
                  </div>
                  <Crown className="w-16 h-16 text-yellow-500" />
                </div>
                
                <p className="text-lg mb-2">Plan valid until:</p>
                <p className="text-xl font-semibold text-yellow-500 mb-2">
                  {new Date(premiumStatus.premiumExpiry).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-gray-400 mb-4">
                  {premiumStatus.daysRemaining} days remaining
                </p>
                
                {premiumStatus.planType !== 'Gold' && (
                  <button
                    onClick={() => {
                      setPremiumStatus(null);
                      setSelectedPlan('Gold');
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-lg font-semibold hover:opacity-90 transition mt-4"
                  >
                    ⭐ Upgrade to Gold (Unlimited)
                  </button>
                )}
              </div>
              <button
                onClick={() => router.push('/downloads')}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Go to Downloads
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6 ml-64">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16 pt-8">
              <Crown className="w-20 h-20 mx-auto mb-6 text-yellow-500" />
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Upgrade to Premium
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                Unlock unlimited downloads and exclusive features
              </p>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-4 gap-6 mb-16">
              <div className="bg-gray-900 rounded-lg p-6 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-semibold mb-2">Extended Watch Time</h3>
                <p className="text-gray-400 text-sm">
                  Watch more videos every day
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 text-center">
                <Download className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">More Downloads</h3>
                <p className="text-gray-400 text-sm">
                  Download videos for offline viewing
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-lg font-semibold mb-2">Better Quality</h3>
                <p className="text-gray-400 text-sm">
                  Stream in HD, Full HD, or 4K
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-lg font-semibold mb-2">Ad-Free</h3>
                <p className="text-gray-400 text-sm">
                  Enjoy uninterrupted viewing
                </p>
              </div>
            </div>

            {/* Pricing Plans */}
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-gray-900 rounded-lg p-8 cursor-pointer transition transform hover:scale-105 ${
                    selectedPlan === plan.id
                      ? 'ring-2 ring-purple-500 shadow-xl'
                      : 'hover:bg-gray-800'
                  } ${plan.popular ? 'border-2 border-yellow-500' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black text-xs px-4 py-1 rounded-full font-bold">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${plan.color} text-white font-bold text-lg`}>
                      {plan.name}
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 ${
                      selectedPlan === plan.id
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-gray-600'
                    } flex items-center justify-center`}>
                      {selectedPlan === plan.id && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Payment Button */}
            <div className="text-center">
              <button
                onClick={handlePayment}
                disabled={loading}
                className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Upgrade to ${selectedPlan} Plan`}
              </button>
              <p className="text-gray-500 text-sm mt-4">
                Secure payment powered by Razorpay • Test Mode Active
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Email invoice will be sent after successful payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
