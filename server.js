const express = require('express');
const app = express();

// ==================== CONFIGURACIÓN BÁSICA ====================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==================== DATOS COMPLETOS DE HYPNOTTICA ====================
const HYPNOTTICA = {
  // 📍 INFORMACIÓN DE LA ÓPTICA
  informacion: {
    nombre: "Hypnottica",
    direccion: "Serrano 684, Villa Crespo, CABA",
    horarios: "Lunes a Sábado de 10:30 a 19:30",
    telefono: "1132774631",
    redes: "@hypnottica en Instagram y Facebook",
    email: "solo proveedores"
  },

  // 🏥 OBRAS SOCIALES
  obrasSociales: {
    aceptadas: ["Medicus", "Osetya", "Construir Salud", "Swiss Medical"],
    requisitos: {
      receta: "Debe detallar de manera precisa el tipo de lente solicitado",
      documentacion: "Número de credencial, datos del paciente, sello del médico y receta vigente",
      vigencia: "60 días corridos desde su emisión",
      restricciones: "La cobertura es únicamente para lo indicado en la receta"
    },
    promociones: "Actualmente no contamos con promociones adicionales"
  },

  // 👓 PRODUCTOS
  productos: {
    armazones: "Disponibles en stock (consultar modelos)",
    lentesContacto: {
      marcas: ["Acuvue", "Biofinity", "Air Optix"],
      tipos: ["diarios", "mensuales", "anuales"],
      nota: "Los anuales casi no se utilizan actualmente por mayor riesgo y cuidado"
    },
    liquidos: "Marcas y tamaños disponibles (consultar)",
    accesorios: "Estuches, paños, líquidos y otros accesorios",
    servicios: "Ajustes y reparaciones (evaluación en persona)"
  },

  // 💰 PRECIOS Y PROMOCIONES
  precios: {
    rangoArmazones: "$55.000 hasta $370.000 (solo armazón)",
    promociones: [
      "3 cuotas sin interés a partir de $100.000",
      "6 cuotas sin interés a partir de $200.000",
      "10% de descuento abonando en efectivo (totalidad en efectivo)"
    ],
    mediosPago: ["efectivo", "QR", "tarjetas de crédito/débito"]
  },

  // 🗣️ PALABRAS CLAVE
  palabrasClave: {
    saludos: [
      "hola", "buenas", "holis", "hey", "qué tal", "cómo andás", "cómo andan",
      "buen día", "buenas tardes", "buenas noches", "qué hacés", "cómo va",
      "saludos", "ey", "buenas ¿todo bien?", "holaaa"
    ],
    despedidas: [
      "chau", "gracias", "nos vemos", "adiós", "hasta luego", "hasta pronto",
      "hasta mañana", "hasta la próxima", "cuidate", "cuídense", "un saludo",
      "suerte", "que estés bien", "que les vaya bien", "abrazo", "besos",
      "hablamos", "chaooo"
    ],
    sinonimosProductos: [
      "lentes", "anteojos", "gafas", "espejuelos", "gafas de sol", "lentes de sol",
      "lentes recetados", "anteojos recetados", "lentes de aumento", "lentes graduados",
      "monturas", "armazones", "cristales", "lentillas", "lentes de contacto",
      "pupilentes", "gafas ópticas", "gafas de lectura", "multifocales", "bifocales",
      "progresivos", "lentes para computadora", "lentes de cerca", "lentes de lejos"
    ]
  },

  // ⏰ TIEMPOS DE ENTREGA
  tiemposEntrega: {
    particulares: "1 día a 1 semana (según tipo de cristal)",
    obraSocial: "alrededor de 2 semanas",
    lentesContactoOS: "2 a 4 semanas"
  }
};

// ==================== SISTEMA DE INTENCIONES ====================
class IntentRecognizer {
  detectIntent(mensaje) {
    const mensajeLower = mensaje.toLowerCase();
    
    if (this.esSaludo(mensajeLower)) return 'saludo';
    if (this.esDespedida(mensajeLower)) return 'despedida';
    if (this.esObraSocial(mensajeLower)) return 'obra_social';
    if (this.esStock(mensajeLower)) return 'stock';
    if (this.esPrecio(mensajeLower)) return 'precio';
    if (this.esMarca(mensajeLower)) return 'marca';
    if (this.esHorario(mensajeLower)) return 'horario';
    if (this.esDireccion(mensajeLower)) return 'direccion';
    if (this.esLentesContacto(mensajeLower)) return 'lentes_contacto';
    if (this.esLiquidos(mensajeLower)) return 'liquidos';
    if (this.esConsultaFrecuente(mensajeLower)) return 'consulta_frecuente';
    
    return 'no_entendido';
  }

  esSaludo(mensaje) {
    return HYPNOTTICA.palabrasClave.saludos.some(saludo => 
      mensaje.includes(saludo)
    );
  }

  esDespedida(mensaje) {
    return HYPNOTTICA.palabrasClave.despedidas.some(despedida => 
      mensaje.includes(despedida)
    );
  }

  esObraSocial(mensaje) {
    const palabrasOS = ['obra social', 'prepaga', 'swiss medical', 'medicus', 'osetya', 'construir salud'];
    return palabrasOS.some(palabra => mensaje.includes(palabra));
  }

  esStock(mensaje) {
    return mensaje.includes('stock') || mensaje.includes('#stock') || 
           mensaje.includes('tenes') || mensaje.includes('tienen');
  }

  esPrecio(mensaje) {
    return mensaje.includes('precio') || mensaje.includes('cuesta') || 
           mensaje.includes('cuanto sale') || mensaje.includes('valor');
  }

  esMarca(mensaje) {
    return mensaje.includes('marca') || mensaje.includes('ray-ban') || 
           mensaje.includes('oakley') || mensaje.includes('marcas');
  }

  esHorario(mensaje) {
    return mensaje.includes('horario') || mensaje.includes('hora') || 
           mensaje.includes('abren') || mensaje.includes('cierran');
  }

  esDireccion(mensaje) {
    return mensaje.includes('direccion') || mensaje.includes('ubicacion') || 
           mensaje.includes('donde estan') || mensaje.includes('ubicados');
  }

  esLentesContacto(mensaje) {
    return mensaje.includes('lentes de contacto') || mensaje.includes('lentillas') || 
           mensaje.includes('pupilentes') || mensaje.includes('contacto');
  }

  esLiquidos(mensaje) {
    return mensaje.includes('líquido') || mensaje.includes('liquido') || 
           mensaje.includes('solucion') || mensaje.includes('solución');
  }

  esConsultaFrecuente(mensaje) {
    const consultas = ['envio', 'envío', 'domicilio', 'financiacion', 'cuota', 'receta'];
    return consultas.some(consulta => mensaje.includes(consulta));
  }
}

// ==================== MANEJADOR DE RESPUESTAS ====================
class ResponseHandler {
  constructor() {
    this.recognizer = new IntentRecognizer();
  }

  async generarRespuesta(mensaje, contexto = { paso: 0 }) {
    const intent = this.recognizer.detectIntent(mensaje);
    
    switch (intent) {
      case 'saludo':
        return this.respuestaSaludo(contexto);
      
      case 'obra_social':
        return this.respuestaObraSocial();
      
      case 'precio':
        return this.respuestaPrecios();
      
      case 'marca':
        return this.respuestaMarcas();
      
      case 'horario':
        return this.respuestaHorarios();
      
      case 'direccion':
        return this.respuestaDireccion();
      
      case 'lentes_contacto':
        return this.respuestaLentesContacto();
      
      case 'liquidos':
        return this.respuestaLiquidos();
      
      case 'consulta_frecuente':
        return this.respuestaConsultaFrecuente(mensaje);
      
      case 'despedida':
        return this.respuestaDespedida();
      
      default:
        return this.respuestaNoEntendido();
    }
  }

  respuestaSaludo(contexto) {
    contexto.paso = 1;
    const emojis = ['👋', '👓', '🔍', '💡', '📍', '🌟'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    return `${emoji} ¡Hola! Soy *Luna*, tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy?\n\n` +
           `• 📦 Consultar stock\n` +
           `• 💲 Precios y promociones\n` +
           `• 🏥 Obras sociales\n` +
           `• 👁️ Lentes de contacto\n` +
           `• 📍 Ubicación y horarios\n` +
           `• 🔧 Servicios técnicos`;
  }

  respuestaObraSocial() {
    return `🏥 *Obras Sociales que aceptamos:*\n\n` +
           `${HYPNOTTICA.obrasSociales.aceptadas.map(os => `• ${os}`).join('\n')}\n\n` +
           `📋 *Requisitos:*\n` +
           `• ${HYPNOTTICA.obrasSociales.requisitos.receta}\n` +
           `• ${HYPNOTTICA.obrasSociales.requisitos.documentacion}\n` +
           `• Vigencia: ${HYPNOTTICA.obrasSociales.requisitos.vigencia}\n\n` +
           `💡 *Importante:* ${HYPNOTTICA.obrasSociales.requisitos.restricciones}`;
  }

  respuestaPrecios() {
    return `💲 *Precios y Promociones*\n\n` +
           `👓 *Armazones:* ${HYPNOTTICA.precios.rangoArmazones}\n\n` +
           `🎉 *Promociones vigentes:*\n` +
           `${HYPNOTTICA.precios.promociones.map(p => `• ${p}`).join('\n')}\n\n` +
           `💳 *Medios de pago:* ${HYPNOTTICA.precios.mediosPago.join(', ')}`;
  }

  respuestaMarcas() {
    return `👓 *Marcas que trabajamos:*\n\n` +
           `• Ray-Ban\n` +
           `• Oakley\n` +
           `• Vulk\n` +
           `• Y muchas más!\n\n` +
           `👁️ *Lentes de contacto:* ${HYPNOTTICA.productos.lentesContacto.marcas.join(', ')}\n\n` +
           `¿Te interesa alguna marca en particular?`;
  }

  respuestaHorarios() {
    return `⏰ *Horarios de atención:*\n\n` +
           `${HYPNOTTICA.informacion.horarios}\n\n` +
           `📍 ${HYPNOTTICA.informacion.direccion}\n\n` +
           `📞 ${HYPNOTTICA.informacion.telefono}`;
  }

  respuestaDireccion() {
    return `📍 *Nuestra dirección:*\n\n` +
           `${HYPNOTTICA.informacion.direccion}\n\n` +
           `⏰ *Horarios:* ${HYPNOTTICA.informacion.horarios}\n\n` +
           `📱 *Seguinos:* ${HYPNOTTICA.informacion.redes}`;
  }

  respuestaLentesContacto() {
    return `👁️ *¡Sí! Trabajamos con lentes de contacto* ✅\n\n` +
           `🏷️ *Marcas disponibles:*\n` +
           `${HYPNOTTICA.productos.lentesContacto.marcas.map(m => `• ${m}`).join('\n')}\n\n` +
           `📋 *Tipos:* ${HYPNOTTICA.productos.lentesContacto.tipos.join(', ')}\n\n` +
           `💡 *Nota:* ${HYPNOTTICA.productos.lentesContacto.nota}\n\n` +
           `⏰ *Tiempo de entrega por obra social:* ${HYPNOTTICA.tiemposEntrega.lentesContactoOS}\n\n` +
           `¿Qué marca te interesa o ya usás alguna?`;
  }

  respuestaLiquidos() {
    return `🧴 *Líquidos para lentes de contacto*\n\n` +
           `📦 *Productos disponibles:*\n` +
           `• Renu - 300ml\n` +
           `• Opti-Free - 360ml\n` +
           `• BioTrue - 300ml\n` +
           `• Y más marcas\n\n` +
           `💲 *Precios promocionales* todos los meses\n` +
           `🎁 *Descuentos* por cantidad\n\n` +
           `¿Te interesa algún producto en particular?`;
  }

  respuestaConsultaFrecuente(mensaje) {
    if (mensaje.includes('envio') || mensaje.includes('domicilio')) {
      return `🚚 *Envíos a domicilio:*\n\n` +
             `Sí, en algunos casos. Sin embargo, recomendamos siempre retirar en persona para realizar el control final con los lentes puestos.`;
    }
    
    if (mensaje.includes('financiacion') || mensaje.includes('cuota')) {
      return `💳 *Financiación:*\n\n` +
             `Sí, contamos con planes en cuotas sin interés:\n` +
             `${HYPNOTTICA.precios.promociones.map(p => `• ${p}`).join('\n')}`;
    }
    
    if (mensaje.includes('receta')) {
      return `📄 *Recetas médicas:*\n\n` +
             `Sí, aceptamos recetas y podemos corroborar la refracción indicada por el médico.`;
    }
    
    return this.respuestaNoEntendido();
  }

  respuestaDespedida() {
    const emojis = ['👋', '🌟', '💫', '✨'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    return `${emoji} ¡Fue un gusto ayudarte! No dudes en escribirme si tenés más preguntas.\n\n` +
           `*Hypnottica* - Tu visión, nuestra pasión.`;
  }

  respuestaNoEntendido() {
    return `🤔 No estoy segura de entenderte. ¿Podrías decirlo de otra forma?\n\n` +
           `Podés preguntarme por:\n` +
           `• 📦 Stock de productos\n` +
           `• 💲 Precios y promociones\n` +
           `• 🏥 Obras sociales\n` +
           `• 👁️ Lentes de contacto\n` +
           `• ⏰ Horarios\n` +
           `• 📍 Ubicación\n\n` +
           `O escribí *"hola"* para ver todas las opciones.`;
  }
}
