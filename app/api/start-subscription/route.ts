import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptionPlans';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { userId, planType } = await request.json();

    if (!userId || !planType) {
      return NextResponse.json(
        { error: 'Missing userId or planType' },
        { status: 400 }
      );
    }

    // Check if it's a credit purchase
    const isCreditsurchase = planType.startsWith('credits_');
    const actualPlanType = isCreditsurchase ? planType.replace('credits_', '') : planType;
    const plan = SUBSCRIPTION_PLANS[actualPlanType];

    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const timestamp = Date.now().toString();
    const receiptId = `${isCreditsurchase ? 'credits' : 'sub'}_${timestamp}_${actualPlanType}`.substring(0, 40);

    const options = {
      amount: Math.round(plan.price * 100), // Convert to paise
      currency: 'INR',
      receipt: receiptId,
      notes: {
        planType: planType, // Keep original planType with credits_ prefix if applicable
        userId,
        type: isCreditsurchase ? 'credits' : 'subscription'
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planType: planType,
      planName: plan.name,
      isCreditsurchase: isCreditsurchase
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
