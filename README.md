# MaternidadePrev - Landing Page de Conversão Imediata

Landing page de alta conversão, responsiva e focada em qualificação de gestantes na reta final de gestação para liberação pré-parto do Salário-Maternidade.

## 🚀 Tecnologias
- HTML5 Semântico
- Tailwind CSS
- Vanilla JavaScript
- Meta Pixel Event Tracking (`Lead`)
- Integração Direta com WhatsApp

## ⚙️ Como alterar o mês da campanha
Para virar a campanha de mês (ex: de Novembro para Dezembro), edite apenas o arquivo `config.js`:

```javascript
const MATERNA_CONFIG = {
  currentMonth: "Dezembro",  // Mês foco da urgência
  nextMonth: "Janeiro",      // Próximo mês
  thirdMonth: "Fevereiro",   // Terceiro mês
  whatsappNumber: "5511999999999", // WhatsApp comercial
  metaPixelId: ""            // Pixel do Meta Ads
};
```
Todos os títulos, badges de urgência, opções do formulário e textos pré-formatados da mensagem do WhatsApp serão atualizados automaticamente em toda a página.
