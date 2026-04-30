const TIERS = {
  free: {
    name: 'Free',
    requestLimit: 1000,
    rateLimit: 10, // per second
    features: ['Basic API access', '1,000 requests/month', 'Standard support'],
    maxKeys: 2,
  },
  pro: {
    name: 'Pro',
    requestLimit: 50000,
    rateLimit: 60,
    features: ['Full API access', '50,000 requests/month', 'Priority support', 'IP Whitelist'],
    maxKeys: 10,
  },
  premium: {
    name: 'Premium',
    requestLimit: 500000,
    rateLimit: 300,
    features: ['Unlimited API access', '500,000 requests/month', 'Dedicated support', 'IP Whitelist', 'Custom expiry'],
    maxKeys: 50,
  },
};

module.exports = TIERS;
