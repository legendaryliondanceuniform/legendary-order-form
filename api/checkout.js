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
      HKD: 21600,
      MYR: 12000,
      SGD: 3500,
      CNY: 19800,
      TWD: 880,
      USD: 2800
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `${product} (Size: ${size})`,
              description: `IG: ${igHandle || 'N/A'} | Phone: ${phone}`
            },
            unit_amount: prices[currency]
          },
          quantity: parseInt(quantity, 10)
        }
      ],
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
        size: size,
        phone: phone,
        product: product,
        currency: currency
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
