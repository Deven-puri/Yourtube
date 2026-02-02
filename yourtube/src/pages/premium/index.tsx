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
  const [selectedPlan, setSelectedPlan] = useState('monthly');
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
      id: 'monthly',
      name: 'Monthly',
      price: '₹99',
      period: '/month',
      features: [
        'Unlimited video downloads',
        'HD quality downloads',
        'No ads',
        'Priority support',
        'Download history tracking'
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '₹999',
      period: '/year',
      savings: 'Save ₹189',
      features: [
        'All monthly features',
        'Unlimited video downloads',
        'HD quality downloads',
        'No ads',
        'Priority support',
        'Download history tracking',
        '2 months free'
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
              <h1 className="text-4xl font-bold mb-4">You're a Premium Member!</h1>
              <p className="text-xl text-gray-400 mb-8">
                Enjoy unlimited downloads and all premium features
              </p>
              <div className="bg-gray-900 rounded-lg p-6 mb-8">
                <p className="text-lg mb-2">Premium valid until:</p>
                <p className="text-2xl font-semibold text-yellow-500">
                  {new Date(premiumStatus.premiumExpiry).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-gray-400 mt-2">
                  {premiumStatus.daysRemaining} days remaining
                </p>
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
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <div className="bg-gray-900 rounded-lg p-6 text-center">
                <Download className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-semibold mb-2">Unlimited Downloads</h3>
                <p className="text-gray-400">
                  Download as many videos as you want, anytime
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-lg font-semibold mb-2">HD Quality</h3>
                <p className="text-gray-400">
                  Download videos in the highest quality available
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">Priority Support</h3>
                <p className="text-gray-400">
                  Get fast and priority customer support
                </p>
              </div>
            </div>

            {/* Pricing Plans */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-gray-900 rounded-lg p-8 cursor-pointer transition ${
                    selectedPlan === plan.id
                      ? 'ring-2 ring-purple-500'
                      : 'hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.savings && (
                    <div className="absolute top-4 right-4 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                      {plan.savings}
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
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
                        <span className="text-gray-300">{feature}</span>
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
                {loading ? 'Processing...' : `Subscribe to ${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Plan`}
              </button>
              <p className="text-gray-500 text-sm mt-4">
                Secure payment powered by Razorpay • Test Mode Active
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
