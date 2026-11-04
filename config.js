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

  // Pixel do Facebook / Meta Ads (deixe em branco se for colocar via GTM)
  metaPixelId: "",

  // Estimativa média do valor do benefício exibida na LP
  benefitValue: "R$ 5.600 a R$ 12.000+"
};
