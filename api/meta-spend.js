/**
 * API Serverless para Extração Automática de Gastos Reais do Meta Ads
 * Endpoint: /api/meta-spend
 * Consulta a Graph API do Facebook (Marketing API - Insights)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://edutujipdgzrqvjloguk.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_grMQWI-9sz0sSkQfINM81Q_s-JCq_Zz";

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

    // 1. Obter credenciais (Query / Body / Environment Variables)
    let adAccountId = (body.ad_account_id || query.ad_account_id || process.env.META_AD_ACCOUNT_ID || '').trim();
    let accessToken = (body.access_token || query.access_token || process.env.META_ADS_READ_TOKEN || process.env.META_ACCESS_TOKEN_GLOBAL || '').trim();
    const datePreset = (body.date_preset || query.date_preset || 'maximum').trim();

    // 2. Se nenhuma credencial for enviada, busca o último registro auditado no Supabase
    if (!adAccountId || !accessToken) {
      const cached = await getSupabaseMetaAudit();
      if (cached) {
        return res.status(200).json({
          success: true,
          from_cache: true,
          configured: false,
          message: "Exibindo última auditoria sincronizada na nuvem. Para sincronização direta em tempo real, forneça o ID da Conta de Anúncios e o Access Token com permissão ads_read.",
          data: cached
        });
      }

      return res.status(200).json({
        success: false,
        configured: false,
        message: "Meta Ads API ainda não configurada. Insira o ID da Conta de Anúncios e o Token de Acesso da Meta com permissão ads_read."
      });
    }

    // 3. Normalizar formato da Conta de Anúncios (adicionar prefixo act_ se necessário)
    let cleanAccountId = adAccountId;
    if (!cleanAccountId.startsWith('act_')) {
      cleanAccountId = 'act_' + cleanAccountId;
    }

    // 4. Chamar Meta Graph API (Marketing Insights)
    const fbUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(cleanAccountId)}/insights?fields=spend,impressions,clicks,cpc,cpm,reach,date_start,date_stop&date_preset=${encodeURIComponent(datePreset)}&access_token=${encodeURIComponent(accessToken)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const fbResponse = await fetch(fbUrl, { signal: controller.signal });
    clearTimeout(timeout);

    const fbData = await fbResponse.json();

    if (fbData.error) {
      let friendlyMsg = fbData.error.message;
      if (fbData.error.code === 190) {
        friendlyMsg = "Token de acesso expirado ou inválido. Gere um novo token no Gerenciador de Negócios / Meta for Developers.";
      } else if (fbData.error.code === 100 || fbData.error.code === 200) {
        friendlyMsg = "Permissão insuficiente na conta Meta ou ID incorreto. Certifique-se de que a conta existe (formato act_XXXXXXXX) e o token possui a permissão ads_read.";
      }

      return res.status(400).json({
        success: false,
        configured: true,
        error: friendlyMsg,
        fb_error: fbData.error
      });
    }

    // 5. Agregar métricas retornadas
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
      ref: `Meta Ads API (${cleanAccountId})`,
      data: dateStop || nowIso.slice(0, 10),
      auto_sync: true,
      last_sync: nowIso,
      meta_details: {
        account_id: cleanAccountId,
        impressions: totalImpressions,
        clicks: totalClicks,
        reach: totalReach,
        cpc: cpc,
        date_start: dateStart,
        date_stop: dateStop,
        date_preset: datePreset
      }
    };

    // 6. Atualizar Supabase para sincronizar instantaneamente entre todos os sócios
    try {
      await saveSupabaseMetaAudit(auditPayload);
    } catch (saveErr) {
      console.warn("Falha ao salvar auditoria no Supabase:", saveErr.message);
    }

    return res.status(200).json({
      success: true,
      configured: true,
      spend: totalSpend,
      formatted_spend: "R$ " + totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      impressions: totalImpressions,
      clicks: totalClicks,
      reach: totalReach,
      cpc: cpc,
      date_start: dateStart,
      date_stop: dateStop,
      last_sync: nowIso,
      account_id: cleanAccountId
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Erro ao comunicar com a API do Meta Ads: " + err.message
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
