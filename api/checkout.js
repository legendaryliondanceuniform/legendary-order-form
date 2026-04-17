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

    const prices = {
      'HKD': 21600,
      'MYR': 12000,
      'SGD': 3500,
      'CNY': 19800,
      'TWD': 880, // TWD 無小數
      'USD': 2800
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_ {
            currency: currency.toLowerCase(),
            product_ {
              name: `${product} (Size: ${size})`,
              description: `IG: ${igHandle || 'N/A'} | Phone: ${phone}`,
            },
            unit_amount: prices[currency],
          },
          quantity: parseInt(quantity),
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/`,
      
      // 【重點功能】將你表單嘅地址，直接完美寫入 Stripe 後台嘅 Shipping 紀錄
      payment_intent_ {
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
      // 順手將額外資料放入 metadata，方便你後台搜尋
      meta {
        'Customer Name': customerName,
        'IG Handle': igHandle || 'N/A',
        'Size': size,
        'Phone': phone
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
