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

// ==================== SISTEMA DE INTENCIONES MEJORADO ====================
class IntentRecognizer {
  detectIntent(mensaje) {
    const mensajeLower = mensaje.toLowerCase().trim();
    
    // 🎯 DETECCIÓN MÁS INTELIGENTE Y FLEXIBLE
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
    const patronesSaludo = [
      'hola', 'buenas', 'holis', 'hey', 'qué tal', 'cómo andás', 'cómo andan',
      'buen día', 'buenas tardes', 'buenas noches', 'qué hacés', 'cómo va',
      'saludos', 'ey', 'buenas', 'todo bien', 'holaaa', 'hi', 'hello',
      'buenass', 'que tal', 'como estas', 'cómo estás', 'que onda'
    ];
    return patronesSaludo.some(saludo => mensaje.includes(saludo));
  }

  esDespedida(mensaje) {
    const patronesDespedida = [
      'chau', 'gracias', 'nos vemos', 'adiós', 'hasta luego', 'hasta pronto',
      'hasta mañana', 'hasta la próxima', 'cuidate', 'cuídense', 'un saludo',
      'suerte', 'que estés bien', 'que les vaya bien', 'abrazo', 'besos',
      'hablamos', 'chaooo', 'bye', 'goodbye', 'adios', 'chao', 'asta luego'
    ];
    return patronesDespedida.some(despedida => mensaje.includes(despedida));
  }

  esObraSocial(mensaje) {
    const patronesOS = [
      'obra social', 'prepaga', 'swiss medical', 'medicus', 'osetya', 
      'construir salud', 'obras sociales', 'cobertura', 'plan médico',
      'trabajan con', 'aceptan', 'tienen convenio', 'seguro', 'medical',
      'os', 'prepaga'
    ];
    return patronesOS.some(palabra => mensaje.includes(palabra));
  }

  esStock(mensaje) {
    const patronesStock = [
      'stock', 'tenes', 'tienen', 'disponible', 'hay', 'queda', 'venden',
      'conseguir', 'proveen', 'ofrecen', 'trabajan con', 'venden',
      'qué tienen', 'que tienen', 'que tenes', 'qué tenes'
    ];
    return patronesStock.some(palabra => mensaje.includes(palabra));
  }

  esPrecio(mensaje) {
    const patronesPrecio = [
      'precio', 'cuesta', 'cuanto sale', 'valor', 'cuánto', 'precios',
      'cuestan', 'sale', 'valen', 'cotización', 'presupuesto', 'tarifa',
      'caro', 'barato', 'económico', 'costó', 'pagué', 'pagar', 'dinero',
      '$', 'pesos'
    ];
    return patronesPrecio.some(palabra => mensaje.includes(palabra));
  }

  esMarca(mensaje) {
    const patronesMarca = [
      'marca', 'ray-ban', 'oakley', 'marcas', 'vulk', 'acuvue', 'biofinity',
      'air optix', 'modelo', 'fabricante', 'empresa', 'brand', 'modelos',
      'qué marca', 'que marca', 'ray ban', 'air optix'
    ];
    return patronesMarca.some(palabra => mensaje.includes(palabra));
  }

  esHorario(mensaje) {
    const patronesHorario = [
      'horario', 'hora', 'abren', 'cierran', 'atención', 'atencion',
      'cuando abren', 'cuándo abren', 'cuando cierran', 'cuándo cierran',
      'abierto', 'cerrado', 'funcionan', 'laboral', 'días', 'dias',
      'lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes',
      'sábado', 'sabado', 'domingo', 'fin de semana'
    ];
    return patronesHorario.some(palabra => mensaje.includes(palabra));
  }

  esDireccion(mensaje) {
    const patronesDireccion = [
      'direccion', 'ubicacion', 'donde estan', 'ubicados', 'dirección',
      'ubicación', 'dónde', 'donde', 'local', 'negocio', 'tienda',
      'comercio', 'lugar', 'sitio', 'address', 'location', 'mapa',
      'como llegar', 'cómo llegar', 'zona', 'barrio', 'villa crespo',
      'serrano'
    ];
    return patronesDireccion.some(palabra => mensaje.includes(palabra));
  }

  esLentesContacto(mensaje) {
    const patronesLC = [
      'lentes de contacto', 'lentillas', 'pupilentes', 'contacto',
      'lentes contacto', 'lentilla', 'contact lens', 'lentescontacto',
      'lentillas de contacto', 'pupilente', 'lentescontactos',
      'lentes de contactos', 'lentillas contacto', 'lentescontact',
      'qué lentes de contacto', 'que lentes de contacto', 'lentes contacto tienen',
      'lentillas tienen', 'contactos tienen'
    ];
    return patronesLC.some(palabra => mensaje.includes(palabra));
  }

  esLiquidos(mensaje) {
    const patronesLiquidos = [
      'líquido', 'liquido', 'solucion', 'solución', 'liquidos', 'líquidos',
      'soluciones', 'producto limpieza', 'limpieza lentes', 'limpiar',
      'limpiador', 'humectante', 'gotas', 'eye drops', 'solution',
      'qué líquido', 'que liquido', 'líquidos tienen', 'liquidos tienen',
      'solucion tienen', 'solución tienen', 'recomendación líquido',
      'recomendacion liquido'
    ];
    return patronesLiquidos.some(palabra => mensaje.includes(palabra));
  }

  esConsultaFrecuente(mensaje) {
    const patronesConsulta = [
      'envio', 'envío', 'domicilio', 'financiacion', 'cuota', 'receta',
      'entrega', 'tiempo', 'demora', 'cuándo', 'cuando', 'forma de pago',
      'medio de pago', 'tarjeta', 'efectivo', 'transferencia', 'qr',
      'descuento', 'promo', 'promoción', 'oferta', 'rebaja', 'bonificación',
      'primera vez', 'nuevo', 'empezar', 'iniciar', 'comenzar'
    ];
    return patronesConsulta.some(consulta => mensaje.includes(consulta));
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
        if (contexto.ultimoTema) {
          return this.continuarConversacion(contexto.ultimoTema, mensajeLower, contexto);
        }
        return this.respuestaNoEntendido();
    }
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

  continuarConversacion(ultimoTema, mensaje, contexto) {
    switch (ultimoTema) {
      case 'obra_social':
        if (mensaje.includes('si') || mensaje.includes('tengo')) {
          return "Perfecto 😊 ¿Querés pedir turno o necesitás más info?";
        }
        return "¿Tenés alguna obra social en mente o te cuento más?";
      
      case 'lentes_contacto':
        if (mensaje.includes('si') || mensaje.includes('uso') || mensaje.includes('actual')) {
          return "¡Bien! ¿Qué marca usás? Así vemos si tenemos.";
        }
        return "¿Te interesa probar o necesitás info de precios?";
      
      case 'precio':
        return "¿Te interesa algún producto en particular para darte precio exacto?";
      
      default:
        return "¿Necesitás que te ayude con algo más?";
    }
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
