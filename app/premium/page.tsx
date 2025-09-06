"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserSubscription, checkAndUpdateExpiredSubscriptions } from '@/lib/supabasefunctions';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptionPlans';
import {
  Crown, 
  Zap, 
  Download, 
  Check, 
  Star,
  CreditCard,
  Smartphone,
  Lock
} from 'lucide-react';
import Script from 'next/script';

export default function SubscriptionPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      setUser(user);
      await checkAndUpdateExpiredSubscriptions();
      const subscription = await getUserSubscription();
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

// Update handleCreditPurchase function
const handleCreditPurchase = async (planType) => {
  setProcessing(planType);
  const plan = SUBSCRIPTION_PLANS[planType];

  try {
    // Use start-subscription API with credits_ prefix
    const orderResponse = await fetch('/api/start-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        planType: `credits_${planType}` // Add credits_ prefix
      })
    });

    const orderData = await orderResponse.json();
    if (!orderResponse.ok) throw new Error(orderData.error);

    // Initialize Razorpay payment
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'MusicApp',
      description: `${plan.credits} Credits - ${plan.name}`,
      order_id: orderData.orderId,
      handler: async function (response) {
        try {
          // Use complete-subscription API
          const completeResponse = await fetch('/api/complete-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: orderData.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.id,
              planType: `credits_${planType}` // Keep credits_ prefix
            })
          });

          const completeData = await completeResponse.json();
          if (completeData.success) {
            alert(`Success! ${plan.credits} credits added to your account.`);
           await fetchUserData();
          } else {
            throw new Error(completeData.error);
          }
        } catch (error) {
          alert('Credit purchase verification failed. Please contact support.');
        }
      },
      prefill: {
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        email: user.email
      },
      theme: { color: '#8B5CF6' },
      modal: {
        ondismiss: function() {
          setProcessing(null);
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();

  } catch (error) {
    alert('Failed to start credit purchase. Please try again.');
    setProcessing(null);
  }
};


  // Handle subscription purchase (monthly/yearly plans)
  const handleSubscriptionPurchase = async (planType) => {
    setProcessing(planType);
    const plan = SUBSCRIPTION_PLANS[planType];

    try {
      // Create subscription order
      const orderResponse = await fetch('/api/start-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planType
        })
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.error);

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MusicApp',
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const completeResponse = await fetch('/api/complete-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: orderData.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.id,
                planType
              })
            });

            const completeData = await completeResponse.json();
            if (completeData.success) {
              alert(`Welcome to ${plan.name}! You now have unlimited downloads.`);
            await  fetchUserData();
            } else {
              throw new Error(completeData.error);
            }
          } catch (error) {
            alert('Subscription activation failed. Please contact support.');
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || user.email.split('@')[0],
          email: user.email
        },
        theme: { color: '#8B5CF6' },
        modal: {
          ondismiss: function() {
            setProcessing(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      alert('Failed to start subscription. Please try again.');
      setProcessing(null);
    }
  };

const getButtonState = (plan) => {
  // Free plan - never show button
  if (plan.id === 'free') {
    return 'hidden';
  }

  // For unlimited subscription plans
  if (['monthly', 'yearly'].includes(plan.id)) {
    // Current active plan
    if (currentSubscription && 
        currentSubscription.plan_type === plan.id && 
        currentSubscription.status === 'active') {
      return 'current';
    }
    
    // If user has active monthly/yearly, disable other monthly/yearly plans
    if (currentSubscription && 
        ['monthly', 'yearly'].includes(currentSubscription.plan_type) && 
        currentSubscription.status === 'active') {
      return 'blocked';
    }
  }

  // For credit plans (basic/premium) - ALWAYS AVAILABLE
  if (['basic', 'premium'].includes(plan.id)) {
    return 'available';
  }

  return 'available';
};

  const renderButton = (plan) => {
    const buttonState = getButtonState(plan);

    if (buttonState === 'hidden') {
      return null;
    }

    if (buttonState === 'current') {
      return (
        <button
          disabled
          className="w-full py-3 px-4 rounded-xl bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-semibold cursor-not-allowed border-2 border-green-200 dark:border-green-700"
        >
          ✓ Current Plan
        </button>
      );
    }

    if (buttonState === 'blocked') {
      return (
        <button
          disabled
          className="w-full py-3 px-4 rounded-xl bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-semibold cursor-not-allowed border-2 border-gray-300 dark:border-gray-600"
        >
          <Lock className="w-4 h-4 inline mr-1" />
          Blocked
        </button>
      );
    }

    // Available button
    return (
      <button
        onClick={() => {
          if (['basic', 'premium'].includes(plan.id)) {
            handleCreditPurchase(plan.id);
          } else if (['monthly', 'yearly'].includes(plan.id)) {
            handleSubscriptionPurchase(plan.id);
          }
        }}
        disabled={processing === plan.id}
        className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
          plan.popular
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
        }`}
      >
        {processing === plan.id ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Processing...
          </div>
        ) : (
          <>
            {['basic', 'premium'].includes(plan.id) ? 'Add Credits' : 'Subscribe Now'}
          </>
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 pb-32">
        <div className="max-w-7xl mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Music Plan
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
              Download your favorite songs and playlists
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Smartphone className="w-4 h-4" />
              <span>UPI & Cards accepted via Razorpay</span>
            </div>
          </div>

          {/* Current Subscription Display */}
          {currentSubscription && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  {currentSubscription.is_unlimited ? (
                    <Crown className="w-8 h-8 text-white" />
                  ) : (
                    <CreditCard className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {SUBSCRIPTION_PLANS[currentSubscription.plan_type]?.name || 'Current Plan'}
                  </h3>
                  {currentSubscription.is_unlimited ? (
                    <p className="text-green-600 dark:text-green-400 font-semibold">
                      ✨ Unlimited downloads
                    </p>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">{currentSubscription.credits_remaining}</span> credits remaining
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80'
                } backdrop-blur-sm`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  {/* Plan Icon */}
                  <div className="mb-4">
                    {plan.id === 'free' && <Download className="w-12 h-12 text-gray-600 mx-auto" />}
                    {plan.id === 'basic' && <CreditCard className="w-12 h-12 text-blue-600 mx-auto" />}
                    {plan.id === 'premium' && <Zap className="w-12 h-12 text-purple-600 mx-auto" />}
                    {(plan.id === 'monthly' || plan.id === 'yearly') && <Crown className="w-12 h-12 text-yellow-600 mx-auto" />}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">Free</span>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          ₹{plan.price}
                        </span>
                        {plan.interval && (
                          <span className="text-gray-500 dark:text-gray-400 ml-1">
                            /{plan.interval}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Smart Button */}
                  {renderButton(plan)}
                </div>
              </div>
            ))}
          </div>

          {/* Credits Usage Info */}
          <div className="mt-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              How Credits Work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <Download className="w-5 h-5 text-blue-500 mr-2" />
                <span>1 credit = 1 song download</span>
              </div>
              <div className="flex items-center">
                <Download className="w-5 h-5 text-purple-500 mr-2" />
                <span>2 credits = 1 playlist download</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
