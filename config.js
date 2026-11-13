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

  // Número do WhatsApp oficial que receberá os leads (Direito Materno: +55 38 9149-7475)
  whatsappNumber: "553891497475",

  // Supabase Cloud Database (Sincronização Centralizada de Leads em Tempo Real)
  supabaseUrl: "https://edutujipdgzrqvjloguk.supabase.co",
  supabaseKey: "sb_publishable_grMQWI-9sz0sSkQfINM81Q_s-JCq_Zz",

  // Nome exibido da assessoria
  brandName: "MaternidadePrev",
  brandLegal: "Direito Materno - Assessoria Especializada",

  // Instagram oficial
  instagramUrl: "https://www.instagram.com/maternidade.prev/",
  instagramHandle: "@maternidade.prev",

  // Pixel do Facebook / Meta Ads Oficial
  metaPixelId: "1795208765028584",
  metaAdAccountId: "act_1055899400803247", // Identificação da conta de anúncios
  metaAdAccountName: "[00][MaternidadePrev]",

  // Estimativa e regra financeira auditada pela especialista (Nathália - Advogada)
  // O INSS paga 4 parcelas brutas de R$ 1.621,00 com desconto na fonte de R$ 178,00 em cada parcela
  parcelValue: 1621.00, // Parcela bruta INSS
  inssDiscountPerParcel: 178.00, // Retenção do INSS por parcela
  netParcelValue: 1443.00, // Parcela líquida paga à gestante (1.621 - 178 = 1.443)
  totalBenefitValue: 5772.00, // Total líquido oficial recebido pela gestante (4x R$ 1.443,00)
  totalGrossBenefitValue: 6484.00, // Total bruto previdenciário (4x R$ 1.621,00)
  benefitValue: "R$ 5.772,00 Líquido (4x de R$ 1.443,00)",

  commissionPercentage: 30, // 30% cobrado estritamente sobre o valor LÍQUIDO recebido pela cliente
  estimatedCommission: 1731.00, // Honorários da empresa por contrato (30% de R$ 5.772,00)
  inssContributionCost: 178.00, // Guia avulsa adiantada por Nathália (reembolso integral para Nathália, fora do lucro)
  totalClientPayment: 1909.00, // Total pago pela cliente à assessoria: R$ 1.731,00 + R$ 178,00 = R$ 1.909,00
  mediaCostPerContract: 200.00, // Custo médio de tráfego/anúncios investido por Kadu (reembolso integral para Kadu ANTES do lucro)

  // Divisão de Lucro Líquido REAL entre os Sócios / Parceiros (após deduzir a Verba de Mídia)
  profitSplit: {
    nathalia: { name: "Nathália", role: "Advogada", percentage: 45.0 },
    amanda: { name: "Amanda", role: "Rosto da Empresa", percentage: 22.5 },
    rafael: { name: "Rafael", role: "Produtor de Conteúdo", percentage: 22.5 },
    kadu: { name: "Kadu", role: "Gestor de Tráfego", percentage: 10.0 }
  }
};
