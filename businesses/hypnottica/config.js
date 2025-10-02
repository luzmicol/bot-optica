module.exports = {
  id: "hypnottica",
  name: "Hypnottica Óptica",
  industry: "healthcare",
  
  // Personalidad del bot
  personality: {
    name: "Luna",
    tone: "profesional-cercano", 
    expertise: "asistente virtual de la óptica Hypnottica",
    emoji: "👁️"
  },
  
  // Información del negocio
  businessInfo: {
    name: "Hypnottica",
    address: "Serrano 684, Villa Crespo, CABA",
    phone: "1132774631",
    hours: "Lunes a Sábado de 10:30 a 19:30",
  },
  
  // Configuración de datos
  dataSources: {
    armazones: process.env.SHEETS_ARMAZONES,
    lentes_contacto: process.env.SHEETS_LC,
    liquidos: process.env.SHEETS_LIQUIDOS
  },
  
  // Reglas de negocio
  businessRules: {
    requirePrescription: true,
    prescriptionValidityDays: 60,
    supportedInsurance: ["Medicus", "Osetya", "Construir Salud", "Swiss Medical"],
    emergencyKeywords: ["dolor", "molestia", "urgencia", "no veo", "veo mal", "emergencia"]
  },
  
  // Configuración de respuestas
  responseSettings: {
    maxProductsToShow: 5,
    includeEmojis: true,
    includeSuggestions: true,
    fallbackToHuman: true
  },
  
  // Metadata para escalabilidad futura
  metadata: {
    version: "1.0.0",
    framework: "BaseBot",
    capabilities: ["product_inquiry", "price_inquiry", "stock_check", "business_info"],
    futureCapabilities: ["llm_rag", "voice_interface", "multi_channel", "advanced_analytics"]
  }
};
