// src/config/optica.js

module.exports = {
  // CATEGORÍA 1: INFORMACIÓN DE LA ÓPTICA
  direccion: "Serrano 684, Villa Crespo, CABA",
  horarios: "Lunes a Sábado de 10:30 a 19:30",
  telefono: "1132774631",
  redesSociales: {
    instagram: "@hypnottica",
    facebook: "@hypnottica"
  },
  email: "solo proveedores",

  // CATEGORÍA 2: OBRAS SOCIALES
  obrasSociales: {
    aceptadas: ["Medicus", "Osetya", "Construir Salud", "Swiss Medical"],
    requisitos: {
      receta: "Debe detallar de manera precisa el tipo de lente solicitado (ejemplo: lentes para lejos, lentes para cerca, multifocales, lentes de contacto, etc.)",
      documentacion: "número de credencial, datos del paciente, sello del médico y receta vigente",
      vigencia: "60 días corridos desde su emisión",
      restricciones: "La cobertura es únicamente para lo indicado en la receta. Ejemplo: si figura 'lentes para lejos', no se pueden realizar lentes multifocales."
    },
    promociones: "Actualmente no contamos con promociones adicionales; se cubre únicamente lo que establece cada obra social."
  },

  // CATEGORÍA 3: PRODUCTOS Y STOCK
  productos: {
    armazones: "disponibles en stock (detalle en planilla de Google Sheets)",
    lentesContacto: {
      marcas: ["Acuvue", "Biofinity", "Air Optix"],
      tipos: ["diarios", "mensuales", "anuales (casi no se utilizan)"],
      nota: "Los anuales casi no se utilizan actualmente por el mayor riesgo y cuidado que requieren, ya que hoy existen opciones mensuales más seguras y prácticas."
    },
    liquidos: {
      marcas: "Ver planilla Google Sheets (columna B2: Marca)",
      tamanos: "Ver planilla Google Sheets (columna C2: Tamaño ml)"
    },
    accesorios: "contamos con estuches, paños, líquidos y otros accesorios. (Los valores no están actualizados en el sheet de google asi que el bot solo va a decir que los tenemos).",
    servicios: "realizamos ajustes y reparaciones. El técnico debe evaluar cada caso en persona para confirmar si el arreglo es posible y brindar un presupuesto."
  },

  // CATEGORÍA 4: PRECIOS Y PROMOCIONES
  precios: {
    rangoArmazones: "desde $55.000 hasta $370.000 (solo armazón)",
    promociones: {
      cuotas: {
        "3 cuotas sin interés": "a partir de $100.000",
        "6 cuotas sin interés": "a partir de $200.000"
      },
      descuentoEfectivo: "10% de descuento abonando en efectivo (totalidad en efectivo, no aplica a transferencias ni pagos mixtos)"
    },
    mediosPago: ["efectivo", "QR", "tarjetas de crédito/débito"],
    descuentos: "únicamente el 10% en efectivo"
  },

  // CATEGORÍA 5: SALUDOS Y PALABRAS CLAVE (para el reconocimiento de intenciones)
  saludos: {
    comunes: ["hola", "buenas", "holis", "hey", "qué tal", "cómo andás", "cómo andan", "buen día", "buenas tardes", "buenas noches", "qué hacés", "cómo va", "saludos", "ey", "buenas ¿todo bien?", "holaaa"],
    despedidas: ["chau", "gracias", "nos vemos", "adiós", "hasta luego", "hasta pronto", "hasta mañana", "hasta la próxima", "cuidate", "cuídense", "un saludo", "suerte", "que estés bien", "que les vaya bien", "abrazo", "besos", "hablamos", "chaooo"]
  },

  // CATEGORÍA 6: CONSULTAS FRECUENTES (respuestas predefinidas)
  consultasFrecuentes: {
    precios: "Los armazones tienen un rango de precios desde $55.000 hasta $370.000 (solo armazón). También tenemos promociones en cuotas y descuento por pago en efectivo.",
    promociones: "Promociones vigentes: 3 cuotas sin interés a partir de $100.000, 6 cuotas sin interés a partir de $200.000 y 10% de descuento abonando en efectivo.",
    obrasSociales: "Trabajamos con Medicus, Osetya, Construir Salud y Swiss Medical. Requisitos: receta detallada, credencial, sello del médico y receta vigente (60 días).",
    marcas: "Trabajamos con marcas de armazones (consulta en nuestro stock) y lentes de contacto de las marcas Acuvue, Biofinity y Air Optix.",
    lentesSol: "Sí, tenemos lentes de sol con protección UV. Pueden ser con o sin graduación.",
    tiempoEntrega: {
      particulares: "entre 1 día y 1 semana (según el tipo de cristal)",
      obraSocial: "alrededor de 2 semanas (depende de la obra social)",
      lentesContactoObraSocial: "entre 2 y 4 semanas"
    },
    ubicacion: "Estamos en Serrano 684, Villa Crespo, CABA.",
    horarios: "Abrimos de Lunes a Sábado de 10:30 a 19:30.",
    envios: "Sí, en algunos casos. Sin embargo, recomendamos siempre retirar en persona para realizar el control final con los lentes puestos.",
    financiacion: "Sí, ofrecemos financiación con tarjeta: 3 cuotas sin interés a partir de $100.000 y 6 cuotas sin interés a partir de $200.000."
  },

  // CATEGORÍA 7: PROCESOS Y REQUISITOS
  procesos: {
    lentesContacto: "requieren receta detallada y en vigencia, además de la credencial de la obra social (cuando corresponda).",
    armazones: "tiempos de entrega: particulares 1-7 días, obra social 2 semanas aprox.",
    obrasSociales: "receta médica detallada, credencial, sello del médico, vigencia de 60 días."
  },

  // CATEGORÍA 8: PERSONALIDAD DEL BOT
  personalidad: {
    nombre: "Luna",
    tono: "profesional y cercano, amigable y empático, claro y sencillo, cordial",
    emojis: {
      anteojos: "👓",
      gafasSol: "🕶️",
      sonrisa: "😊",
      luna: "🌙",
      destacar: "✨",
      ubicacion: "📍",
      horarios: "⏰",
      pagos: "💳",
      prohibido: "❌"
    }
  }
};
