"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserSubscription } from '@/lib/supabasefunctions';
import { Coins, Crown, Plus } from 'lucide-react';

export default function CreditsDisplay({ className = '' }) {
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserAndCredits();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        fetchCredits(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCredits(0);
        setIsUnlimited(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserAndCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setUser(user);
      await fetchCredits(user.id);
    } catch (error) {
      console.error('Error fetching user:', error);
      setLoading(false);
    }
  };

  const fetchCredits = async (userId) => {
    try {
      const subscription = await getUserSubscription();
      
      if (subscription) {
        setCredits(subscription.credits_remaining || 0);
        setIsUnlimited(subscription.is_unlimited || false);
      } else {
        // No subscription found, set free tier defaults
        setCredits(10);
        setIsUnlimited(false);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(0);
      setIsUnlimited(false);
    } finally {
      setLoading(false);
    }
  };

  // Don't show credits if user is not logged in
  if (!user || loading) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isUnlimited ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-full text-sm font-semibold shadow-lg">
          <Crown className="w-4 h-4" />
          <span className="hidden sm:inline">Unlimited</span>
          <span className="sm:hidden">∞</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium">
            <Coins className="w-4 h-4 text-purple-600" />
            <span className={`${credits <= 5 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
              {credits}
            </span>
          </div>
          
          <button
            onClick={() => router.push('/premium')}
            className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-sm font-medium transition-colors"
            title="Buy more credits"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Buy</span>
          </button>
        </div>
      )}
    </div>
  );
}
