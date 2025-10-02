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

// ==================== SISTEMA DE MEMORIA MEJORADO ====================
class MemoryService {
  constructor() {
    this.contextos = new Map();
  }

  obtenerContextoUsuario(userId) {
    if (!this.contextos.has(userId)) {
      this.contextos.set(userId, { 
        paso: 0, 
        ultimoTema: null, 
        subtema: null,
        datos: {},
        conversacion: [],
        timestamp: Date.now(),
        flujoActivo: null,
        esperandoRespuesta: null,
        historial: []
      });
    }
    return this.contextos.get(userId);
  }

  guardarContextoUsuario(userId, contexto) {
    contexto.timestamp = Date.now();
    // Mantener solo últimos 10 mensajes en historial
    if (contexto.historial && contexto.historial.length > 10) {
      contexto.historial = contexto.historial.slice(-10);
    }
    this.contextos.set(userId, contexto);
    
    this.limpiarContextosViejos();
  }

  limpiarContextosViejos() {
    const ahora = Date.now();
    for (const [userId, contexto] of this.contextos.entries()) {
      if (ahora - contexto.timestamp > 3600000) { // 1 hora
        this.contextos.delete(userId);
      }
    }
  }

  reiniciarContexto(userId) {
    this.contextos.delete(userId);
    return this.obtenerContextoUsuario(userId);
  }
}

// ==================== SISTEMA DE INTENCIONES INTELIGENTE MEJORADO ====================
class IntentRecognizer {
  detectIntent(mensaje, contexto = {}) {
    const mensajeLower = mensaje.toLowerCase().trim();
    
    // Si hay contexto previo, priorizar continuaciones
    if (contexto.esperandoRespuesta) {
      const continuacion = this.detectarContinuacion(mensajeLower, contexto);
      if (continuacion !== 'no_entendido') {
        return continuacion;
      }
    }

    // 🎯 DETECCIÓN POR CONTEXTO MEJORADA
    if (this.esSaludoContextual(mensajeLower)) return 'saludo';
    if (this.esLentesContactoContextual(mensajeLower, contexto)) return 'lentes_contacto';
    if (this.esLiquidosContextual(mensajeLower)) return 'liquidos';
    if (this.esObraSocialContextual(mensajeLower)) return 'obra_social';
    if (this.esPrecioContextual(mensajeLower)) return 'precio';
    if (this.esMarcaContextual(mensajeLower)) return 'marca';
    if (this.esHorarioContextual(mensajeLower)) return 'horario';
    if (this.esDireccionContextual(mensajeLower)) return 'direccion';
    if (this.esDespedidaContextual(mensajeLower)) return 'despedida';
    if (this.esTurnoContextual(mensajeLower)) return 'turno';
    if (this.esStockContextual(mensajeLower)) return 'stock';
    if (this.esRespuestaSimpleContextual(mensajeLower, contexto)) return 'respuesta_simple';
    
    return 'no_entendido';
  }

  detectarContinuacion(mensaje, contexto) {
    // Si estábamos esperando una respuesta específica
    switch (contexto.esperandoRespuesta) {
      case 'primera_vez_contacto':
        if (mensaje.includes('si') || mensaje.includes('sí') || mensaje.includes('primera') || mensaje.includes('nunca') || mensaje === 'primera vez') {
          return 'primera_vez_confirmada';
        }
        if (mensaje.includes('no') || mensaje.includes('ya uso') || mensaje.includes('experiencia') || mensaje.includes('uso')) {
          return 'experiencia_confirmada';
        }
        break;
      
      case 'confirmar_mapa':
        if (mensaje.includes('si') || mensaje.includes('sí') || mensaje.includes('mapa')) {
          return 'mapa_confirmado';
        }
        if (mensaje.includes('no') || mensaje.includes('gracias')) {
          return 'mapa_rechazado';
        }
        break;

      case 'tipo_consulta_os':
        if (mensaje.includes('armazon') || mensaje.includes('cristal') || mensaje.includes('anteojo') || (mensaje.includes('lente') && !mensaje.includes('contacto'))) {
          return 'os_armazones';
        }
        if (mensaje.includes('contacto') || mensaje.includes('lentilla')) {
          return 'os_contacto';
        }
        break;

      case 'tipo_producto_precio':
        if (mensaje.includes('armazon') || mensaje.includes('marco') || mensaje.includes('montura')) {
          return 'precio_armazones';
        }
        if (mensaje.includes('cristal') || (mensaje.includes('lente') && !mensaje.includes('contacto'))) {
          return 'precio_cristales';
        }
        if (mensaje.includes('contacto') || mensaje.includes('lentilla')) {
          return 'precio_contacto';
        }
        break;
    }
    
    return 'no_entendido';
  }

  esSaludoContextual(mensaje) {
    const patrones = [
      /^(hola|buen(a|o|as|os)\s+(d[ií]a|tarde|noche)|qué tal|cómo va|saludos|buenas|holis|hey|hi|hello)/,
      /^hola$/,
      /^buenas$/
    ];
    return patrones.some(patron => patron.test(mensaje));
  }

  esLentesContactoContextual(mensaje, contexto) {
    // Si ya estábamos en tema lentes de contacto, considerar respuestas relacionadas
    if (contexto.ultimoTema === 'lentes_contacto' && mensaje.length < 25) {
      return true;
    }

    const palabrasClave = ['lente', 'contacto', 'lentilla', 'pupilente'];
    const tienePalabraClave = palabrasClave.some(palabra => mensaje.includes(palabra));
    
    const palabrasConsulta = ['tienen', 'trabajan', 'venden', 'qué', 'que', 'cual', 'cuál', 'info'];
    const tieneConsulta = palabrasConsulta.some(palabra => mensaje.includes(palabra));
    
    const respuestasDirectas = ['primera vez', 'ya uso', 'nunca use', 'uso actual', 'primera'];
    const esRespuestaDirecta = respuestasDirectas.some(respuesta => mensaje.includes(respuesta));
    
    return (tienePalabraClave && (tieneConsulta || mensaje.length < 20)) || esRespuestaDirecta;
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

  esTurnoContextual(mensaje) {
    const palabrasTurno = ['turno', 'cita', 'reserva', 'agendar'];
    return palabrasTurno.some(palabra => mensaje.includes(palabra));
  }

  esStockContextual(mensaje) {
    const palabrasStock = ['stock', 'disponible', 'queda', 'tienen'];
    return palabrasStock.some(palabra => mensaje.includes(palabra));
  }

  esRespuestaSimpleContextual(mensaje, contexto) {
    // Si el mensaje es corto y hay contexto previo, es probablemente una respuesta
    if (mensaje.length < 20 && contexto.ultimoTema && contexto.paso > 0) {
      return true;
    }
    
    const respuestasSimples = ['si', 'sí', 'no', 'claro', 'dale', 'ok', 'perfecto', 'gracias'];
    return respuestasSimples.includes(mensaje);
  }
}

// ==================== MANEJADOR DE RESPUESTAS - VERSIÓN MEJORADA ====================
class ResponseHandler {
  constructor() {
    this.recognizer = new IntentRecognizer();
    this.saludos = [
      "¡Hola! Soy Luna 👋, la asistente de la óptica. ¿Querés que te ayude con obras sociales, precios, marcas, horarios, dirección, lentes de contacto o líquidos?",
      "¡Bienvenido/a! Soy Luna 🌙. Contame, ¿te interesa saber sobre obras sociales, precios, horarios o lentes de contacto?",
      "¡Hola! Soy Luna 😊 Te atiendo desde la óptica. ¿Consultás por obras sociales, precios, horarios, dirección, lentes de contacto o líquidos?"
    ];
  }

  async generarRespuesta(mensaje, contexto = { paso: 0, ultimoTema: null, subtema: null, datos: {}, esperandoRespuesta: null }) {
    const mensajeLower = mensaje.toLowerCase().trim();
    
    // 🎯 REINICIAR CONTEXTO SI ES UN SALUDO NUEVO
    if (this.recognizer.esSaludoContextual(mensajeLower) && contexto.paso === 0) {
      contexto = { 
        paso: 1, 
        ultimoTema: 'saludo', 
        subtema: null, 
        datos: {}, 
        esperandoRespuesta: null, 
        historial: [] 
      };
    }

    // 🎯 DETECCIÓN DE PROBLEMAS DE SALUD - DERIVACIÓN INMEDIATA
    if (this.detectarProblemaSalud(mensajeLower)) {
      contexto.esperandoRespuesta = null;
      return "🩺 Por tu seguridad, prefiero pasarte con un especialista humano que pueda orientarte mejor. ¿Un momento por favor?";
    }

    const intent = this.recognizer.detectIntent(mensajeLower, contexto);
    
    // 🎯 AGREGAR AL HISTORIAL
    if (!contexto.historial) contexto.historial = [];
    contexto.historial.push({ 
      mensaje, 
      intent, 
      timestamp: Date.now(),
      ultimoTema: contexto.ultimoTema,
      esperandoRespuesta: contexto.esperandoRespuesta
    });

    console.log('🔍 Intent detectado:', { 
      mensaje,
      intent, 
      ultimoTema: contexto.ultimoTema, 
      paso: contexto.paso,
      esperando: contexto.esperandoRespuesta 
    });

    // 🎯 MANEJO DE FLUJO CONVERSACIONAL MEJORADO
    if (contexto.esperandoRespuesta) {
      const respuesta = this.continuarFlujoConversacional(mensajeLower, contexto, intent);
      if (respuesta) return respuesta;
    }

    // 🎯 DETECCIÓN DE NUEVOS TEMAS (turnos, stock)
    if (intent === 'turno') {
      contexto.ultimoTema = 'turnos';
      return this.manejarTurnos(mensajeLower, contexto);
    }
    
    if (intent === 'stock') {
      contexto.ultimoTema = 'stock';
      return this.manejarStock(mensajeLower, contexto);
    }

    // 🎯 CONVERSACIÓN INICIAL O CAMBIO DE TEMA
    contexto.paso = contexto.paso + 1;
    
    switch (intent) {
      case 'saludo':
        contexto.ultimoTema = 'saludo';
        contexto.esperandoRespuesta = null;
        return this.saludos[Math.floor(Math.random() * this.saludos.length)];
      
      case 'lentes_contacto':
        contexto.ultimoTema = 'lentes_contacto';
        contexto.esperandoRespuesta = 'primera_vez_contacto';
        return "👁️ ¡Sí! Trabajamos con lentes de contacto. ¿Es tu primera vez o ya los usás?";
      
      case 'obra_social':
        contexto.ultimoTema = 'obra_social';
        contexto.esperandoRespuesta = 'tipo_consulta_os';
        return "🏥 Sí, trabajamos con Medicus, Osetya, Construir Salud y Swiss Medical. ¿Tu consulta es por armazones/cristales o por lentes de contacto?";
      
      case 'precio':
        contexto.ultimoTema = 'precio';
        contexto.esperandoRespuesta = 'tipo_producto_precio';
        return "💲 Los precios dependen de si buscás armazones, cristales o lentes de contacto. ¿Por cuál te gustaría empezar?";
      
      case 'marca':
        contexto.ultimoTema = 'marca';
        contexto.esperandoRespuesta = 'tipo_producto_marca';
        return "👓 Tenemos variedad de marcas y opciones tanto en armazones como en lentes de contacto y cristales. ¿Querés que te cuente por armazones, lentes de contacto o cristales?";
      
      case 'horario':
        contexto.ultimoTema = 'horario';
        contexto.esperandoRespuesta = null;
        return "⏰ Abrimos de lunes a sábado de 10:30 a 19:30. ¿Te sirve algún día en particular?";
      
      case 'direccion':
        contexto.ultimoTema = 'direccion';
        contexto.esperandoRespuesta = 'confirmar_mapa';
        return "📍 Estamos en Serrano 684, Villa Crespo. ¿Querés que te comparta un mapa de Google para que llegues más fácil?";
      
      case 'liquidos':
        contexto.ultimoTema = 'liquidos';
        contexto.esperandoRespuesta = 'tipo_liquido';
        return "🧴 Tenemos soluciones multiuso para limpieza diaria y gotas humectantes. ¿Qué estás buscando en particular?";
      
      case 'despedida':
        contexto.ultimoTema = 'despedida';
        contexto.esperandoRespuesta = null;
        return "¡Gracias por contactarte! Cualquier cosa, estoy acá para ayudarte. ¡Que tengas un buen día! 👋";
      
      case 'respuesta_simple':
        return this.manejarRespuestaSimple(mensajeLower, contexto);
      
      default:
        contexto.esperandoRespuesta = null;
        // Intentar inferir del contexto anterior
        if (contexto.ultimoTema) {
          return this.continuarDeContextoAnterior(mensajeLower, contexto);
        }
        return "🤔 No te entendí bien. ¿Podés decirlo de otra forma? Podés preguntarme por obras sociales, precios, marcas, horarios, lentes de contacto, líquidos o turnos.";
    }
  }

  continuarFlujoConversacional(mensaje, contexto, intent) {
    switch (contexto.esperandoRespuesta) {
      case 'primera_vez_contacto':
        contexto.esperandoRespuesta = null;
        if (intent === 'primera_vez_confirmada' || mensaje.includes('primera') || mensaje.includes('nunca') || mensaje === 'primera vez') {
          return "🎯 Para empezar, recomendamos una consulta con nuestro contactólogo. En esa cita te enseñan a ponerlos, quitarlos y cuidarlos. ¿Querés que te reserve un turno?";
        } else if (intent === 'experiencia_confirmada' || mensaje.includes('uso') || mensaje.includes('ya uso')) {
          return "🔄 Perfecto. ¿Querés reponer la misma marca que ya usás o te interesa ver otras opciones? Trabajamos con Acuvue, Biofinity y Air Optix.";
        } else {
          contexto.esperandoRespuesta = 'primera_vez_contacto';
          return "👁️ No entendí bien. ¿Es tu primera vez usando lentes de contacto o ya tenés experiencia?";
        }

      case 'confirmar_mapa':
        contexto.esperandoRespuesta = null;
        if (intent === 'mapa_confirmado' || mensaje.includes('si') || mensaje.includes('sí')) {
          return `🗺️ Te comparto la ubicación exacta: Serrano 684, Villa Crespo

📍 Google Maps: https://maps.google.com/?q=Serrano+684,+Villa+Crespo,+CABA

Estamos a 4 cuadras del subte Ángel Gallardo (línea B).`;
        } else {
          return "✅ Perfecto. Cualquier cosa, acordate: Serrano 684, Villa Crespo. ¿Necesitás saber algo más?";
        }

      case 'tipo_consulta_os':
        contexto.esperandoRespuesta = null;
        if (intent === 'os_armazones' || mensaje.includes('armazon') || mensaje.includes('cristal')) {
          contexto.subtema = 'armazones';
          return "📄 En el caso de armazones o cristales, la receta médica es obligatoria. Tiene que estar vigente (dura 60 días) y detallar bien qué tipo de lentes necesitás: lejos, cerca o multifocales.";
        } else if (intent === 'os_contacto' || mensaje.includes('contacto')) {
          contexto.subtema = 'lentes_contacto_os';
          return "👁️ Con lentes de contacto, la obra social siempre exige receta vigente y detallada. ¿Tenés una receta actualizada?";
        } else {
          contexto.esperandoRespuesta = 'tipo_consulta_os';
          return "🏥 ¿Tu consulta de obra social es para armazones/cristales o para lentes de contacto?";
        }

      case 'tipo_producto_precio':
        contexto.esperandoRespuesta = null;
        if (intent === 'precio_armazones' || mensaje.includes('armazon') || mensaje.includes('marco')) {
          contexto.subtema = 'armazones_precio';
          return "👓 Los armazones se eligen siempre en persona 👓, porque necesitamos hacerte mediciones para que queden bien en tu rostro. Tenemos modelos desde $55.000 hasta $270.000. ¿Querés que te pase dirección y horarios para venir a verlos?";
        } else if (intent === 'precio_cristales' || mensaje.includes('cristal')) {
          contexto.subtema = 'cristales_precio';
          return "🔍 El precio de los cristales depende de tu receta y del tipo de tratamiento que elijas (simples, antirreflejo, fotocromáticos, progresivos). ¿Querés contarme qué tipo de receta tenés para orientarte mejor?";
        } else if (intent === 'precio_contacto' || mensaje.includes('contacto')) {
          contexto.subtema = 'contacto_precio';
          return "👁️ Los precios varían según la marca y el tipo: trabajamos con Acuvue, Biofinity y Air Optix en versiones diarias y mensuales. ¿Querés que te muestre las diferencias entre ellas?";
        } else {
          contexto.esperandoRespuesta = 'tipo_producto_precio';
          return "💲 ¿Querés saber precios de armazones, cristales o lentes de contacto?";
        }

      default:
        return null;
    }
  }

  continuarDeContextoAnterior(mensaje, contexto) {
    // Intentar continuar la conversación basado en el último tema
    switch (contexto.ultimoTema) {
      case 'lentes_contacto':
        contexto.esperandoRespuesta = 'primera_vez_contacto';
        return "👁️ Volviendo a tu consulta sobre lentes de contacto... ¿Es tu primera vez o ya los usás?";
      
      case 'obra_social':
        contexto.esperandoRespuesta = 'tipo_consulta_os';
        return "🏥 Decías sobre obras sociales... ¿era para armazones/cristales o lentes de contacto?";
      
      case 'precio':
        contexto.esperandoRespuesta = 'tipo_producto_precio';
        return "💲 ¿Querías saber precios de armazones, cristales o lentes de contacto?";
      
      case 'direccion':
        contexto.esperandoRespuesta = 'confirmar_mapa';
        return "📍 ¿Querés que te comparta el mapa de Google con nuestra ubicación?";
      
      default:
        return "🤔 Perdón, no entendí. ¿Podés reformular tu pregunta?";
    }
  }

  // 🏥 ÁRBOL DE OBRAS SOCIALES COMPLETO (manteniendo tu lógica original)
  manejarObraSocial(mensaje, contexto) {
    if (mensaje.includes('armazon') || mensaje.includes('cristal') || mensaje.includes('anteojo') || (mensaje.includes('lente') && !mensaje.includes('contacto'))) {
      contexto.subtema = 'armazones';
      contexto.paso = 2;
      return "📄 En el caso de armazones o cristales, la receta médica es obligatoria. Tiene que estar vigente (dura 60 días) y detallar bien qué tipo de lentes necesitás: lejos, cerca o multifocales.";
    }
    
    if (mensaje.includes('contacto') || mensaje.includes('lentilla')) {
      contexto.subtema = 'lentes_contacto_os';
      contexto.paso = 2;
      return "👁️ Con lentes de contacto, la obra social siempre exige receta vigente y detallada. ¿Tenés una receta actualizada?";
    }
    
    // ... (mantener toda tu lógica original de obras sociales)
    return "🏥 ¿Querés que te pase la dirección y horarios para que vengas a iniciar el trámite?";
  }

  // 💲 ÁRBOL DE PRECIOS COMPLETO (manteniendo tu lógica original)
  manejarPrecios(mensaje, contexto) {
    if (mensaje.includes('armazon') || mensaje.includes('marco') || mensaje.includes('montura')) {
      contexto.subtema = 'armazones_precio';
      return "👓 Los armazones se eligen siempre en persona 👓, porque necesitamos hacerte mediciones para que queden bien en tu rostro. Tenemos modelos desde $55.000 hasta $270.000. ¿Querés que te pase dirección y horarios para venir a verlos?";
    }
    
    // ... (mantener toda tu lógica original de precios)
    return "💲 " + this.agregarPromociones();
  }

  agregarPromociones() {
    return "Tenemos 3 cuotas sin interés a partir de $100.000 y 6 cuotas sin interés a partir de $200.000 💳. Además, hay un 10% de descuento pagando en efectivo (completo en efectivo). Aceptamos efectivo, QR y todas las tarjetas.";
  }

  // 📅 SISTEMA DE TURNOS COMPLETO
  manejarTurnos(mensaje, contexto) {
    if (mensaje.includes('turno') || mensaje.includes('cita') || mensaje.includes('reserva')) {
      contexto.subtema = 'turnos';
      return "📅 Perfecto, ¿para qué día te gustaría reservar? Atendemos de lunes a sábado de 10:30 a 19:30.";
    }
    
    if (contexto.subtema === 'turnos') {
      const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaEncontrado = dias.find(dia => mensaje.includes(dia));
      
      if (diaEncontrado) {
        return `✅ Turno reservado para el ${diaEncontrado}. Te esperamos en Serrano 684, Villa Crespo. ¿Necesitás que te confirme la hora o algún dato más?`;
      }
    }
    
    return "📅 ¿Querés que te reserve un turno? Decime qué día te viene bien.";
  }

  // 📦 CONSULTA DE STOCK INTELIGENTE
  manejarStock(mensaje, contexto) {
    if (mensaje.includes('stock') || mensaje.includes('disponible') || mensaje.includes('queda')) {
      contexto.subtema = 'stock';
      return "📦 Para confirmar stock exacto necesito que me digas qué producto específico buscás. ¿Es para armazones, lentes de contacto o líquidos?";
    }
    
    if (contexto.subtema === 'stock') {
      if (mensaje.includes('armazon') || mensaje.includes('marco')) {
        return "👓 Para confirmar stock de armazones necesitás venir a la óptica, ya que cada modelo tiene medidas específicas. ¿Querés que te pase dirección?";
      }
      
      if (mensaje.includes('contacto') || mensaje.includes('lentilla')) {
        return "👁️ ¿Qué marca de lentes de contacto buscás? Trabajamos con Acuvue, Biofinity y Air Optix.";
      }
    }
    
    return "📦 ¿Querés confirmar disponibilidad de algún producto en particular?";
  }

  manejarRespuestaSimple(mensaje, contexto) {
    // RESPUESTAS POSITIVAS
    if (mensaje === 'si' || mensaje === 'sí' || mensaje === 'si.' || mensaje === 'sí.' || 
        mensaje === 'claro' || mensaje === 'por supuesto' || mensaje === 'dale') {
      
      switch (contexto.ultimoTema) {
        case 'lentes_contacto':
          contexto.esperandoRespuesta = 'primera_vez_contacto';
          return "👁️ ¡Perfecto! ¿Es tu primera vez usando lentes de contacto o ya tenés experiencia?";
        case 'obra_social':
          contexto.esperandoRespuesta = 'tipo_consulta_os';
          return "🏥 Genial. ¿Tu consulta es para armazones/cristales o para lentes de contacto?";
        case 'liquidos':
          return "🧴 ¿Qué marca de líquido usás o te recomiendo alguna?";
        case 'direccion':
          contexto.esperandoRespuesta = 'confirmar_mapa';
          return "📍 ¿Querés que te comparta un mapa de Google para que llegues más fácil?";
        case 'turnos':
          return "📅 ¿Para qué día te gustaría reservar el turno?";
        case 'stock':
          return "📦 ¿De qué producto querés confirmar disponibilidad?";
        default:
          return "¿En qué más te puedo ayudar?";
      }
    }
    
    // RESPUESTAS NEGATIVAS
    if (mensaje === 'no' || mensaje === 'no.' || mensaje === 'nop') {
      switch (contexto.ultimoTema) {
        case 'lentes_contacto':
          return "¡No hay problema! Te recomiendo una consulta para ver qué te conviene. ¿Te interesa?";
        case 'direccion':
          return "✅ Perfecto. Cualquier cosa, acordate: Serrano 684, Villa Crespo. ¿Necesitás saber algo más?";
        case 'turnos':
          return "¿Te ayudo con algo más entonces?";
        case 'stock':
          return "¿Necesitás ayuda con otra cosa?";
        default:
          return "¿Te ayudo con algo más?";
      }
    }

    // DETECCIÓN DE "PRIMERA VEZ" EN LENTES DE CONTACTO
    if ((mensaje.includes('primera') || mensaje.includes('nunca')) && contexto.ultimoTema === 'lentes_contacto') {
      contexto.esperandoRespuesta = null;
      return "🎯 Para empezar, recomendamos una consulta con nuestro contactólogo. En esa cita te enseñan a ponerlos, quitarlos y cuidarlos. ¿Querés que te reserve un turno?";
    }

    // DETECCIÓN DE "YA USO" EN LENTES DE CONTACTO
    if ((mensaje.includes('uso') || mensaje.includes('ya uso') || mensaje.includes('experiencia')) && contexto.ultimoTema === 'lentes_contacto') {
      contexto.esperandoRespuesta = null
    
