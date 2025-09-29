const config = {
  personalidad: {
    nombre: "Luna",
    emojis: ["👋", "👓", "🔍", "💡", "📍", "⏳", "💎", "🔊", "🌟", "📌", "🏥", "📋", "👁️", "⏰", "🧴"],
    velocidadRespuesta: { min: 800, max: 2500 }
  },
  
  horarios: {
    regular: "Lunes a Sábados: 10:30 - 19:30",
    adaptacionLC: "Lunes a Sábado: hasta las 18:30 (por la duración del procedimiento)"
  },
  
  obrasSociales: ["Swiss Medical", "Medicus", "Construir Salud", "Osetya"],
  
  google: {
    serviceAccount: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'),
    sheets: {
      armazones: process.env.SHEETS_ARMAZONES || 'STOCK ARMAZONES 1',
      accesorios: process.env.SHEETS_ACCESORIOS,
      lentesContacto: process.env.SHEETS_LC,
      liquidos: process.env.SHEETS_LIQUIDOS,
      principal: process.env.GOOGLE_SHEETS_ID
    }
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  }
};

module.exports = { config };
