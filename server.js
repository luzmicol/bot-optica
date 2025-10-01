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

// ==================== SISTEMA DE INTENCIONES INTELIGENTE ====================
class IntentRecognizer {
  detectIntent(mensaje) {
    const mensajeLower = mensaje.toLowerCase().trim();
    
    // 🎯 DETECCIÓN POR CONTEXTO - no por palabras exactas
    if (this.esSaludoContextual(mensajeLower)) return 'saludo';
    if (this.esLentesContactoContextual(mensajeLower)) return 'lentes_contacto';
    if (this.esLiquidosContextual(mensajeLower)) return 'liquidos';
    if (this.esObraSocialContextual(mensajeLower)) return 'obra_social';
    if (this.esPrecioContextual(mensajeLower)) return 'precio';
    if (this.esMarcaContextual(mensajeLower)) return 'marca';
    if (this.esHorarioContextual(mensajeLower)) return 'horario';
    if (this.esDireccionContextual(mensajeLower)) return 'direccion';
    if (this.esDespedidaContextual(mensajeLower)) return 'despedida';
    
    return 'no_entendido';
  }

  esSaludoContextual(mensaje) {
    // Cualquier combinación que incluya saludo
    const patrones = [
      /buen(a|o|as|os)\s+(d[ií]a|tarde|noche)/,
      /hola/,
      /buenas/,
      /qué tal/,
      /cómo va/,
      /saludos/,
      /buen/,
      /holis/,
      /hey/,
      /hi/,
      /hello/
    ];
    return patrones.some(patron => patron.test(mensaje));
  }

  esLentesContactoContextual(mensaje) {
    // Si menciona lentes de contacto O cualquier variación
    const palabrasClave = ['lente', 'contacto', 'lentilla', 'pupilente'];
    const tienePalabraClave = palabrasClave.some(palabra => mensaje.includes(palabra));
    
    // Y además tiene alguna palabra de consulta
    const palabrasConsulta = ['tienen', 'trabajan', 'venden', 'qué', 'que', 'cual', 'cuál', 'info'];
    const tieneConsulta = palabrasConsulta.some(palabra => mensaje.includes(palabra));
    
    // O es una respuesta directa a una pregunta anterior
    const respuestasDirectas = ['primera vez', 'ya uso', 'nunca use', 'uso actual'];
    const esRespuestaDirecta = respuestasDirectas.some(respuesta => mensaje.includes(respuesta));
    
    return tienePalabraClave && (tieneConsulta || mensaje.length < 20) || esRespuestaDirecta;
  }

  esLiquidosContextual(mensaje) {
    const palabrasClave = ['líquido', 'liquido', 'solución', 'solucion', 'limpieza'];
    const tienePalabraClave = palabrasClave.some(palabra => mensaje.includes(palabra));
    
    const palabrasConsulta = ['tienen', 'qué', 'que', 'recomienda', 'recomendación'];
    const tieneConsulta = palabrasConsulta.some(palabra => mensaje.includes(palabra));
    
    return tienePalabraClave && (tieneConsulta || mensaje.length < 15);
  }

  esObraSocialContextual(mensaje) {
    const obrasSociales = ['medicus', 'swiss', 'osetya', 'construir'];
    const tieneOS = obrasSociales.some(os => mensaje.includes(os));
    
    const palabrasOS = ['obra social', 'prepaga', 'cobertura', 'plan médico'];
    const tienePalabraOS = palabrasOS.some(palabra => mensaje.includes(palabra));
    
    return tieneOS || tienePalabraOS;
  }

  esPrecioContextual(mensaje) {
    const palabrasPrecio = ['precio', 'cuesta', 'valor', 'cuanto', 'cuánto', '$'];
    return palabrasPrecio.some(palabra => mensaje.includes(palabra));
  }

  esMarcaContextual(mensaje) {
    const marcas = ['ray-ban', 'oakley', 'vulk', 'acuvue', 'biofinity', 'air optix', 'renu', 'opti-free'];
    const tieneMarca = marcas.some(marca => mensaje.includes(marca));
    
    const palabrasMarca = ['marca', 'modelo', 'fabricante'];
    const tienePalabraMarca = palabrasMarca.some(palabra => mensaje.includes(palabra));
    
    return tieneMarca || tienePalabraMarca;
  }

  esHorarioContextual(mensaje) {
    const palabrasHorario = ['horario', 'hora', 'abren', 'cierran', 'atención', 'cuando'];
    return palabrasHorario.some(palabra => mensaje.includes(palabra));
  }

  esDireccionContextual(mensaje) {
    const palabrasDireccion = ['direccion', 'ubicacion', 'dónde', 'donde', 'local', 'dirección'];
    return palabrasDireccion.some(palabra => mensaje.includes(palabra));
  }

  esDespedidaContextual(mensaje) {
    const palabrasDespedida = ['chau', 'gracias', 'adiós', 'bye', 'nos vemos', 'hasta luego'];
    return palabrasDespedida.some(palabra => mensaje.includes(palabra));
  }
}
// ==================== MANEJADOR DE RESPUESTAS MEJORADO ====================
class ResponseHandler {
  constructor() {
    this.recognizer = new IntentRecognizer();
  }

  async generarRespuesta(mensaje, contexto = { paso: 0, ultimoTema: null }) {
    const intent = this.recognizer.detectIntent(mensaje);
    const mensajeLower = mensaje.toLowerCase();
    
    // 🎯 RESPUESTAS MÁS CORTAS Y NATURALES
    switch (intent) {
      case 'saludo':
        contexto.ultimoTema = 'saludo';
        return this.respuestaSaludo(contexto);
      
      case 'obra_social':
        contexto.ultimoTema = 'obra_social';
        return this.respuestaObraSocial(mensajeLower, contexto);
      
      case 'precio':
        contexto.ultimoTema = 'precio';
        return this.respuestaPrecios(mensajeLower, contexto);
      
      case 'marca':
        contexto.ultimoTema = 'marca';
        return this.respuestaMarcas(mensajeLower, contexto);
      
      case 'horario':
        contexto.ultimoTema = 'horario';
        return "⏰ Abrimos de lunes a sábado de 10:30 a 19:30. ¿Te sirve algún día en particular?";
      
      case 'direccion':
        contexto.ultimoTema = 'direccion';
        return "📍 Estamos en Serrano 684, Villa Crespo. ¿Necesitás indicaciones o el barrio?";
      
      case 'lentes_contacto':
        contexto.ultimoTema = 'lentes_contacto';
        return this.respuestaLentesContacto(mensajeLower, contexto);
      
      case 'liquidos':
        contexto.ultimoTema = 'liquidos';
        return "🧴 Tenemos líquidos de varias marcas. ¿Usás alguna marca específica o te recomiendo?";
      
      case 'consulta_frecuente':
        return this.respuestaConsultaFrecuente(mensajeLower, contexto);
      
      case 'despedida':
        return "👋 ¡Chau! Cualquier cosa escribime 😊";
      
      default:
        // Si no entendió pero estamos en medio de una conversación
        async generarRespuesta(mensaje, contexto = { paso: 0, ultimoTema: null, conversacion: [] }) {
  const intent = this.recognizer.detectIntent(mensaje);
  const mensajeLower = mensaje.toLowerCase();
  
  // 🎯 GUARDAR HISTORIAL DE CONVERSACIÓN
  contexto.conversacion.push({ mensaje, intent, timestamp: Date.now() });
  
  // 🎯 SI NO ENTENDIÓ PERO HAY CONTEXTO, SEGUIR LA CONVERSACIÓN
  if (intent === 'no_entendido' && contexto.ultimoTema) {
    return this.continuarConversacionNatural(contexto.ultimoTema, mensajeLower, contexto);
  }
  
  // 🎯 RESET si pasó mucho tiempo o es nuevo saludo
  if (intent === 'saludo' && contexto.ultimoTema && Date.now() - contexto.conversacion[contexto.conversacion.length - 2]?.timestamp > 300000) {
    contexto.ultimoTema = null;
    contexto.conversacion = [];
  }
  
  contexto.ultimoTema = intent;
  
  // ... el resto del switch igual ...
}

  respuestaSaludo(contexto) {
    contexto.paso = 1;
    return "👋 ¡Hola! Soy Luna de Hypnottica. ¿En qué te ayudo hoy?";
  }

  respuestaObraSocial(mensaje, contexto) {
    if (mensaje.includes('medicus') || mensaje.includes('swiss') || mensaje.includes('osetya') || mensaje.includes('construir')) {
      return "✅ Sí, trabajamos con esa obra social. ¿Tenés la receta? La vigencia es de 60 días.";
    }
    
    if (mensaje.includes('requisito') || mensaje.includes('documento')) {
      return "📋 Necesitás receta con el tipo de lente específico, credencial y que esté vigente (60 días).";
    }
    
    return "🏥 Trabajamos con Medicus, Swiss Medical, Osetya y Construir Salud. ¿Cuál tenés?";
  }

  respuestaPrecios(mensaje, contexto) {
    if (mensaje.includes('armazon') || mensaje.includes('lente') || mensaje.includes('anteojo')) {
      return "👓 Los armazones arrancan en $55.000. ¿Buscás algo en particular?";
    }
    
    if (mensaje.includes('contacto') || mensaje.includes('lentilla')) {
      return "👁️ Los lentes de contacto varían según la marca y tipo. ¿Usás alguno actualmente?";
    }
    
    if (mensaje.includes('promo') || mensaje.includes('cuota') || mensaje.includes('descuento')) {
      return "💳 Tenemos cuotas sin interés y 10% en efectivo. ¿Qué te interesa?";
    }
    
    return "💲 Los precios dependen del producto. ¿Armazones, lentes de contacto o accesorios?";
  }

  respuestaMarcas(mensaje, contexto) {
    if (mensaje.includes('ray-ban') || mensaje.includes('oakley') || mensaje.includes('vulk')) {
      return `✅ Sí, trabajamos con ${mensaje.includes('ray-ban') ? 'Ray-Ban' : mensaje.includes('oakley') ? 'Oakley' : 'Vulk'}. Tenemos varios modelos.`;
    }
    
    if (mensaje.includes('contacto') || mensaje.includes('acuvue') || mensaje.includes('biofinity')) {
      return "👁️ De lentes de contacto tenemos Acuvue, Biofinity y Air Optix. ¿Alguna te interesa?";
    }
    
    return "👓 Trabajamos con Ray-Ban, Oakley, Vulk y más. ¿Te gusta alguna marca en especial?";
  }

  respuestaLentesContacto(mensaje, contexto) {
    if (mensaje.includes('marca') || mensaje.includes('acuvue') || mensaje.includes('biofinity')) {
      return "👁️ Tenemos Acuvue, Biofinity y Air Optix. ¿Probaste alguna?";
    }
    
    if (mensaje.includes('tipo') || mensaje.includes('diario') || mensaje.includes('mensual')) {
      return "📅 Los hay diarios, mensuales y anuales. Los diarios son los más prácticos para empezar.";
    }
    
    if (mensaje.includes('primera vez') || mensaje.includes('empezar') || mensaje.includes('nuevo')) {
      return "🎯 Para primera vez te recomiendo una consulta para ver qué te conviene más. ¿Ya tenés receta?";
    }
    
    return "👁️ ¡Sí! Trabajamos con lentes de contacto. ¿Es tu primera vez o ya usás?";
  }

  respuestaConsultaFrecuente(mensaje, contexto) {
    if (mensaje.includes('envio') || mensaje.includes('domicilio')) {
      return "🚚 Hacemos envíos, pero recomendamos retirar acá para probártelos bien.";
    }
    
    if (mensaje.includes('tiempo') || mensaje.includes('entrega') || mensaje.includes('demora')) {
      if (mensaje.includes('obra social')) {
        return "⏳ Por obra social son 2 semanas aproximadamente.";
      }
      return "⏱️ Los particulares los tenemos en 1-7 días según el cristal.";
    }
    
    if (mensaje.includes('receta')) {
      return "📄 Sí, aceptamos recetas. La vigencia es de 60 días.";
    }
    
    return this.respuestaNoEntendido();
  }
respuestaLiquidos(mensaje, contexto) {
  if (mensaje.includes('marca') || mensaje.includes('acuvue') || mensaje.includes('biofinity')) {
    return "👁️ Tenemos Acuvue, Biofinity y Air Optix. ¿Probaste alguna?";
  }
  
  // 🎯 NUEVO: Detectar recomendaciones
  if (mensaje.includes('recomenda') || mensaje.includes('sugerí') || mensaje.includes('sugiere')) {
    return "🧴 Te recomiendo Renu o Opti-Free, son los más populares. ¿Para qué tipo de lente?";
  }
  
  if (mensaje.includes('tamaño') || mensaje.includes('ml') || mensaje.includes('grande')) {
    return "📏 Tenemos de 300ml y 360ml. El de 360ml rinde más si usás lentes a diario.";
  }
  
  // Si ya estaban hablando de líquidos y preguntan qué tienen
  if (contexto.ultimoTema === 'liquidos' && (mensaje.includes('que') || mensaje.includes('qué'))) {
    return "🧴 Tenemos Renu, Opti-Free, BioTrue y más marcas. ¿Alguna te interesa?";
  }
  
  return "🧴 Tenemos líquidos de varias marcas. ¿Usás alguna marca específica o te recomiendo?";
}
 continuarConversacionNatural(ultimoTema, mensaje, contexto) {
  // 🎯 CONVERSACIÓN NATURAL - sin detección estricta
  switch (ultimoTema) {
    case 'lentes_contacto':
      // Cualquier respuesta relacionada con primera vez
      if (mensaje.includes('primera') || mensaje.includes('nunca') || mensaje.includes('nuevo') || 
          mensaje.includes('empezar') || mensaje.includes('iniciar')) {
        return "🎯 ¡Perfecto para empezar! Te recomiendo una consulta para ver qué te conviene más. ¿Tenés receta oftalmológica actual?";
      }
      
      // Cualquier respuesta relacionada con experiencia
      if (mensaje.includes('uso') || mensaje.includes('experiencia') || mensaje.includes('actual') || 
          mensaje.includes('habitual') || mensaje.includes('ya')) {
        return "¡Bien! ¿Qué marca usás actualmente? Así vemos si tenemos.";
      }
      
      // Si no entendió pero estamos en tema lentes de contacto
      return "¿Te interesa probar alguna marca o necesitás más información sobre lentes de contacto?";
    
    case 'liquidos':
      // Cualquier respuesta relacionada con recomendación
      if (mensaje.includes('recomenda') || mensaje.includes('suger') || mensaje.includes('consejo')) {
        return "🧴 Te recomiendo Renu para sensibilidad o Opti-Free para uso diario. ¿Qué tipo de lente usás?";
      }
      
      // Cualquier mención a marcas
      if (mensaje.includes('renu') || mensaje.includes('opti') || mensaje.includes('biotrue')) {
        return `✅ Tenemos ${mensaje.includes('renu') ? 'Renu' : mensaje.includes('opti') ? 'Opti-Free' : 'BioTrue'}. ¿Te interesa?`;
      }
      
      return "¿Qué marca de líquido te interesa o querés una recomendación?";
    
    case 'obra_social':
      // Cualquier mención a obras sociales específicas
      if (mensaje.includes('medicus') || mensaje.includes('swiss') || mensaje.includes('osetya') || mensaje.includes('construir')) {
        return `✅ Sí, trabajamos con ${mensaje.includes('medicus') ? 'Medicus' : mensaje.includes('swiss') ? 'Swiss Medical' : mensaje.includes('osetya') ? 'Osetya' : 'Construir Salud'}. ¿Tenés la receta?`;
      }
      
      return "¿Tenés alguna obra social en mente o te cuento los requisitos?";
    
    default:
      // 🎯 RESPUESTA INTELIGENTE POR DEFECTO
      if (mensaje.length < 3) {
        return "¿Decís? No te entendí bien 😅";
      }
      
      if (mensaje.includes('?') || mensaje.includes('que') || mensaje.includes('qué')) {
        return "🤔 No estoy segura de entender tu pregunta. ¿Podés reformularla?";
      }
      
      return "¿Necesitás que te ayude con algo más específico?";
  }
}
  // ==================== RESPUESTAS SIMPLES UNIVERSALES ====================
  if (this.esRespuestaSimpleSi(mensajeLower)) {
    switch (ultimoTema) {
      case 'lentes_contacto':
        return "¡Bien! ¿Qué marca usás actualmente?";
      case 'obra_social':
        return "Perfecto 😊 ¿Tenés la receta? La vigencia es de 60 días.";
      case 'liquidos':
        return "¿Qué marca de líquido usás?";
      case 'marca':
        return "¿Te interesa algún modelo en particular?";
      case 'precio':
        return "¿De qué producto querés saber el precio exacto?";
      default:
        return "¿En qué más te puedo ayudar?";
    }
  }
  
  if (this.esRespuestaSimpleNo(mensajeLower)) {
    switch (ultimoTema) {
      case 'lentes_contacto':
        return "¡Genial! Te recomiendo empezar con una consulta. ¿Tenés receta oftalmológica?";
      case 'obra_social':
        return "¿Te interesa saber sobre precios particulares?";
      case 'liquidos':
        return "¿Querés que te recomiende alguna marca?";
      case 'marca':
        return "¿Te ayudo a encontrar alguna marca que te guste?";
      default:
        return "¿Te ayudo con algo más?";
    }
  }

  // ==================== RESPUESTAS ESPECÍFICAS POR TEMA ====================
  switch (ultimoTema) {
    case 'lentes_contacto':
      return this.manejarRespuestaLentesContacto(mensajeLower, contexto);
    
    case 'liquidos':
      return this.manejarRespuestaLiquidos(mensajeLower, contexto);
    
    case 'obra_social':
      return this.manejarRespuestaObraSocial(mensajeLower, contexto);
    
    case 'marca':
      return this.manejarRespuestaMarca(mensajeLower, contexto);
    
    case 'precio':
      return this.manejarRespuestaPrecio(mensajeLower, contexto);
    
    case 'horario':
      return this.manejarRespuestaHorario(mensajeLower, contexto);
    
    case 'direccion':
      return this.manejarRespuestaDireccion(mensajeLower, contexto);
    
    default:
      return "¿Necesitás que te ayude con algo más?";
  }
}

// ==================== MANEJADORES ESPECÍFICOS COMPLETOS ====================

manejarRespuestaLentesContacto(mensaje, contexto) {
  // PRIMERA VEZ / EXPERIENCIA
  if (this.contieneAlguna(mensaje, ['primera vez', 'nunca use', 'nunca usé', 'empezar', 'iniciar', 'comenzar', 'nuevo'])) {
    return "🎯 Perfecto para primera vez! Te recomiendo una consulta. ¿Tenés receta oftalmológica actual?";
  }
  
  if (this.contieneAlguna(mensaje, ['ya uso', 'uso actual', 'actualmente', 'habitual', 'experiencia', 'experimentado'])) {
    return "¡Bien! ¿Qué marca usás actualmente?";
  }

  // MARCAS DE LENTES DE CONTACTO
  if (this.contieneAlguna(mensaje, ['acuvue', 'acuvue'])) {
    return "✅ Tenemos Acuvue. ¿Buscás los diarios, quincenales o mensuales?";
  }
  if (this.contieneAlguna(mensaje, ['biofinity', 'biofinity'])) {
    return "✅ Tenemos Biofinity. Son mensuales, muy cómodos. ¿Te interesan?";
  }
  if (this.contieneAlguna(mensaje, ['air optix', 'air optix'])) {
    return "✅ Tenemos Air Optix. ¿Para miopía, astigmatismo o presbicia?";
  }

  // TIPOS DE LENTES
  if (this.contieneAlguna(mensaje, ['diario', 'diarios', 'desechable', 'desechables'])) {
    return "📅 Los diarios son los más prácticos. No necesitan mantenimiento. ¿Para qué uso los querés?";
  }
  if (this.contieneAlguna(mensaje, ['mensual', 'mensuales', 'mensuales'])) {
    return "📅 Los mensuales son más económicos a largo plazo. ¿Ya usaste este tipo?";
  }
  if (this.contieneAlguna(mensaje, ['anual', 'anuales'])) {
    return "📅 Los anuales casi no se usan hoy. Te recomiendo mensuales que son más seguros. ¿Te sirve?";
  }

  // PROBLEMAS ESPECÍFICOS
  if (this.contieneAlguna(mensaje, ['miopia', 'miopía', 'corto vista'])) {
    return "👁️ Para miopía tenemos varias opciones. ¿Tenés el valor de la receta?";
  }
  if (this.contieneAlguna(mensaje, ['astigmatismo', 'astigmatismo'])) {
    return "👁️ Para astigmatismo también hay lentes especiales. ¿Sabés tu medida?";
  }
  if (this.contieneAlguna(mensaje, ['ojo seco', 'sequedad', 'secos'])) {
    return "💧 Para ojos secos recomiendo los diarios o marcas específicas. ¿Sufrís de sequedad?";
  }

  // CONSULTA MÉDICA
  if (this.contieneAlguna(mensaje, ['receta', 'oftalmólogo', 'oftalmologo', 'médico', 'medico'])) {
    return "📄 Si tenés receta, traela. La vigencia es de 6 meses para lentes de contacto. ¿La tenés?";
  }

  // PRECIOS
  if (this.contieneAlguna(mensaje, ['precio', 'cuesta', 'valor', 'cuanto'])) {
    return "💲 Los precios varían según marca y tipo. ¿Te interesa alguna en particular?";
  }

  return "¿Te interesa probar alguna marca o necesitás más información?";
}

manejarRespuestaLiquidos(mensaje, contexto) {
  // RECOMENDACIONES
  if (this.contieneAlguna(mensaje, ['recomenda', 'sugerí', 'sugiere', 'recomiendas', 'recomendación'])) {
    return "🧴 Te recomiendo Renu para sensibilidad o Opti-Free para uso diario. ¿Qué tipo de lente usás?";
  }

  // MARCAS ESPECÍFICAS
  if (this.contieneAlguna(mensaje, ['renu', 'renu'])) {
    return "✅ Tenemos Renu. ¿El de 300ml o 360ml?";
  }
  if (this.contieneAlguna(mensaje, ['opti-free', 'optifree'])) {
    return "✅ Tenemos Opti-Free. ¿Express o Puremoist?";
  }
  if (this.contieneAlguna(mensaje, ['biotrue', 'bio true'])) {
    return "✅ Tenemos BioTrue. Es muy suave con los ojos sensibles. ¿Te interesa?";
  }

  // TAMAÑOS
  if (this.contieneAlguna(mensaje, ['chico', 'pequeño', '60ml', '120ml'])) {
    return "📏 Para probar o viajar, tenemos de 60ml y 120ml. ¿Para qué lo necesitás?";
  }
  if (this.contieneAlguna(mensaje, ['grande', '360ml', '300ml', 'economico', 'económico'])) {
    return "📏 El de 360ml rinde más y es más económico. ¿Usás lentes a diario?";
  }

  // TIPOS DE LENTE
  if (this.contieneAlguna(mensaje, ['diario', 'diarios'])) {
    return "📅 Para diarios podés usar cualquier líquido, pero Renu va muy bien. ¿Te sirve?";
  }
  if (this.contieneAlguna(mensaje, ['mensual', 'mensuales'])) {
    return "📅 Para mensuales recomiendo Opti-Free que limpia más en profundidad. ¿Usás mensuales?";
  }

  // PROBLEMAS ESPECÍFICOS
  if (this.contieneAlguna(mensaje, ['sensibl', 'sensibilidad', 'alergia'])) {
    return "🌿 Para sensibilidad, BioTrue o Renu Sensitive. ¿Tenés los ojos sensibles?";
  }
  if (this.contieneAlguna(mensaje, ['sequedad', 'seco', 'hidratación'])) {
    return "💧 Para sequedad, Opti-Free Puremoist tiene extra hidratación. ¿Te sirve?";
  }

  return "¿Qué marca de líquido te interesa o querés una recomendación?";
}

manejarRespuestaObraSocial(mensaje, contexto) {
  // OBRAS SOCIALES ESPECÍFICAS
  if (this.contieneAlguna(mensaje, ['medicus', 'medicus'])) {
    return "✅ Sí, trabajamos con Medicus. ¿Tenés la receta? La vigencia es de 60 días.";
  }
  if (this.contieneAlguna(mensaje, ['swiss', 'swiss medical'])) {
    return "✅ Sí, trabajamos con Swiss Medical. ¿Traés receta y credencial?";
  }
  if (this.contieneAlguna(mensaje, ['osetya', 'osetya'])) {
    return "✅ Sí, trabajamos con Osetya. ¿La receta tiene menos de 60 días?";
  }
  if (this.contieneAlguna(mensaje, ['construir', 'construir salud'])) {
    return "✅ Sí, trabajamos con Construir Salud. ¿Tenés toda la documentación?";
  }

  // DOCUMENTACIÓN
  if (this.contieneAlguna(mensaje, ['receta', 'documento', 'documentación', 'papeles'])) {
    return "📋 Necesitás receta específica, credencial y DNI. ¿Todo al día?";
  }

  // VIGENCIA
  if (this.contieneAlguna(mensaje, ['vigencia', '60 días', '60 dias', 'caduca', 'venc'])) {
    return "⏰ La receta vale 60 días desde la emisión. ¿La tuya está en fecha?";
  }

  // TURNOS Y PROCESOS
  if (this.contieneAlguna(mensaje, ['turno', 'cita', 'consulta', 'visita'])) {
    return "📅 Podés venir directamente. Traé receta, credencial y DNI. ¿Qué día te viene bien?";
  }

  return "¿Tenés alguna obra social en particular o te cuento los requisitos?";
}

manejarRespuestaMarca(mensaje, contexto) {
  // MARCAS DE ARMAZONES
  if (this.contieneAlguna(mensaje, ['ray-ban', 'rayban', 'ray ban'])) {
    return "😎 Ray-Ban tenemos varios modelos. ¿Aviator, Wayfarer o Clubmaster?";
  }
  if (this.contieneAlguna(mensaje, ['oakley', 'oakley'])) {
    return "🚴 Oakley ideal para deporte. ¿Holbrook, Frogskins o algo más deportivo?";
  }
  if (this.contieneAlguna(mensaje, ['vulk', 'vulk'])) {
    return "👓 Vulk tenemos opciones económicas y lindas. ¿Para hombre o mujer?";
  }

  // ESTILOS
  if (this.contieneAlguna(mensaje, ['aviator', 'aviador'])) {
    return "✈️ Aviator clásico de metal. ¿Oro, plata o negro?";
  }
  if (this.contieneAlguna(mensaje, ['wayfarer', 'cuadrado'])) {
    return "🕶️ Wayfarer estilo clásico. ¿Negro, tortoise o color?";
  }
  if (this.contieneAlguna(mensaje, ['redondo', 'circular', 'john lennon'])) {
    return "● Redondos muy de moda. ¿Metal o acetato?";
  }

  return "¿Te gusta algún estilo en particular o te ayudo a elegir?";
}

manejarRespuestaPrecio(mensaje, contexto) {
  // PRODUCTOS ESPECÍFICOS
  if (this.contieneAlguna(mensaje, ['armazon', 'armazón', 'marco', 'montura'])) {
    return "👓 Armazones desde $55.000. ¿Buscás alguna marca en particular?";
  }
  if (this.contieneAlguna(mensaje, ['lente contacto', 'lentilla', 'contacto'])) {
    return "👁️ Lentes de contacto desde $5.000 el par. ¿Diarios o mensuales?";
  }
  if (this.contieneAlguna(mensaje, ['liquido', 'solución'])) {
    return "🧴 Líquidos desde $3.000. ¿Qué marca te interesa?";
  }

  // PROMOCIONES
  if (this.contieneAlguna(mensaje, ['promo', 'promoción', 'oferta', 'descuento'])) {
    return "🎉 3 cuotas sin interés desde $100.000 y 10% en efectivo. ¿Te sirve?";
  }

  return "¿De qué producto querés saber el precio exacto?";
}

manejarRespuestaHorario(mensaje, contexto) {
  if (this.contieneAlguna(mensaje, ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'])) {
    return "✅ Abrimos todos los días de 10:30 a 19:30. ¿Qué día pensás venir?";
  }
  if (this.contieneAlguna(mensaje, ['finde', 'fin de semana', 'sábado', 'sabado'])) {
    return "✅ Los sábados también de 10:30 a 19:30. ¿Te viene bien el sábado?";
  }
  return "⏰ Abrimos de lunes a sábado de 10:30 a 19:30. ¿Te sirve algún día?";
}

manejarRespuestaDireccion(mensaje, contexto) {
  if (this.contieneAlguna(mensaje, ['subte', 'colectivo', 'bondi', 'transporte'])) {
    return "🚇 Estamos a 4 cuadras de Ángel Gallardo (subte B). Colectivos: 109, 110, 112.";
  }
  if (this.contieneAlguna(mensaje, ['estacionamiento', 'auto', 'coche', 'aparcar'])) {
    return "🚗 Hay estacionamiento en la zona. A veces se consigue en la misma calle.";
  }
  return "📍 Serrano 684, Villa Crespo. ¿Necesitás indicaciones de cómo llegar?";
}

// ==================== UTILIDADES ====================

esRespuestaSimpleSi(mensaje) {
  return this.contieneAlguna(mensaje, ['si', 'sí', 'si.', 'sí.', 'claro', 'por supuesto', 'obvio', 'dale']);
}

esRespuestaSimpleNo(mensaje) {
  return this.contieneAlguna(mensaje, ['no', 'no.', 'todavía no', 'aún no', 'aun no', 'nop']);
}

contieneAlguna(mensaje, palabras) {
  return palabras.some(palabra => mensaje.includes(palabra));
}

  respuestaNoEntendido() {
    return "🤔 No te entendí bien. ¿Podés decirlo de otra forma?";
  }
}
// ==================== SERVICIOS EXTERNOS ====================
// (Por ahora vacíos - los agregaremos después con Google Sheets)
class MemoryService {
  constructor() {
    this.contextos = new Map();
  }

  obtenerContextoUsuario(userId) {
    if (!this.contextos.has(userId)) {
      this.contextos.set(userId, { paso: 0, historial: [] });
    }
    return this.contextos.get(userId);
  }

  guardarContextoUsuario(userId, contexto) {
    this.contextos.set(userId, contexto);
  }
}

// ==================== CONFIGURACIÓN EXPRESS ====================
const memoryService = new MemoryService();
const responseHandler = new ResponseHandler();

// ==================== RUTAS PRINCIPALES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    name: 'Luna - Hypnottica',
    service: 'Asistente Virtual Óptica',
    version: '1.0'
  });
});

// Página principal
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Hypnottica - Asistente Virtual</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 40px; 
            text-align: center; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            color: #333;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .status { 
            background: #d4edda; 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
            color: #155724;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #25D366;
            color: white;
            text-decoration: none;
            border-radius: 25px;
            margin: 10px;
            transition: background 0.3s;
          }
          .btn:hover {
            background: #128C7E;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 Hypnottica - Asistente Virtual</h1>
          <div class="status">
            <h2>✅ Servidor funcionando correctamente</h2>
            <p><strong>Nombre:</strong> Luna</p>
            <p><strong>Estado:</strong> Online</p>
            <p><strong>Modo:</strong> Autónomo - Datos integrados</p>
          </div>
          <p>
            <a href="/health" class="btn">Health Check</a>
            <a href="/probador" class="btn">Probador del Bot</a>
          </p>
          <p>✨ Asistente virtual completo listo para usar</p>
        </div>
      </body>
    </html>
  `);
});

// ==================== PROBADOR WEB INTERACTIVO ====================
app.get('/probador', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Probador Bot - Hypnottica</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                min-height: 100vh; 
                padding: 20px; 
            }
            .container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 20px; 
                box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
                overflow: hidden; 
            }
            .header { 
                background: linear-gradient(135deg, #25D366, #128C7E); 
                color: white; 
                padding: 30px; 
                text-align: center; 
            }
            .header h1 { font-size: 2.5em; margin-bottom: 10px; }
            .header p { opacity: 0.9; font-size: 1.1em; }
            .chat-container { 
                padding: 20px; 
                height: 500px; 
                overflow-y: auto; 
                border-bottom: 1px solid #eee; 
            }
            .message { 
                margin: 15px 0; 
                padding: 15px 20px; 
                border-radius: 20px; 
                max-width: 80%; 
                animation: fadeIn 0.3s ease-in; 
            }
            .user-message { 
                background: #25D366; 
                color: white; 
                margin-left: auto; 
                border-bottom-right-radius: 5px; 
            }
            .bot-message { 
                background: #f0f0f0; 
                color: #333; 
                margin-right: auto; 
                border-bottom-left-radius: 5px; 
                white-space: pre-line; 
            }
            .input-container { 
                padding: 20px; 
                display: flex; 
                gap: 10px; 
                background: #f8f9fa; 
            }
            .input-container input { 
                flex: 1; 
                padding: 15px 20px; 
                border: 2px solid #ddd; 
                border-radius: 25px; 
                font-size: 16px; 
                outline: none; 
                transition: border-color 0.3s; 
            }
            .input-container input:focus { border-color: #25D366; }
            .input-container button { 
                padding: 15px 25px; 
                background: #25D366; 
                color: white; 
                border: none; 
                border-radius: 25px; 
                cursor: pointer; 
                font-size: 16px; 
                font-weight: bold; 
                transition: background 0.3s; 
            }
            .input-container button:hover { background: #128C7E; }
            .quick-buttons { 
                padding: 15px 20px; 
                background: #f8f9fa; 
                border-top: 1px solid #eee; 
                display: flex; 
                flex-wrap: wrap; 
                gap: 10px; 
            }
            .quick-button { 
                padding: 10px 15px; 
                background: white; 
                border: 2px solid #25D366; 
                border-radius: 20px; 
                color: #25D366; 
                cursor: pointer; 
                font-size: 14px; 
                transition: all 0.3s; 
            }
            .quick-button:hover { 
                background: #25D366; 
                color: white; 
            }
            .status { 
                padding: 10px 20px; 
                background: #fff3cd; 
                border-left: 4px solid #ffc107; 
                margin: 10px 20px; 
                border-radius: 5px; 
                font-size: 14px; 
            }
            @keyframes fadeIn { 
                from { opacity: 0; transform: translateY(10px); } 
                to { opacity: 1; transform: translateY(0); } 
            }
            .typing-indicator { 
                display: inline-block; 
                padding: 10px 15px; 
                background: #f0f0f0; 
                border-radius: 15px; 
                color: #666; 
                font-style: italic; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 Luna - Probador</h1>
                <p>Asistente Virtual de Hypnottica</p>
            </div>
            
            <div class="status">
                💡 <strong>Tip:</strong> Probá consultas como "hola", "obras sociales", "precios", "lentes de contacto", etc.
            </div>
            
            <div class="chat-container" id="chatContainer">
                <div class="message bot-message">
                    👋 ¡Hola! Soy *Luna*, tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy?\n\n• 📦 Consultar stock\n• 💲 Precios y promociones\n• 🏥 Obras sociales\n• 👁️ Lentes de contacto\n• 📍 Ubicación y horarios\n• 🔧 Servicios técnicos
                </div>
            </div>
            
            <div class="quick-buttons" id="quickButtons">
                <div class="quick-button" onclick="sendQuickMessage('hola')">👋 Hola</div>
                <div class="quick-button" onclick="sendQuickMessage('que obras sociales aceptan')">🏥 Obras sociales</div>
                <div class="quick-button" onclick="sendQuickMessage('precios')">💲 Precios</div>
                <div class="quick-button" onclick="sendQuickMessage('marcas')">👓 Marcas</div>
                <div class="quick-button" onclick="sendQuickMessage('horarios')">⏰ Horarios</div>
                <div class="quick-button" onclick="sendQuickMessage('direccion')">📍 Dirección</div>
                <div class="quick-button" onclick="sendQuickMessage('lentes de contacto')">👁️ Lentes contacto</div>
                <div class="quick-button" onclick="sendQuickMessage('líquidos')">🧴 Líquidos</div>
            </div>
            
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Escribe tu mensaje..." onkeypress="handleKeyPress(event)">
                <button onclick="sendMessage()">Enviar</button>
            </div>
        </div>

        <script>
            function addMessage(message, isUser = false) {
                const chatContainer = document.getElementById('chatContainer');
                const messageDiv = document.createElement('div');
                messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
                messageDiv.innerHTML = message.replace(/\\n/g, '<br>');
                chatContainer.appendChild(messageDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            
            function showTyping() {
                const chatContainer = document.getElementById('chatContainer');
                const typingDiv = document.createElement('div');
                typingDiv.className = 'message bot-message';
                typingDiv.id = 'typingIndicator';
                typingDiv.innerHTML = '<span class="typing-indicator">Luna está escribiendo...</span>';
                chatContainer.appendChild(typingDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            
            function hideTyping() {
                const typingIndicator = document.getElementById('typingIndicator');
                if (typingIndicator) {
                    typingIndicator.remove();
                }
            }
            
            async function sendMessage() {
                const input = document.getElementById('messageInput');
                const message = input.value.trim();
                
                if (!message) return;
                
                addMessage(message, true);
                input.value = '';
                
                showTyping();
                
                try {
                    const response = await fetch('/probar-bot', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mensaje: message })
                    });
                    
                    const data = await response.json();
                    hideTyping();
                    
                    if (data.respuesta) {
                        addMessage(data.respuesta);
                    } else {
                        addMessage('❌ No se recibió respuesta');
                    }
                    
                } catch (error) {
                    hideTyping();
                    addMessage('❌ Error de conexión');
                    console.error('Error:', error);
                }
            }
            
            function sendQuickMessage(message) {
                document.getElementById('messageInput').value = message;
                sendMessage();
            }
            
            function handleKeyPress(event) {
                if (event.key === 'Enter') {
                    sendMessage();
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Ruta POST para el probador
app.post('/probar-bot', async (req, res) => {
  try {
    const { mensaje } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({ error: 'Falta el mensaje' });
    }
    
    console.log(`🧪 Probador - Mensaje: "${mensaje}"`);
    
    const senderId = 'web-user-' + Date.now();
    let contexto = memoryService.obtenerContextoUsuario(senderId);
    
    const respuesta = await responseHandler.generarRespuesta(mensaje, contexto);
    
    memoryService.guardarContextoUsuario(senderId, contexto);
    
    res.json({
      mensaje_original: mensaje,
      respuesta: respuesta,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en probador:', error);
    res.status(500).json({ 
      error: 'Error interno',
      respuesta: "❌ Error del servidor. Por favor, recargá la página."
    });
  }
});

// ==================== WEBHOOK PARA WHATSAPP (PARA EL FUTURO) ====================
app.post('/webhook', async (req, res) => {
  try {
    // Por ahora solo aceptamos mensajes pero no respondemos automáticamente
    // (esto se activará cuando conectemos WhatsApp Business API)
    console.log('📩 Webhook recibido (WhatsApp futuro)');
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.status(200).send('OK');
  }
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === 'hypnottica_token') {
    console.log('✅ Webhook verificado');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Error en verificación de webhook');
    res.sendStatus(403);
  }
});

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 Luna funcionando en puerto ${PORT}`);
  console.log(`🌐 Probador disponible en: http://localhost:${PORT}/probador`);
  console.log(`❤️  Health check en: http://localhost:${PORT}/health`);
});

module.exports = app;
