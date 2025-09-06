import { SUBSCRIPTION_PLANS } from "@/lib/subscriptionPlans";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      planType
    } = await request.json();

    // Verify signature (your existing verification code)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body, 'utf-8')
      .digest("hex");

    if (expectedSignature.toLowerCase() !== razorpay_signature.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Check if it's a credit purchase
    const isCreditspurchase = planType.startsWith('credits_');
    const actualPlanType = isCreditspurchase ? planType.replace('credits_', '') : planType;
    const plan = SUBSCRIPTION_PLANS[actualPlanType];

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get current subscription
    const { data: currentSubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    let subscriptionData;

    if (isCreditsurchase) {
      // For credit purchases, ADD credits without changing plan type
      const currentCredits = currentSubscription?.credits_remaining || 0;
      const creditsToAdd = plan.credits;
      const newTotalCredits = currentCredits + creditsToAdd;

      console.log(`💰 Adding ${creditsToAdd} credits. Current: ${currentCredits}, New total: ${newTotalCredits}`);

      subscriptionData = {
        user_id: userId,
        plan_type: currentSubscription?.plan_type || 'free', // Keep existing plan type
        credits_remaining: newTotalCredits,
        total_credits: (currentSubscription?.total_credits || 0) + creditsToAdd,
        is_unlimited: currentSubscription?.is_unlimited || false, // Keep existing unlimited status
        status: 'active',
        updated_at: new Date().toISOString()
      };

      // Preserve all existing subscription data
      if (currentSubscription) {
        subscriptionData.current_period_start = currentSubscription.current_period_start;
        subscriptionData.current_period_end = currentSubscription.current_period_end;
        subscriptionData.razorpay_subscription_id = currentSubscription.razorpay_subscription_id;
      }

    } else if (planType === 'monthly' || planType === 'yearly') {
      // For subscription plans, create unlimited access
      const now = new Date();
      const endDate = new Date(now);
      
      if (planType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (planType === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      subscriptionData = {
        user_id: userId,
        plan_type: planType,
        credits_remaining: 0,
        total_credits: 0,
        is_unlimited: true,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
        razorpay_subscription_id: razorpay_payment_id,
        updated_at: new Date().toISOString()
      };
    }

    // Update subscription
    const { error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(subscriptionData);

    if (subError) throw subError;

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
        status: 'completed'
      });

    if (paymentError) console.error('Error recording payment:', paymentError);

    return NextResponse.json({
      success: true,
      message: isCreditsurchase ? 
        `${plan.credits} credits added successfully` : 
        'Subscription created successfully',
      creditsAdded: isCreditsurchase ? plan.credits : 0
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
