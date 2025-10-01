const config = {
  // INFORMACIÓN DE LA ÓPTICA
  optica: {
    nombre: "Hypnottica",
    direccion: "Serrano 684, Villa Crespo, CABA",
    horarios: "Lunes a Sábado de 10:30 a 19:30",
    telefono: "1132774631",
    redes: {
      instagram: "@hypnottica",
      facebook: "@hypnottica"
    }
  },

  // OBRAS SOCIALES
  obrasSociales: {
    aceptadas: ["Medicus", "Osetya", "Construir Salud", "Swiss Medical"],
    requisitos: {
      receta: "Debe detallar de manera precisa el tipo de lente solicitado",
      documentacion: "Número de credencial, datos del paciente, sello del médico",
      vigencia: "60 días corridos desde su emisión",
      restricciones: "La cobertura es únicamente para lo indicado en la receta"
    }
  },

  // PRODUCTOS
  productos: {
    lentesContacto: {
      marcas: ["Acuvue", "Biofinity", "Air Optix"],
      tipos: ["diarios", "mensuales", "anuales"],
      nota: "Los anuales casi no se utilizan actualmente por el mayor riesgo y cuidado que requieren"
    },
    servicios: ["ajustes", "reparaciones", "limpieza"]
  },

  // PRECIOS Y PROMOCIONES
  precios: {
    rango: "desde $55.000 hasta $370.000 (solo armazón)",
    promociones: {
      "3 cuotas sin interés": "a partir de $100.000",
      "6 cuotas sin interés": "a partir de $200.000", 
      "10% descuento": "abonando en efectivo (totalidad)"
    },
    mediosPago: ["efectivo", "QR", "tarjetas de crédito/débito"]
  },

  // PERSONALIDAD DEL BOT
  bot: {
    nombre: "Luna",
    emojis: ["👓", "🕶️", "😊", "🌙", "✨", "📍", "⏰", "💳"],
    tono: "profesional y cercano"
  }
};

module.exports = config;
