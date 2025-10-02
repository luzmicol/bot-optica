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
// ==================== MANEJADOR DE RESPUESTAS - VERSIÓN DEFINITIVA ====================
class ResponseHandler {
  constructor() {
    this.recognizer = new IntentRecognizer();
    this.saludos = [
      "¡Hola! Soy Luna 👋, la asistente de la óptica. ¿Querés que te ayude con obras sociales, precios, marcas, horarios, dirección, lentes de contacto o líquidos?",
      "¡Bienvenido/a! Soy Luna 🌙. Contame, ¿te interesa saber sobre obras sociales, precios, horarios o lentes de contacto?",
      "¡Hola! Soy Luna 😊 Te atiendo desde la óptica. ¿Consultás por obras sociales, precios, horarios, dirección, lentes de contacto o líquidos?"
    ];
  }

  async generarRespuesta(mensaje, contexto = { paso: 0, ultimoTema: null, subtema: null, datos: {} }) {
    const intent = this.recognizer.detectIntent(mensaje);
    const mensajeLower = mensaje.toLowerCase();
    
    // 🎯 DETECCIÓN DE PROBLEMAS DE SALUD - DERIVACIÓN INMEDIATA
    if (this.detectarProblemaSalud(mensajeLower)) {
      return "🩺 Por tu seguridad, prefiero pasarte con un especialista humano que pueda orientarte mejor. ¿Un momento por favor?";
    }

    // 🎯 DETECCIÓN DE NUEVOS TEMAS (turnos, stock)
    if (mensajeLower.includes('turno') || mensajeLower.includes('cita') || mensajeLower.includes('reserva')) {
      contexto.ultimoTema = 'turnos';
      return this.manejarTurnos(mensajeLower, contexto);
    }
    
    if (mensajeLower.includes('stock') || mensajeLower.includes('disponible') || mensajeLower.includes('queda')) {
      contexto.ultimoTema = 'stock';
      return this.manejarStock(mensajeLower, contexto);
    }

    // 🎯 MANEJO DE FLUJO CONVERSACIONAL POR ÁRBOL
    if (contexto.ultimoTema && contexto.paso > 0) {
      return this.continuarFlujoArbol(mensajeLower, contexto);
    }

    // 🎯 CONVERSACIÓN INICIAL
    contexto.paso = 1;
    
    switch (intent) {
      case 'saludo':
        contexto.ultimoTema = 'saludo';
        return this.saludos[Math.floor(Math.random() * this.saludos.length)];
      
      case 'obra_social':
        contexto.ultimoTema = 'obra_social';
        return this.iniciarObraSocial(contexto);
      
      case 'precio':
        contexto.ultimoTema = 'precio';
        return "💲 Los precios dependen de si buscás armazones, cristales o lentes de contacto. ¿Por cuál te gustaría empezar?";
      
      case 'marca':
        contexto.ultimoTema = 'marca';
        return "👓 Tenemos variedad de marcas y opciones tanto en armazones como en lentes de contacto y cristales. ¿Querés que te cuente por armazones, lentes de contacto o cristales?";
      
      case 'horario':
        contexto.ultimoTema = 'horario';
        return "⏰ Abrimos de lunes a sábado de 10:30 a 19:30. ¿Te sirve algún día en particular?";
      
      case 'direccion':
        contexto.ultimoTema = 'direccion';
        return "📍 Estamos en Serrano 684, Villa Crespo. ¿Querés que te comparta un mapa de Google para que llegues más fácil?";
      
      case 'lentes_contacto':
        contexto.ultimoTema = 'lentes_contacto';
        return "👁️ ¡Sí! Trabajamos con lentes de contacto. ¿Es tu primera vez o ya los usás?";
      
      case 'liquidos':
        contexto.ultimoTema = 'liquidos';
        return "🧴 Tenemos soluciones multiuso para limpieza diaria y gotas humectantes. ¿Qué estás buscando en particular?";
      
      case 'respuesta_simple':
        return this.manejarRespuestaSimple(mensajeLower, contexto.ultimoTema, contexto);
      
      default:
        return "🤔 No te entendí bien. ¿Podés decirlo de otra forma? Podés preguntarme por obras sociales, precios, marcas, horarios, lentes de contacto, líquidos o turnos.";
    }
  }

  // 🏥 ÁRBOL DE OBRAS SOCIALES COMPLETO
  iniciarObraSocial(contexto) {
    contexto.subtema = 'inicio';
    return "🏥 Sí, trabajamos con Medicus, Osetya, Construir Salud y Swiss Medical. ¿Tu consulta es por armazones/cristales o por lentes de contacto?";
  }

  continuarFlujoArbol(mensaje, contexto) {
    switch (contexto.ultimoTema) {
      case 'obra_social':
        return this.manejarObraSocial(mensaje, contexto);
      
      case 'precio':
        return this.manejarPrecios(mensaje, contexto);
      
      case 'marca':
        return this.manejarMarcas(mensaje, contexto);
      
      case 'lentes_contacto':
        return this.manejarlentesContacto(mensaje, contexto);
      
      case 'liquidos':
        return this.manejarLiquidos(mensaje, contexto);
      
      case 'horario':
        return this.manejarHorario(mensaje, contexto);
      
      case 'direccion':
        return this.manejarDireccion(mensaje, contexto);
      
      case 'turnos':
        return this.manejarTurnos(mensaje, contexto);
      
      case 'stock':
        return this.manejarStock(mensaje, contexto);
      
      default:
        return this.manejarRespuestaSimple(mensaje, contexto.ultimoTema, contexto);
    }
  }

  manejarObraSocial(mensaje, contexto) {
    // 🏥 RAMA 1: ARMZONES/CRISTALES
    if (mensaje.includes('armazon') || mensaje.includes('cristal') || mensaje.includes('anteojo') || (mensaje.includes('lente') && !mensaje.includes('contacto'))) {
      contexto.subtema = 'armazones';
      contexto.paso = 2;
      return "📄 En el caso de armazones o cristales, la receta médica es obligatoria. Tiene que estar vigente (dura 60 días) y detallar bien qué tipo de lentes necesitás: lejos, cerca o multifocales.";
    }
    
    // 🏥 RAMA 2: LENTES DE CONTACTO
    if (mensaje.includes('contacto') || mensaje.includes('lentilla')) {
      contexto.subtema = 'lentes_contacto_os';
      contexto.paso = 2;
      return "👁️ Con lentes de contacto, la obra social siempre exige receta vigente y detallada. ¿Tenés una receta actualizada?";
    }
    
    // 🏥 SUB-RUTAS DE ARMZONES
    if (contexto.subtema === 'armazones') {
      if (mensaje.includes('document') || mensaje.includes('llevar') || mensaje.includes('necesito')) {
        return "📋 Perfecto, te cuento: necesitás la receta detallada, tu credencial de la obra social y el sello del médico. Con eso ya podés iniciar el trámite.";
      }
      
      if (mensaje.includes('multifocal') || mensaje.includes('cerca') || mensaje.includes('lejos')) {
        return "🔒 La cobertura de la obra social es solo sobre lo que figure en la receta. Si la receta dice 'lentes de lejos', la cobertura no aplica para multifocales o de cerca.";
      }
    }
    
    // 🏥 SUB-RUTAS DE LENTES DE CONTACTO
    if (contexto.subtema === 'lentes_contacto_os') {
      if (mensaje.includes('si') || mensaje.includes('sí') || mensaje.includes('tengo')) {
        return "✅ ¡Genial! Con la receta vigente ya podés tramitar tus lentes de contacto por obra social.";
      }
      
      if (mensaje.includes('no') || mensaje.includes('aun no') || mensaje.includes('todavía')) {
        return "📝 En ese caso, te recomiendo que pidas una receta a tu oftalmólogo. Solo con la receta podemos iniciar el trámite con la obra social.";
      }
    }
    
    // 🏥 PREGUNTAS FRECUENTES
    if (mensaje.includes('vieja') || mensaje.includes('validez') || mensaje.includes('días')) {
      return "⏰ La receta tiene validez de 60 días. Pasado ese tiempo, el sistema de la obra social no la toma y hay que hacer una nueva.";
    }
    
    if (mensaje.includes('cubre') || mensaje.includes('tipo de lente')) {
      return "📋 Cubre lo que esté indicado en tu receta. Por ejemplo, si tu receta dice 'lentes de lejos', no va a cubrir unos multifocales.";
    }
    
    if (mensaje.includes('liquido') || mensaje.includes('accesorio')) {
      return "🧴 No, la obra social solo cubre armazones, cristales o lentes de contacto, según la receta. Los líquidos y accesorios se compran aparte.";
    }
    
    if (mensaje.includes('promo') || mensaje.includes('descuento')) {
      return "🎫 No tenemos promos adicionales, lo que cubre tu obra social es lo que se aplica al trámite.";
    }
    
    return "🏥 ¿Querés que te pase la dirección y horarios para que vengas a iniciar el trámite?";
  }

  // 💲 ÁRBOL DE PRECIOS COMPLETO
  manejarPrecios(mensaje, contexto) {
    // 💲 RAMA 1: ARMAZONES
    if (mensaje.includes('armazon') || mensaje.includes('marco') || mensaje.includes('montura')) {
      contexto.subtema = 'armazones_precio';
      return "👓 Los armazones se eligen siempre en persona 👓, porque necesitamos hacerte mediciones para que queden bien en tu rostro. Tenemos modelos desde $55.000 hasta $270.000. ¿Querés que te pase dirección y horarios para venir a verlos?";
    }
    
    // 💲 RAMA 2: CRISTALES
    if (mensaje.includes('cristal') || (mensaje.includes('lente') && !mensaje.includes('contacto'))) {
      contexto.subtema = 'cristales_precio';
      return "🔍 El precio de los cristales depende de tu receta y del tipo de tratamiento que elijas (simples, antirreflejo, fotocromáticos, progresivos). ¿Querés contarme qué tipo de receta tenés para orientarte mejor?";
    }
    
    // 💲 RAMA 3: LENTES DE CONTACTO
    if (mensaje.includes('contacto') || mensaje.includes('lentilla')) {
      contexto.subtema = 'contacto_precio';
      return "👁️ Los precios varían según la marca y el tipo: trabajamos con Acuvue, Biofinity y Air Optix en versiones diarias y mensuales. ¿Querés que te muestre las diferencias entre ellas?";
    }
    
    // 💲 PROMOCIONES (siempre disponibles)
    if (mensaje.includes('cuota') || mensaje.includes('descuento') || mensaje.includes('promo') || mensaje.includes('pago')) {
      return this.agregarPromociones();
    }
    
    // 💲 SUB-RUTAS
    if (contexto.subtema === 'cristales_precio') {
      if (mensaje.includes('si') || mensaje.includes('sí') || mensaje.includes('tengo')) {
        return "📄 Perfecto, con tu receta podemos cotizar con precisión. ¿Querés que te pase con un asistente para hacerlo ahora?";
      }
      
      if (mensaje.includes('no') || mensaje.includes('aun no')) {
        return "⏳ En ese caso, lo mejor es esperar a tener la receta, ya que el precio depende totalmente de lo que indique el médico.";
      }
    }
    
    if (contexto.subtema === 'contacto_precio') {
      if (mensaje.includes('uso') || mensaje.includes('ya uso')) {
        return "🔄 Genial, ¿querés reponer la misma marca que usás o te interesa probar otra?";
      }
      
      if (mensaje.includes('primera') || mensaje.includes('nunca')) {
        return "🎯 Para primera vez recomendamos hacer un control con el contactólogo. En esa consulta también se define qué tipo de lente es mejor para vos. ¿Querés que te reserve un turno?";
      }
    }
    
    return "💲 " + this.agregarPromociones();
  }

  agregarPromociones() {
    return "Tenemos 3 cuotas sin interés a partir de $100.000 y 6 cuotas sin interés a partir de $200.000 💳. Además, hay un 10% de descuento pagando en efectivo (completo en efectivo). Aceptamos efectivo, QR y todas las tarjetas.";
  }

  // 👓 ÁRBOL DE MARCAS COMPLETO
  manejarMarcas(mensaje, contexto) {
    // 👓 RAMA 1: ARMAZONES
    if (mensaje.includes('armazon') || mensaje.includes('marco') || (!mensaje.includes('contacto') && !mensaje.includes('cristal'))) {
      contexto.subtema = 'armazones_marca';
      return "👓 Contamos con una gran variedad de armazones, desde marcas reconocidas hasta opciones más accesibles. Lo ideal es que vengas a la óptica a probarlos 👓 porque necesitamos ajustar las medidas a tu rostro. ¿Querés que te pase dirección y horarios?";
    }
    
    // 👓 RAMA 2: LENTES DE CONTACTO
    if (mensaje.includes('contacto') || mensaje.includes('lentilla')) {
      contexto.subtema = 'contacto_marca';
      return "👁️ Trabajamos con las marcas Acuvue, Biofinity y Air Optix. ¿Querés reponer la misma marca que ya usás o estás buscando una nueva?";
    }
    
    // 👓 RAMA 3: CRISTALES
    if (mensaje.includes('cristal') || mensaje.includes('progresivo') || mensaje.includes('antirreflejo')) {
      contexto.subtema = 'cristales_marca';
      return "🔍 Tenemos diferentes tipos de cristales: simples, antirreflejo, fotocromáticos y progresivos. ¿Querés que te explique cuál se adapta mejor según tu receta?";
    }
    
    // 👓 MARCAS ESPECÍFICAS
    if (mensaje.includes('ray-ban') || mensaje.includes('oakley') || mensaje.includes('vulk')) {
      return `✅ Sí, trabajamos con ${mensaje.includes('ray-ban') ? 'Ray-Ban' : mensaje.includes('oakley') ? 'Oakley' : 'Vulk'}. Tenemos varios modelos para que pruebes en persona.`;
    }
    
    if (mensaje.includes('acuvue') || mensaje.includes('biofinity') || mensaje.includes('air optix')) {
      return `👁️ Sí, tenemos ${mensaje.includes('acuvue') ? 'Acuvue' : mensaje.includes('biofinity') ? 'Biofinity' : 'Air Optix'} disponible. ¿Querés que te confirme stock?`;
    }
    
    return "👓 ¿Querés que te pase dirección y horarios para que vengas a ver modelos en persona?";
  }

  // 👁️ ÁRBOL DE LENTES DE CONTACTO COMPLETO
  manejarlentesContacto(mensaje, contexto) {
    // 👁️ RAMA 1: PRIMERA VEZ
    if (mensaje.includes('primera') || mensaje.includes('nunca') || mensaje.includes('empezar') || mensaje.includes('nuevo')) {
      contexto.subtema = 'primera_vez';
      return "🎯 Para empezar, recomendamos una consulta con nuestro contactólogo. En esa cita te enseñan a ponerlos, quitarlos y cuidarlos. ¿Querés que te reserve un turno?";
    }
    
    // 👁️ RAMA 2: YA USA
    if (mensaje.includes('uso') || mensaje.includes('ya uso') || mensaje.includes('actual') || mensaje.includes('habitual')) {
      contexto.subtema = 'experiencia';
      return "🔄 Perfecto. ¿Querés reponer la misma marca que ya usás o te interesa ver otras opciones? Trabajamos con Acuvue, Biofinity y Air Optix.";
    }
    
    // 👁️ SUB-RUTAS
    if (contexto.subtema === 'primera_vez') {
      if (mensaje.includes('receta')) {
        return "📄 No es obligatoria para empezar, pero sí es recomendable. Y si vas a comprarlos por obra social, ahí sí es requisito.";
      }
      
      if (mensaje.includes('si') || mensaje.includes('sí') || mensaje.includes('turno')) {
        return `📅 ¡Perfecto! Te reservo un turno para consulta con nuestro contactólogo.
        
📍 Dirección: Serrano 684, Villa Crespo
⏰ Duración: 30-45 minutos
🎯 Incluye: Prueba de lentes + enseñanza de uso
        
¿Qué día te viene bien?`;
      }
    }
    
    if (contexto.subtema === 'experiencia') {
      if (mensaje.includes('no') || mensaje.includes('receta')) {
        return "📝 No hay problema. Si ya sos usuario podés comprar sin receta. Solo la pedimos si querés hacerlo por obra social. ¿Querés que te muestre las marcas?";
      }
      
      if (mensaje.includes('si') || mensaje.includes('sí') || mensaje.includes('tengo')) {
        return "✅ Genial, si es vigente podés usarla para tu compra o para tramitarlo por obra social.";
      }
    }
    
    // 👁️ MARCAS ESPECÍFICAS
    if (mensaje.includes('acuvue') || mensaje.includes('biofinity') || mensaje.includes('air optix')) {
      return `👁️ ${mensaje.includes('acuvue') ? 'Acuvue' : mensaje.includes('biofinity') ? 'Biofinity' : 'Air Optix'} es una excelente opción. ¿Querés que te confirme disponibilidad?`;
    }
    
    return "👁️ ¿Querés que te confirme stock de tu marca o preferís ver opciones cuando vengas a la óptica?";
  }

  // 🧴 ÁRBOL DE LÍQUIDOS COMPLETO
  manejarLiquidos(mensaje, contexto) {
    // 🧴 RAMA 1: SOLUCIONES MULTIUSO
    if (mensaje.includes('multiuso') || mensaje.includes('limpieza') || mensaje.includes('solucion') || mensaje.includes('líquido')) {
      contexto.subtema = 'multiuso';
      return "🧴 Genial, tenemos varias marcas y tamaños. ¿Querés que te confirme el stock disponible para retirar?";
    }
    
    // 🧴 RAMA 2: GOTAS HUMECTANTES
    if (mensaje.includes('gota') || mensaje.includes('humectante') || mensaje.includes('lágrima') || mensaje.includes('lagrima')) {
      contexto.subtema = 'gotas';
      return "💧 Perfecto, ¿buscás lubricantes comunes o gotas específicas para sequedad más intensa?";
    }
    
    // 🧴 SUB-RUTAS
    if (contexto.subtema === 'gotas' && (mensaje.includes('no se') || mensaje.includes('no sé') || mensaje.includes(' cual'))) {
      return "🤔 En ese caso lo mejor es que lo veamos en persona, porque depende de qué tan seguido uses los lentes de contacto. ¿Querés que te pase dirección y horarios?";
    }
    
    // 🧴 PREGUNTAS FRECUENTES
    if (mensaje.includes('receta')) {
      return "📄 Sí, no necesitás receta para comprar líquidos o gotas.";
    }
    
    if (mensaje.includes('obra social') || mensaje.includes('cubre')) {
      return "🏥 No, la obra social no cubre líquidos ni accesorios, solo lentes y cristales.";
    }
    
    if (mensaje.includes('marca')) {
      return "🏷️ Tenemos varias marcas reconocidas de soluciones multiuso. Si querés, te confirmo stock antes de que vengas.";
    }
    
    return "🧴 ¿Querés que te pase dirección y horarios para pasar a retirar?";
  }

  // ⏰ MANEJO DE HORARIOS
  manejarHorario(mensaje, contexto) {
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaEncontrado = dias.find(dia => mensaje.includes(dia));
    
    if (diaEncontrado) {
      return `✅ Perfecto, los ${diaEncontrado}s abrimos de 10:30 a 19:30. ¿Te viene bien por la mañana o tarde?`;
    }
    
    return "⏰ Abrimos de lunes a sábado de 10:30 a 19:30. ¿Te sirve algún día en particular?";
  }

  // 📍 MANEJO DE DIRECCIÓN CON GOOGLE MAPS
  manejarDireccion(mensaje, contexto) {
    if (mensaje.includes('si') || mensaje.includes('sí') || mensaje.includes('mapa') || mensaje.includes('google')) {
      return `🗺️ Te comparto la ubicación exacta: Serrano 684, Villa Crespo

📍 Google Maps: https://maps.google.com/?q=Serrano+684,+Villa+Crespo,+CABA

Estamos a 4 cuadras del subte Ángel Gallardo (línea B).`;
    }
    
    if (mensaje.includes('subte') || mensaje.includes('colectivo') || mensaje.includes('bondi') || mensaje.includes('llegar')) {
      return "🚇 Estamos a 4 cuadras de Ángel Gallardo (subte B). Colectivos: 109, 110, 112. ¿Te sirve esa info?";
    }
    
    return "📍 Serrano 684, Villa Crespo. ¿Querés que te comparta un mapa de Google para que llegues más fácil?";
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
      
      if (mensaje.includes('mañana') || mensaje.includes('tarde')) {
        return `⏰ Perfecto, te esperamos por la ${mensaje.includes('mañana') ? 'mañana' : 'tarde'}.
        
📍 Dirección: Serrano 684, Villa Crespo
📞 Teléfono: 1132774631
⏰ Horario: 10:30 - 19:30
        
¿Necesitás algún otro dato?`;
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
      
      if (mensaje.includes('liquido') || mensaje.includes('solucion')) {
        return "🧴 Tenemos stock de las principales marcas de líquidos. ¿Buscás multiuso o gotas humectantes?";
      }
    }
    
    return "📦 ¿Querés confirmar disponibilidad de algún producto en particular?";
  }

  // 🎯 MANEJO DE RESPUESTAS SIMPLES
  manejarRespuestaSimple(mensaje, ultimoTema, contexto) {
    // RESPUESTAS POSITIVAS
    if (mensaje === 'si' || mensaje === 'sí' || mensaje === 'si.' || mensaje === 'sí.' || 
        mensaje === 'claro' || mensaje === 'por supuesto' || mensaje === 'dale') {
      switch (ultimoTema) {
        case 'lentes_contacto':
          return "¡Perfecto! ¿Qué marca te interesa o ya usás alguna?";
        case 'obra_social':
          return "✅ Genial. ¿Tenés la receta? La vigencia es de 60 días.";
        case 'liquidos':
          return "🧴 ¿Qué marca de líquido usás o te recomiendo alguna?";
        case 'marca':
          return "👓 ¿Te interesa algún modelo en particular?";
        case 'precio':
          return "💲 ¿De qué producto querés saber el precio exacto?";
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
      switch (ultimoTema) {
        case 'lentes_contacto':
          return "¡No hay problema! Te recomiendo una consulta para ver qué te conviene. ¿Te interesa?";
        case 'obra_social':
          return "¿Te interesa saber sobre precios particulares?";
        case 'liquidos':
          return "¿Querés que te recomiende alguna marca de líquido?";
        case 'turnos':
          return "¿Te ayudo con algo más entonces?";
        case 'stock':
          return "¿Necesitás ayuda con otra cosa?";
        default:
          return "¿Te ayudo con algo más?";
      }
    }
    
    // DÍAS DE LA SEMANA
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaEncontrado = dias.find(dia => mensaje === dia);
    if (diaEncontrado) {
      return `✅ Perfecto, los ${diaEncontrado}s abrimos de 10:30 a 19:30. ¿Te viene bien por la mañana o tarde?`;
    }
    
    return "¿Necesitás que te ayude con algo más específico?";
  }

  // 🩺 DETECCIÓN DE PROBLEMAS DE SALUD
  detectarProblemaSalud(mensaje) {
    const problemasSalud = [
      'dolor', 'duele', 'molestia', 'enrojecimiento', 'rojo', 'infección', 'infeccion',
      'secreción', 'secrecion', 'visión borrosa', 'vision borrosa', 'borroso',
      'picazón', 'pica', 'ardor', 'quemazón', 'quemazon', 'sensibilidad', 'luz',
      'pérdida de visión', 'perdida de vision', 'no veo', 'veo mal'
    ];
    return problemasSalud.some(problema => mensaje.includes(problema));
  }
}

// ==================== SERVICIO DE MEMORIA PARA CONVERSACIONES ====================
class MemoryService {
  constructor() {
    this.contextos = new Map();
  }

  obtenerContextoUsuario(userId) {
    if (!this.contextos.has(userId)) {
      this.contextos.set(userId, { 
        paso: 0, 
        ultimoTema: null, 
        conversacion: [],
        timestamp: Date.now()
      });
    }
    return this.contextos.get(userId);
  }

  guardarContextoUsuario(userId, contexto) {
    contexto.timestamp = Date.now(); // Actualizar timestamp
    this.contextos.set(userId, contexto);
    
    // 🧹 Limpiar contextos viejos (más de 1 hora)
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
