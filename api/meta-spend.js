/**
 * API Serverless para Extração Automática de Gastos Reais do Meta Ads
 * Endpoint: /api/meta-spend
 * Conta Oficial: [00][MaternidadePrev] (ID: 1055899400803247)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://edutujipdgzrqvjloguk.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_grMQWI-9sz0sSkQfINM81Q_s-JCq_Zz";

const DEFAULT_ACCOUNT_ID = "act_1055899400803247";
const DEFAULT_ACCOUNT_NAME = "[00][MaternidadePrev]";
const DEFAULT_ACCESS_TOKEN = process.env.META_ADS_READ_TOKEN || process.env.META_ACCESS_TOKEN_GLOBAL || "EAAPgS52KafMBS6uxE0QjT0MzgFdQDe6v1QyEww4WwzlMq3tZBpqTth89tZB1uaKIU0yZCZAQRJDw8tZBg30Yq475F7ODuJaIEZArjVjj7wALhRZBFiEeEEPR5fqSswyE1KmvKIu4HPLPSdVZB1yiDAXKDgZBNZBlbY323l5DylQdcdQV7CbluVglFzZAGZAJI5i7lzs5BAZDZD";

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = {};
    if (req.method === 'POST') {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    }
    const query = req.query || {};

    // 1. Obter Conta e Token (Default padrão: [00][MaternidadePrev] - 1055899400803247)
    let adAccountId = (body.ad_account_id || query.ad_account_id || process.env.META_AD_ACCOUNT_ID || DEFAULT_ACCOUNT_ID).trim();
    let accessToken = (body.access_token || query.access_token || DEFAULT_ACCESS_TOKEN).trim();
    const datePreset = (body.date_preset || query.date_preset || 'maximum').trim();

    // Normalizar formato da Conta de Anúncios
    let cleanAccountId = adAccountId;
    if (!cleanAccountId.startsWith('act_')) {
      cleanAccountId = 'act_' + cleanAccountId;
    }

    // 2. Chamar Meta Graph API (Marketing Insights)
    const fbUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(cleanAccountId)}/insights?fields=spend,impressions,clicks,cpc,cpm,reach,date_start,date_stop&date_preset=${encodeURIComponent(datePreset)}&access_token=${encodeURIComponent(accessToken)}`;

    let fbData = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);

      const fbResponse = await fetch(fbUrl, { signal: controller.signal });
      clearTimeout(timeout);
      fbData = await fbResponse.json();
    } catch (fetchErr) {
      console.warn("Falha de rede na chamada Meta:", fetchErr.message);
    }

    // 3. Se a Meta retornou erro de permissão (ex: token atual sem ads_read), fallback para dados auditados do Supabase
    if (!fbData || fbData.error) {
      const cached = await getSupabaseMetaAudit();
      const fallbackSpend = (cached && typeof cached.valor === 'number') ? cached.valor : 0;
      
      return res.status(200).json({
        success: true,
        from_cache: true,
        account_id: cleanAccountId,
        account_name: DEFAULT_ACCOUNT_NAME,
        spend: fallbackSpend,
        formatted_spend: "R$ " + fallbackSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        date_preset: datePreset,
        data: cached || { valor: fallbackSpend, ref: `${DEFAULT_ACCOUNT_NAME} (${cleanAccountId})` },
        notice: fbData?.error?.message || "Auditoria sincronizada da nuvem."
      });
    }

    // 4. Agregar métricas retornadas pela API da Meta
    const insights = Array.isArray(fbData.data) ? fbData.data : [];
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalReach = 0;
    let dateStart = '';
    let dateStop = '';

    insights.forEach(item => {
      totalSpend += parseFloat(item.spend || 0);
      totalImpressions += parseInt(item.impressions || 0, 10);
      totalClicks += parseInt(item.clicks || 0, 10);
      totalReach = Math.max(totalReach, parseInt(item.reach || 0, 10));
      if (!dateStart && item.date_start) dateStart = item.date_start;
      if (item.date_stop) dateStop = item.date_stop;
    });

    const cpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;
    const nowIso = new Date().toISOString();

    const auditPayload = {
      valor: totalSpend,
      ref: `${DEFAULT_ACCOUNT_NAME} (${cleanAccountId})`,
      data: dateStop || nowIso.slice(0, 10),
      auto_sync: true,
      last_sync: nowIso,
      meta_details: {
        account_id: cleanAccountId,
        account_name: DEFAULT_ACCOUNT_NAME,
        impressions: totalImpressions,
        clicks: totalClicks,
        reach: totalReach,
        cpc: cpc,
        date_start: dateStart,
        date_stop: dateStop,
        date_preset: datePreset
      }
    };

    // 5. Salvar no Supabase
    try {
      await saveSupabaseMetaAudit(auditPayload);
    } catch (saveErr) {}

    return res.status(200).json({
      success: true,
      account_id: cleanAccountId,
      account_name: DEFAULT_ACCOUNT_NAME,
      spend: totalSpend,
      formatted_spend: "R$ " + totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      impressions: totalImpressions,
      clicks: totalClicks,
      reach: totalReach,
      cpc: cpc,
      date_start: dateStart,
      date_stop: dateStop,
      date_preset: datePreset,
      last_sync: nowIso
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Erro no processamento da auditoria: " + err.message
    });
  }
};

async function getSupabaseMetaAudit() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.system_meta_audit`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      }
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0 && rows[0].dados) {
        return rows[0].dados;
      }
    }
  } catch (e) {}
  return null;
}

async function saveSupabaseMetaAudit(auditPayload) {
  const body = {
    dados: auditPayload
  };

  await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.system_meta_audit`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}
