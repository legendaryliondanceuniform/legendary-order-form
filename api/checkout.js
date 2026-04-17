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

    const prices = {
      HKD: 21600,
      MYR: 12000,
      SGD: 3500,
      CNY: 19800,
      TWD: 880,
      USD: 2800
    };

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
