/**
 * CONFIGURAÇÃO GLOBAL - MATERNIDADEPREV
 * Altere apenas este arquivo para virar o mês da campanha ou alterar o WhatsApp de atendimento!
 */
const MATERNA_CONFIG = {
  // Mês foco da campanha (onde está a urgência máxima)
  currentMonth: "Novembro",
  
  // Próximo mês da fila
  nextMonth: "Dezembro",

  // Mês seguinte (para opções do formulário)
  thirdMonth: "Janeiro",

  // Número do WhatsApp que receberá os leads (apenas números com DDI 55 + DDD + Número)
  whatsappNumber: "5511999999999", // <-- COLOQUE O NÚMERO DO SEU WHATSAPP AQUI

  // Nome exibido da assessoria
  brandName: "MaternidadePrev",
  brandLegal: "Direito Materno - Assessoria Especializada",

  // Instagram oficial
  instagramUrl: "https://www.instagram.com/maternidade.prev/",
  instagramHandle: "@maternidade.prev",

  // Pixel do Facebook / Meta Ads Oficial
  metaPixelId: "1795208765028584",

  // Estimativa de valor do benefício auditado pela especialista (4x R$ 1.621,00)
  benefitValue: "R$ 6.484,00 (4x de R$ 1.621,00)",
  parcelValue: 1621.00,
  totalBenefitValue: 6484.00,
  commissionPercentage: 30, // 30% no êxito
  estimatedCommission: 1945.20, // R$ 1.945,20 por contrato
  inssContributionCost: 178.90, // Custo da guia avulsa adiantada por Nathália (reembolso integral, fora do lucro)
  mediaCostPerContract: 200.00, // Custo médio de tráfego/anúncios investido por Kadu (reembolso integral para Kadu ANTES do lucro)

  // Divisão de Lucro Líquido REAL entre os Sócios / Parceiros (após deduzir a Verba de Mídia)
  profitSplit: {
    nathalia: { name: "Nathália", role: "Advogada", percentage: 45.0 },
    amanda: { name: "Amanda", role: "Rosto da Empresa", percentage: 22.5 },
    rafael: { name: "Rafael", role: "Produtor de Conteúdo", percentage: 22.5 },
    kadu: { name: "Kadu", role: "Gestor de Tráfego", percentage: 10.0 }
  }
};
