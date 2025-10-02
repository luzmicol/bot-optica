const express = require('express');
const app = express();

// ==================== CONFIGURACIÓN BÁSICA ====================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==================== DATOS COMPLETOS DE HYPNOTTICA ====================
const HYPNOTTICA = {
  informacion: {
    nombre: "Hypnottica",
    direccion: "Serrano 684, Villa Crespo, CABA",
    horarios: "Lunes a Sábado de 10:30 a 19:30",
    telefono: "1132774631",
    redes: "@hypnottica en Instagram y Facebook",
    email: "solo proveedores"
  },
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
  precios: {
    rangoArmazones: "$55.000 hasta $370.000 (solo armazón)",
    promociones: [
      "3 cuotas sin interés a partir de $100.000",
      "6 cuotas sin interés a partir de $200.000",
      "10% de descuento abonando en efectivo (totalidad en efectivo)"
    ],
    mediosPago: ["efectivo", "QR", "tarjetas de crédito/débito"]
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
        // Nuevo: estado específico para flujos conversacionales
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
    if (contexto.historial.length > 10) {
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

  // Nuevo: Reiniciar contexto cuando hay saludo
  reiniciarContexto(userId) {
    this.contextos.delete(userId);
    return this.obtenerContextoUsuario(userId);
  }
}

// ==================== SISTEMA DE INTENCIONES MEJORADO ====================
class IntentRecognizer {
  detectIntent(mensaje, contexto = {}) {
    const mensajeLower = mensaje.toLowerCase().trim();
    
    // Si hay contexto previo, priorizar continuaciones
    if (contexto.esperandoRespuesta) {
      return this.detectarContinuacion(mensajeLower, contexto);
    }

    // 🎯 DETECCIÓN MEJORADA CON CONTEXTO
    if (this.esSaludoContextual(mensajeLower)) return 'saludo';
    if (this.esLentesContactoContextual(mensajeLower, contexto)) return 'lentes_contacto';
    if (this.esLiquidosContextual(mensajeLower)) return 'liquidos';
    if (this.esObraSocialContextual(mensajeLower)) return 'obra_social';
    if (this.esPrecioContextual(mensajeLower)) return 'precio';
    if (this.esMarcaContextual(mensajeLower)) return 'marca';
    if (this.esHorarioContextual(mensajeLower)) return 'horario';
    if (this.esDireccionContextual(mensajeLower)) return 'direccion';
    if (this.esDespedidaContextual(mensajeLower)) return 'despedida';
    if (this.esRespuestaSimple(mensajeLower, contexto)) return 'respuesta_simple';
    
    return 'no_entendido';
  }

  detectarContinuacion(mensaje, contexto) {
    // Si estábamos esperando una respuesta específica
    switch (contexto.esperandoRespuesta) {
      case 'primera_vez_contacto':
        if (mensaje.includes('si') || mensaje.includes('sí') || mensaje.includes('primera') || mensaje.includes('nunca')) {
          return 'primera_vez_confirmada';
        }
        if (mensaje.includes('no') || mensaje.includes('ya uso') || mensaje.includes('experiencia')) {
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
        if (mensaje.includes('armazon') || mensaje.includes('cristal') || mensaje.includes('anteojo')) {
          return 'os_armazones';
        }
        if (mensaje.includes('contacto') || mensaje.includes('lentilla')) {
          return 'os_contacto';
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

  esRespuestaSimple(mensaje, contexto) {
    // Si el mensaje es corto y hay contexto previo, es probablemente una respuesta
    if (mensaje.length < 20 && contexto.ultimoTema && contexto.paso > 0) {
      return true;
    }
    
    const respuestasSimples = ['si', 'sí', 'no', 'claro', 'dale', 'ok', 'perfecto', 'gracias'];
    return respuestasSimples.includes(mensaje);
  }
}

// ==================== MANEJADOR DE RESPUESTAS MEJORADO ====================
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
      contexto = { paso: 1, ultimoTema: 'saludo', subtema: null, datos: {}, esperandoRespuesta: null, historial: [] };
    }

    // 🎯 DETECCIÓN DE PROBLEMAS DE SALUD - DERIVACIÓN INMEDIATA
    if (this.detectarProblemaSalud(mensajeLower)) {
      contexto.esperandoRespuesta = null;
      return "🩺 Por tu seguridad, prefiero pasarte con un especialista humano que pueda orientarte mejor. ¿Un momento por favor?";
    }

    const intent = this.recognizer.detectIntent(mensajeLower, contexto);
    
    // 🎯 AGREGAR AL HISTORIAL
    if (!contexto.historial) contexto.historial = [];
    contexto.historial.push({ mensaje, intent, timestamp: Date.now() });

    console.log(`🔍 Intent detectado: ${intent}, Contexto:`, { 
      ultimoTema: contexto.ultimoTema, 
      paso: contexto.paso,
      esperando: contexto.esperandoRespuesta 
    });

    // 🎯 MANEJO DE FLUJO CONVERSACIONAL MEJORADO
    if (contexto.esperandoRespuesta) {
      return this.continuarFlujoConversacional(mensajeLower, contexto, intent);
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
        if (intent === 'primera_vez_confirmada' || mensaje.includes('primera') || mensaje.includes('nunca')) {
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
          return "📄 En el caso de armazones o cristales, la receta médica es obligatoria. Tiene que estar vigente (dura 60 días) y detallar bien qué tipo de lentes necesitás: lejos, cerca o multifocales.";
        } else if (intent === 'os_contacto' || mensaje.includes('contacto')) {
          return "👁️ Con lentes de contacto, la obra social siempre exige receta vigente y detallada. ¿Tenés una receta actualizada?";
        } else {
          contexto.esperandoRespuesta = 'tipo_consulta_os';
          return "🏥 ¿Tu consulta de obra social es para armazones/cristales o para lentes de contacto?";
        }

      default:
        contexto.esperandoRespuesta = null;
        return this.manejarRespuestaSimple(mensaje, contexto);
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
      
      case 'direccion':
        contexto.esperandoRespuesta = 'confirmar_mapa';
        return "📍 ¿Querés que te comparta el mapa de Google con nuestra ubicación?";
      
      default:
        return "🤔 Perdón, no entendí. ¿Podés reformular tu pregunta?";
    }
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
      contexto.esperandoRespuesta = null;
      return "🔄 Perfecto. ¿Querés reponer la misma marca que ya usás o te interesa ver otras opciones? Trabajamos con Acuvue, Biofinity y Air Optix.";
    }

    return "🤔 No te entendí bien. ¿Podés decirlo de otra forma?";
  }

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

// ==================== SERVICIO DE MEMORIA ====================
const memoryService = new MemoryService();
const responseHandler = new ResponseHandler();

// ==================== RUTAS PRINCIPALES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    name: 'Luna - Hypnottica',
    service: 'Asistente Virtual Óptica',
    version: '2.0 - Con contexto mejorado'
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
            <p><strong>Modo:</strong> Con contexto conversacional mejorado</p>
            <p><strong>Versión:</strong> 2.0</p>
          </div>
          <p>
            <a href="/health" class="btn">Health Check</a>
            <a href="/probador" class="btn">Probador del Bot</a>
          </p>
          <p>✨ Ahora con memoria conversacional mejorada</p>
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
            .context-info {
                background: #e7f3ff;
                padding: 10px;
                margin: 5px 0;
                border-radius: 10px;
                font-size: 12px;
                color: #0066cc;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 Luna - Probador v2.0</h1>
                <p>Asistente Virtual de Hypnottica - Con contexto mejorado</p>
            </div>
            
            <div class="status">
                💡 <strong>Nuevo:</strong> Ahora el bot mantiene contexto entre mensajes. Probá: "hola" → "lentes de contacto" → "primera vez"
            </div>
            
            <div class="chat-container" id="chatContainer">
                <div class="message bot-message">
                    👋 ¡Hola! Soy *Luna*, tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy?\n\n• 📦 Consultar stock\n• 💲 Precios y promociones\n• 🏥 Obras sociales\n• 👁️ Lentes de contacto\n• 📍 Ubicación y horarios\n• 🔧 Servicios técnicos
                </div>
            </div>
            
            <div class="quick-buttons" id="quickButtons">
                <div class="quick-button" onclick="sendQuickMessage('hola')">👋 Hola</div>
                <div class="quick-button" onclick="sendQuickMessage('lentes de contacto')">👁️ Lentes contacto</div>
                <div class="quick-button" onclick="sendQuickMessage('primera vez')">🎯 Primera vez</div>
                <div class="quick-button" onclick="sendQuickMessage('que obras sociales aceptan')">🏥 Obras sociales</div>
                <div class="quick-button" onclick="sendQuickMessage('precios')">💲 Precios</div>
                <div class="quick-button" onclick="sendQuickMessage('direccion')">📍 Dirección</div>
                <div class="quick-button" onclick="sendQuickMessage('si')">✅ Sí</div>
                <div class="quick-button" onclick="sendQuickMessage('no')">❌ No</div>
            </div>
            
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Escribe tu mensaje..." onkeypress="handleKeyPress(event)">
                <button onclick="sendMessage()">Enviar</button>
            </div>
        </div>

        <script>
            let currentUserId = 'web-user-' + Math.random().toString(36).substr(2, 9);
            
            function addMessage(message, isUser = false, contextInfo = null) {
                const chatContainer = document.getElementById('chatContainer');
                const messageDiv = document.createElement('div');
                messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
                messageDiv.innerHTML = message.replace(/\\n/g, '<br>');
                chatContainer.appendChild(messageDiv);
                
                if (contextInfo && !isUser) {
                    const contextDiv = document.createElement('div');
                    contextDiv.className = 'context-info';
                    contextDiv.innerHTML = '🔄 Contexto: ' + contextInfo;
                    chatContainer.appendChild(contextDiv);
                }
                
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
                        body: JSON.stringify({ 
                            mensaje: message,
                            userId: currentUserId 
                        })
                    });
                    
                    const data = await response.json();
                    hideTyping();
                    
                    if (data.respuesta) {
                        addMessage(data.respuesta, false, data.contextInfo);
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
            
            // Nuevo usuario cada vez que se recarga
            currentUserId = 'web-user-' + Math.random().toString(36).substr(2, 9);
            console.log('Usuario actual:', currentUserId);
        </script>
    </body>
    </html>
  `);
});

// Ruta POST mejorada para el probador
app.post('/probar-bot', async (req, res) => {
  try {
    const { mensaje, userId = 'web-user-default' } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({ error: 'Falta el mensaje' });
    }
    
    console.log(`🧪 Probador - Usuario: ${userId}, Mensaje: "${mensaje}"`);
    
    let contexto = memoryService.obtenerContextoUsuario(userId);
    console.log('📝 Contexto anterior:', contexto);
    
    const respuesta = await responseHandler.generarRespuesta(mensaje, contexto);
    
    memoryService.guardarContextoUsuario(userId, contexto);
    
    console.log('💾 Contexto actualizado:', contexto);
    
    res.json({
      mensaje_original: mensaje,
      respuesta: respuesta,
      contextInfo: `Tema: ${contexto.ultimoTema || 'ninguno'}, Esperando: ${contexto.esperandoRespuesta || 'nada'}`,
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

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 Luna v2.0 funcionando en puerto ${PORT}`);
  console.log(`🌐 Probador disponible en: http://localhost:${PORT}/probador`);
  console.log(`❤️  Health check en: http://localhost:${PORT}/health`);
  console.log(`🔄 Ahora con contexto conversacional mejorado`);
});

module.exports = app;
