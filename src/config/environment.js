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
  
  // 🟢 GOOGLE - VERSIÓN SIMPLIFICADA
  google: {
    // OPCIÓN A: Sin service account (más simple)
    sheetId: process.env.GOOGLE_SHEETS_ID,
    
    // OPCIÓN B: Con API Key simple (opcional)
    apiKey: process.env.GOOGLE_API_KEY,
    
    // Hojas específicas (usando los nombres exactos de tus sheets)
    sheets: {
      armazones: 'STOCK ARMAZONES 1',           // ← nombre exacto de tu hoja
      lentesContacto: 'Stock LC',       // ← nombre exacto  
      liquidos: 'Stock Liquidos',       // ← nombre exacto
      accesorios: 'Stock Accesorios'    // ← si existe
    }
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  
  // 🟢 SERVER CONFIG
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  }
};

// 🟢 EXPORTAR VARIABLES INDIVIDUALES PARA FÁCIL ACCESO
module.exports = { 
  config,
  
  // Variables individuales para el sheets service
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEETS_ID,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PORT: process.env.PORT || 3000
};
