// Endpoint de Keep-Alive para manter o Supabase sempre ativo e impedir pausa por inatividade
const SUPABASE_URL = "https://edutujipdgzrqvjloguk.supabase.co";
const SUPABASE_KEY = "sb_publishable_grMQWI-9sz0sSkQfINM81Q_s-JCq_Zz";

module.exports = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Consulta leve na tabela de leads para gerar atividade no banco de dados
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const elapsed = Date.now() - startTime;
    const ok = response.ok;
    const data = await response.json();

    return res.status(200).json({
      success: ok,
      status: response.status,
      latency_ms: elapsed,
      timestamp: new Date().toISOString(),
      message: ok 
        ? "Heartbeat bem-sucedido! O Supabase foi acionado e a inatividade foi zerada." 
        : "Erro ao comunicar com Supabase",
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
