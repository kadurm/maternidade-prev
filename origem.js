/**
 * MaternidadePrev - Captura de origem do lead (UTM / fbclid / referrer)
 *
 * Roda na carga da página e guarda a origem em localStorage (validade 30 dias),
 * para que o lead mantenha a origem mesmo se navegar entre páginas antes de enviar o formulário.
 * Uma visita "direta" nunca sobrescreve uma origem já conhecida (last non-direct touch).
 */
(function () {
  var KEY = 'materna_origem';
  var TTL_MS = 30 * 24 * 60 * 60 * 1000;

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; }
  }

  function classificar(o) {
    var src = (o.utm_source || '').toLowerCase();
    if (src) {
      if (/^(meta|facebook|fb|instagram|ig)$/.test(src)) {
        var partes = ['Meta Ads'];
        if (o.utm_campaign) partes.push(o.utm_campaign);
        if (o.utm_content) partes.push(o.utm_content);
        return partes.join(' · ');
      }
      return o.utm_campaign ? (o.utm_source + ' · ' + o.utm_campaign) : o.utm_source;
    }
    if (o.fbclid) return 'Facebook/Instagram (sem UTM)';
    var ref = o.referrer_host || '';
    if (/(^|\.)instagram\.com$/.test(ref)) return 'Instagram orgânico';
    if (/(^|\.)facebook\.com$|(^|\.)fb\.com$|(^|\.)fb\.me$/.test(ref)) return 'Facebook orgânico';
    if (/(^|\.)google\./.test(ref)) return 'Google orgânico';
    if (ref) return 'Referência: ' + ref;
    return 'Direto / link compartilhado';
  }

  function capturar() {
    var p = new URLSearchParams(window.location.search);
    var ref = document.referrer || '';
    var refHost = hostOf(ref);
    if (refHost && refHost === window.location.hostname.replace(/^www\./, '').toLowerCase()) {
      refHost = ''; ref = ''; // navegação interna não é origem
    }
    return {
      utm_source: p.get('utm_source') || '',
      utm_medium: p.get('utm_medium') || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_term: p.get('utm_term') || '',
      utm_content: p.get('utm_content') || '',
      fbclid: p.get('fbclid') || '',
      referrer: ref,
      referrer_host: refHost,
      landing_url: window.location.href.split('#')[0],
      capturado_em: new Date().toISOString()
    };
  }

  function lerSalvo() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.capturado_em && (Date.now() - new Date(s.capturado_em).getTime()) < TTL_MS) return s;
    } catch (e) {}
    return null;
  }

  var atual = capturar();
  atual.canal = classificar(atual);
  var ehDireto = atual.canal === 'Direto / link compartilhado';
  var salvo = lerSalvo();
  var origem = (ehDireto && salvo) ? salvo : atual;

  try { localStorage.setItem(KEY, JSON.stringify(origem)); } catch (e) {}

  window.getMaternaOrigem = function () {
    var o = lerSalvo() || origem;
    o.fbc = (document.cookie.match(/(^|; )_fbc=([^;]+)/) || [])[2] || '';
    o.fbp = (document.cookie.match(/(^|; )_fbp=([^;]+)/) || [])[2] || '';
    o.pagina_envio = window.location.pathname;
    return o;
  };
})();
