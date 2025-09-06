import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId, credits } = await request.json();

    if (!userId || !credits) {
      return NextResponse.json(
        { error: 'Missing userId or credits' },
        { status: 400 }
      );
    }

    // Get current subscription
    const { data: currentSub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    const currentCredits = currentSub?.credits_remaining || 0;
    const newCredits = currentCredits + credits;

    // Update credits
    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_type: currentSub?.plan_type || 'basic',
        credits_remaining: newCredits,
        total_credits: (currentSub?.total_credits || 0) + credits,
        is_unlimited: false,
        status: 'active',
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      newCredits: newCredits,
      creditsAdded: credits
    });

  } catch (error) {
    console.error('Error incrementing credits:', error);
    return NextResponse.json(
      { error: 'Failed to increment credits' },
      { status: 500 }
    );
  }
}
