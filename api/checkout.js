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
      items
    } = req.body;

    // 設定截止日期 (2026年5月5日 23:59:59 HKT)
    const deadline = new Date('2026-05-05T23:59:59+08:00');
    const now = new Date();
    const isPreorder = now <= deadline;

    // 正價
    const regularPrices = {
      HKD: 27000,
      MYR: 15000,
      SGD: 4400,
      CNY: 24800,
      TWD: 1100,
      USD: 3500
    };

    // 預購價 (20% OFF)
    const preorderPrices = {
      HKD: 21600,
      MYR: 12000,
      SGD: 3500,
      CNY: 19800,
      TWD: 880,
      USD: 2800
    };

    // 系統自動判斷用邊個價錢表
    const prices = isPreorder ? preorderPrices : regularPrices;
    const unitAmount = prices[currency];

    const line_items = items.map(item => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: `${item.product} (Size: ${item.size})`,
          description: `IG: ${igHandle || 'N/A'} | Phone: ${phone}`
        },
        unit_amount: unitAmount
      },
      quantity: parseInt(item.quantity, 10)
    }));

    const orderSummary = items.map(i => `${i.product}[${i.size}]x${i.quantity}`).join(', ');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/`,
      payment_intent_data: {
        shipping: {
          name: customerName,
          phone: phone,
          address: {
            line1: address.line1,
            line2: address.line2 || null,
            city: address.city,
            country: address.country
          }
        }
      },
      metadata: {
        customerName: customerName,
        igHandle: igHandle || 'N/A',
        phone: phone,
        currency: currency,
        order_details: orderSummary.substring(0, 499)
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
