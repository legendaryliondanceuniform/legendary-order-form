const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      customerName, 
      igHandle, 
      phone, 
      address, 
      currency, 
      product, 
      size, 
      quantity 
    } = req.body;

    // 設定唔同貨幣嘅價錢 (注意：Stripe 金額是以最小單位計算，例如 cents)
    // 港幣 216 = 21600, 馬幣 120 = 12000 等等
    const prices = {
      'HKD': 21600,
      'MYR': 12000,
      'SGD': 3500,
      'CNY': 19800,
      'TWD': 88000, // 台幣沒有小數，所以 880 就寫 880 (但保險起見，Stripe 大部分貨幣預設 x100，除了少數如日元。TWD 是有最小單位的)
      'USD': 2800
    };

    // 修正 TWD (無小數位嘅貨幣)
    let unitAmount = prices[currency];
    if (currency === 'TWD') {
        unitAmount = 880; // TWD is zero-decimal currency in Stripe
    }

    // 準備 Stripe 的商品資料
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_ {
            currency: currency.toLowerCase(),
            product_ {
              name: `${product} (Size: ${size})`,
              description: `Customer: ${customerName} | IG: ${igHandle || 'N/A'} | Phone: ${phone}\nAddress: ${address.line1}, ${address.city}, ${address.country}`,
            },
            unit_amount: unitAmount,
          },
          quantity: parseInt(quantity),
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/`,
      // 要求 Stripe 收集送貨地址（以防萬一客戶在 Stripe 想改）
      shipping_address_collection: {
        allowed_countries: ['HK', 'MO', 'TW', 'MY', 'SG', 'CN', 'US', 'GB'],
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
