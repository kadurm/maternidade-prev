const crypto = require('crypto');

const PIXEL_ID = "1795208765028584";
const ACCESS_TOKEN = "EAAPgS52KafMBS6uxE0QjT0MzgFdQDe6v1QyEww4WwzlMq3tZBpqTth89tZB1uaKIU0yZCZAQRJDw8tZBg30Yq475F7ODuJaIEZArjVjj7wALhRZBFiEeEEPR5fqSswyE1KmvKIu4HPLPSdVZB1yiDAXKDgZBNZBlbY323l5DylQdcdQV7CbluVglFzZAGZAJI5i7lzs5BAZDZD";

function sha256(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { event_name = 'Lead', event_id, nome = '', whatsapp = '', custom_data = {} } = body || {};

    // Formatar Telefone para formato internacional (ex: 5511999999999)
    let cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    const firstName = nome.split(' ')[0] || '';
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Montar payload da Conversions API (Meta CAPI)
    const payload = {
      data: [
        {
          event_name: event_name,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url: req.headers.referer || "https://maternidade-prev.vercel.app",
          event_id: event_id || ("capi_" + Date.now()),
          user_data: {
            ph: cleanPhone ? [sha256(cleanPhone)] : [],
            fn: firstName ? [sha256(firstName)] : [],
            client_ip_address: ip.split(',')[0].trim(),
            client_user_agent: userAgent
          },
          custom_data: {
            currency: "BRL",
            value: 1945.20,
            content_name: "Salario_Maternidade_Lead",
            ...custom_data
          }
        }
      ]
    };

    const fbUrl = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    const fbResponse = await fetch(fbUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const fbData = await fbResponse.json();

    return res.status(200).json({
      success: true,
      events_received: fbData.events_received || 0,
      fbData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
