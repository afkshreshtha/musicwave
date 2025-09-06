export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Tier',
    credits: 10,
    price: 0,
    currency: 'INR',
    features: ['10 song downloads', '5 playlist downloads'],
    popular: false,
  },
  basic: {
    id: 'basic',
    name: '1 Credit',
    credits: 1,
    price: 1,
    currency: 'INR',
    features: ['1 song download', 'Instant credit top-up'],
    popular: false,
  },
  premium: {
    id: 'premium',
    name: '50 Credits Pack',
    credits: 50,
    price: 40,
    currency: 'INR',
    features: ['50 song downloads', 'Best value for money', '20% savings'],
    popular: true,
    savings: '20% savings'
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly Unlimited',
    credits: -1,
    price: 60,
    currency: 'INR',
    interval: 'month',
    features: ['Unlimited song downloads', 'Unlimited playlist downloads', 'Premium support'],
    popular: false,
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Unlimited',
    credits: -1,
    price: 600,
    currency: 'INR',
    interval: 'year',
    features: ['Unlimited song downloads', 'Unlimited playlist downloads', 'Premium support', '2 months free'],
    popular: false,
    savings: '2 months free'
  }
};

export const getCreditCost = (type) => {
  switch (type) {
    case 'song':
      return 1;
    case 'playlist':
      return 2;
    default:
      return 1;
  }
};
