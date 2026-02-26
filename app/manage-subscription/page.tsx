"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getUserSubscription } from '@/lib/supabasefunctions';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptionPlans';
import {
  ArrowLeft,
  Crown,
  CreditCard,
  Calendar,
  RefreshCw,
  XCircle,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function ManageSubscription() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const supabase = createClient();



  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      setUser(user);
      const userSubscription = await getUserSubscription();
      console.log(userSubscription)
      setSubscription(userSubscription);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRenewSubscription = async () => {
    if (!subscription) return;
    setProcessing(true);
    
    try {
      // Redirect to subscription page for renewal
      router.push('/premium');
    } catch (error) {
      console.error('Error during renewal:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmCancel = confirm(
      'Are you sure you want to cancel your subscription? You will lose access to unlimited downloads at the end of your current billing period.'
    );
    
    if (!confirmCancel) return;

    setProcessing(true);
    
    try {
      // Update subscription status to cancelled
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      alert('Your subscription has been cancelled. You will retain access until the end of your current billing period.');
      fetchData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center">
        <div className="max-w-md text-center p-8">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Active Subscription</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don&apos;t have any active subscription to manage.
          </p>
          <button
            onClick={() => router.push('/premium')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const plan = SUBSCRIPTION_PLANS[subscription.plan_type];
  const daysRemaining = getDaysRemaining(subscription.current_period_end);
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 pb-32">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Subscription</h1>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-slate-700/60 p-8 shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                {subscription.is_unlimited ? (
                  <Crown className="w-10 h-10 text-white" />
                ) : (
                  <CreditCard className="w-10 h-10 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan?.name || 'Unknown Plan'}
                </h2>
                <div className="space-y-1">
                  {subscription.is_unlimited ? (
                    <p className="text-lg text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      Unlimited Downloads
                    </p>
                  ) : (
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-purple-600">{subscription.credits_remaining}</span> credits remaining
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                subscription.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : subscription.status === 'cancelled'
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {subscription.status === 'active' && <CheckCircle className="w-4 h-4 mr-1" />}
                {subscription.status === 'cancelled' && <Clock className="w-4 h-4 mr-1" />}
                {subscription.status === 'active' ? 'Active' : subscription.status}
              </span>
            </div>
          </div>
        </div>

        {/* Expiry Warning */}
        {isExpiringSoon && subscription.status === 'active' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div>
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                  Subscription Expiring Soon
                </h3>
                <p className="text-orange-700 dark:text-orange-300">
                  Your subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. 
                  Renew now to continue enjoying unlimited downloads.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Plan Details */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-slate-700/60 p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Plan Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Plan Type</span>
                <span className="font-semibold text-gray-900 dark:text-white">{plan?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Price</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {plan?.price ? `₹${plan.price}${plan.interval ? `/${plan.interval}` : ''}` : 'Free'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className={`font-semibold ${
                  subscription.status === 'active' ? 'text-green-600' : 
                  subscription.status === 'cancelled' ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {subscription.status}
                </span>
              </div>
              {subscription.is_unlimited ? (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Downloads</span>
                  <span className="font-semibold text-green-600">Unlimited</span>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Credits Remaining</span>
                  <span className="font-semibold text-purple-600">{subscription.credits_remaining}</span>
                </div>
              )}
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-slate-700/60 p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Billing Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Started On</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(subscription.current_period_start)}
                </span>
              </div>
              {subscription.current_period_end && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    {subscription.status === 'cancelled' ? 'Expires On' : 'Renews On'}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
              )}
              {daysRemaining !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Days Remaining</span>
                  <span className={`font-semibold ${
                    daysRemaining > 7 ? 'text-green-600' : daysRemaining > 3 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
                <span className="font-semibold text-gray-900 dark:text-white">Razorpay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Upgrade Plan */}
          <button
            onClick={() => router.push('/premium')}
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-300 hover:scale-105"
          >
            <TrendingUp className="w-8 h-8" />
            <div className="text-center">
              <h3 className="font-semibold">Upgrade Plan</h3>
              <p className="text-sm opacity-90">Get more features</p>
            </div>
          </button>

          {/* Renew Subscription */}
          {subscription.is_unlimited && (
            <button
              onClick={handleRenewSubscription}
              disabled={processing}
              className="flex flex-col items-center gap-3 p-6 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              <RefreshCw className="w-8 h-8" />
              <div className="text-center">
                <h3 className="font-semibold">Renew Subscription</h3>
                <p className="text-sm opacity-90">Extend your plan</p>
              </div>
            </button>
          )}

          {/* Cancel Subscription */}
          {subscription.status === 'active' && subscription.is_unlimited && (
            <button
              onClick={handleCancelSubscription}
              disabled={processing}
              className="flex flex-col items-center gap-3 p-6 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              <XCircle className="w-8 h-8" />
              <div className="text-center">
                <h3 className="font-semibold">Cancel Subscription</h3>
                <p className="text-sm opacity-90">End recurring billing</p>
              </div>
            </button>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Need Help?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            If you have any questions about your subscription or need assistance, feel free to contact our support team.
          </p>
          <button className="text-purple-600 hover:text-purple-700 font-semibold">
            Contact Support →
          </button>
        </div>
      </div>
    </div>
  );
}
