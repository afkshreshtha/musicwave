import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptionPlans';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      planType
    } = await request.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body, 'utf-8')
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Check if it's a credit purchase
    const isCreditsurchase = planType.startsWith('credits_');
    const actualPlanType = isCreditsurchase ? planType.replace('credits_', '') : planType;
    const plan = SUBSCRIPTION_PLANS[actualPlanType];

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (isCreditsurchase) {
      // Handle credit purchase (existing code)
      const { data: currentSubscription } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      const currentCredits = currentSubscription?.credits_remaining || 10;
      const creditsToAdd = plan.credits;
      const newTotalCredits = currentCredits + creditsToAdd;

      if (currentSubscription) {
        const { error: updateError } = await supabaseAdmin
          .from('user_subscriptions')
          .update({
            credits_remaining: newTotalCredits,
            total_credits: (currentSubscription.total_credits || currentCredits) + creditsToAdd,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;
      } else {
        const { error: createError } = await supabaseAdmin
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_type: 'free',
            credits_remaining: 10 + creditsToAdd,
            total_credits: 10 + creditsToAdd,
            is_unlimited: false,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) throw createError;
      }

    } else {
      // ✅ FOR SUBSCRIPTION PURCHASES - DELETE FREE PLAN AND CREATE NEW SUBSCRIPTION
      
      console.log(`🗑️ Deleting existing plans for user: ${userId}`);
      
      // Step 1: Delete ALL existing subscriptions (including free plan)
      const { error: deleteError } = await supabaseAdmin
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing subscriptions:', deleteError);
        // Don't throw error here - continue with creating new subscription
      } else {
        console.log('✅ Successfully deleted existing subscriptions');
      }

      // Step 2: Create new subscription plan
      const now = new Date();
      const endDate = new Date(now);
      
      if (planType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (planType === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscriptionData = {
        user_id: userId,
        plan_type: planType,
        credits_remaining: 0,
        total_credits: 0,
        is_unlimited: true,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
        razorpay_subscription_id: razorpay_payment_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 Creating new subscription:', subscriptionData);

      const { error: subError } = await supabaseAdmin
        .from('user_subscriptions')
        .insert(subscriptionData);

      if (subError) {
        console.error('Error creating subscription:', subError);
        throw subError;
      }

      console.log('✅ Successfully created new subscription');
    }

    // Record payment
    const { error: paymentError } = await supabaseAdmin
      .from('payment_history')
      .insert({
        user_id: userId,
        amount: plan.price,
        currency: 'INR',
        payment_method: 'razorpay',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        plan_type: actualPlanType,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
    }

    return NextResponse.json({
      success: true,
      message: isCreditsurchase ? 
        `${plan.credits} credits added to your existing plan` : 
        `Welcome to ${plan.name}! Your free plan has been replaced.`,
      creditsAdded: isCreditsurchase ? plan.credits : 0,
      planType: actualPlanType
    });

  } catch (error) {
    console.error('Error completing purchase:', error);
    return NextResponse.json(
      { error: 'Purchase completion failed: ' + error.message },
      { status: 500 }
    );
  }
}
