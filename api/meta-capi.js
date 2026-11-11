const crypto = require('crypto');

const PIXEL_ID = "1795208765028584";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN_GLOBAL || "EAAPgS52KafMBS6uxE0QjT0MzgFdQDe6v1QyEww4WwzlMq3tZBpqTth89tZB1uaKIU0yZCZAQRJDw8tZBg30Yq475F7ODuJaIEZArjVjj7wALhRZBFiEeEEPR5fqSswyE1KmvKIu4HPLPSdVZB1yiDAXKDgZBNZBlbY323l5DylQdcdQV7CbluVglFzZAGZAJI5i7lzs5BAZDZD";

function sha256(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    try {
      list[name] = decodeURIComponent(value);
    } catch(e) {
      list[name] = value;
    }
  });
  return list;
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
    const { 
      event_name = 'Lead', 
      event_id, 
      event_source_url,
      nome = '', 
      whatsapp = '', 
      fbp: bodyFbp, 
      fbc: bodyFbc,
      fbclid,
      custom_data = {} 
    } = body || {};

    const cookies = parseCookies(req.headers.cookie);

    // Identificadores de Rastreamento Avançado Meta (_fbp e _fbc)
    const fbp = bodyFbp || cookies['_fbp'] || undefined;
    
    let fbc = bodyFbc || cookies['_fbc'] || undefined;
    if (!fbc && fbclid) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
    }

    // Formatar Telefone para formato internacional (ex: 5538999999999)
    let cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    // Dividir Nome Completo em Primeiro Nome e Sobrenome para correspondência 10/10
    const nameParts = (nome || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Montar objeto de dados do usuário (EMQ 10/10)
    const userData = {
      client_ip_address: ip.split(',')[0].trim(),
      client_user_agent: userAgent,
      country: [sha256('br')],
      st: [sha256('mg')]
    };

    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;
    if (cleanPhone) {
      userData.ph = [sha256(cleanPhone)];
      userData.external_id = [sha256(cleanPhone)];
    }
    if (firstName) userData.fn = [sha256(firstName)];
    if (lastName) userData.ln = [sha256(lastName)];
    userData.ct = [sha256('montes claros')];

    // Montar Custom Data dinâmico conforme o evento
    let finalCustomData = { ...custom_data };
    if (event_name === 'Lead') {
      finalCustomData = {
        currency: "BRL",
        value: 1945.20,
        content_name: "Salario_Maternidade_Lead",
        ...finalCustomData
      };
    } else if (event_name === 'ViewContent') {
      finalCustomData = {
        content_name: "Landing_Page_MaternidadePrev",
        content_category: "Assessoria_Previdenciaria",
        ...finalCustomData
      };
    }

    // Montar payload da Conversions API (Meta CAPI)
    const payload = {
      data: [
        {
          event_name: event_name,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url: event_source_url || req.headers.referer || "https://maternidade-prev.vercel.app",
          event_id: event_id || (`capi_${event_name.toLowerCase()}_${Date.now()}`),
          user_data: userData,
          custom_data: Object.keys(finalCustomData).length > 0 ? finalCustomData : undefined
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
