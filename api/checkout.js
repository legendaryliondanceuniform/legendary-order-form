module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    try {
        const { items, currency, ig_handle, currentUrl } = req.body;
        const prices = { HKD: 216, CNY: 198, SGD: 35, MYR: 120 };
        const unitAmount = prices[currency] * 100;

        const params = new URLSearchParams();
        params.append('payment_method_types[0]', 'card');
        params.append('mode', 'payment');
        params.append('success_url', currentUrl + '/success.html');
        params.append('cancel_url', currentUrl + '/');

        const countries = ['HK', 'MO', 'TW', 'MY', 'SG', 'CN', 'US', 'GB', 'AU', 'CA'];
        countries.forEach((c, i) => params.append(`shipping_address_collection[allowed_countries][${i}]`, c));

        items.forEach((item, index) => {
            params.append(`line_items[${index}][price_data][currency]`, currency.toLowerCase());
            params.append(`line_items[${index}][price_data][product_data][name]`, `${item.style} (Size: ${item.size})`);
            if (ig_handle) params.append(`line_items[${index}][price_data][product_data][description]`, `IG: ${ig_handle}`);
            params.append(`line_items[${index}][price_data][unit_amount]`, unitAmount);
            params.append(`line_items[${index}][quantity]`, item.qty);
        });

        const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        const session = await response.json();
        if (!response.ok) return res.status(400).json({ error: session.error.message });
        return res.status(200).json({ url: session.url });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};