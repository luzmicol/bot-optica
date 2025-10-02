const express = require('express');
const app = express();

// ==================== CONFIGURACIÓN BÁSICA ====================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==================== DATOS DE HYPNOTTICA ====================
const HYPNOTTICA = {
  informacion: {
    nombre: "Hypnottica",
    direccion: "Serrano 684, Villa Crespo, CABA",
    horarios: "Lunes a Sábado de 10:30 a 19:30",
    telefono: "1132774631",
    redes: "@hypnottica"
  },
  obrasSociales: {
    aceptadas: ["Medicus", "Osetya", "Construir Salud", "Swiss Medical"]
  },
  productos: {
    lentesContacto: {
      marcas: ["Acuvue", "Biofinity", "Air Optix"]
    }
  }
};

// ==================== SISTEMA DE MEMORIA SIMPLIFICADO ====================
class MemoryService {
  constructor() {
    this.contextos = new Map();
  }

  obtenerContextoUsuario(userId) {
    if (!this.contextos.has(userId)) {
      this.contextos.set(userId, { 
        paso: 0, 
        ultimoTema: null, 
        esperandoRespuesta: null,
        historial: []
      });
    }
    return this.contextos.get(userId);
  }

  guardarContextoUsuario(userId, contexto) {
    contexto.timestamp = Date.now();
    this.contextos.set(userId, contexto);
  }
}

// ==================== SISTEMA DE INTENCIONES ====================
class IntentRecognizer {
  detectIntent(mensaje, contexto = {}) {
    const mensajeLower = mensaje.toLowerCase().trim();
    
    // Si hay contexto previo, priorizar continuaciones
    if (contexto.esperandoRespuesta) {
      return this.detectarContinuacion(mensajeLower, contexto);
    }

    // Detección normal
    if (this.esSaludoContextual(mensajeLower)) return 'saludo';
    if (this.esLentesContactoContextual(mensajeLower, contexto)) return 'lentes_contacto';
    if (this.esObraSocialContextual(mensajeLower)) return 'obra_social';
    if (this.esPrecioContextual(mensajeLower)) return 'precio';
    if (this.esHorarioContextual(mensajeLower)) return 'horario';
    if (this.esDireccionContextual(mensajeLower)) return 'direccion';
    if (this.esDespedidaContextual(mensajeLower)) return 'despedida';
    
    return 'no_entendido';
  }

  detectarContinuacion(mensaje, contexto) {
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
        break;
    }
    
    return 'no_entendido';
  }

  esSaludoContextual(mensaje) {
    const patrones = [
      /hola/, /buenas/, /qué tal/, /buen día/, /buenas tardes/
    ];
    return patrones.some(patron => patron.test(mensaje));
  }

  esLentesContactoContextual(mensaje, contexto) {
    if (contexto.ultimoTema === 'lentes_contacto' && mensaje.length < 25) {
      return true;
    }

    const palabrasClave = ['lente', 'contacto', 'lentilla'];
    const tienePalabraClave = palabrasClave.some(palabra => mensaje.includes(palabra));
    
    const respuestasDirectas = ['primera vez', 'ya uso', 'nunca'];
    const esRespuestaDirecta = respuestasDirectas.some(respuesta => mensaje.includes(respuesta));
    
    return tienePalabraClave || esRespuestaDirecta;
  }

  esObraSocialContextual(mensaje) {
    const obrasSociales = ['medicus', 'swiss', 'osetya', 'construir'];
    const tieneOS = obrasSociales.some(os => mensaje.includes(os));
    const tienePalabraOS = mensaje.includes('obra social');
    return tieneOS || tienePalabraOS;
  }

  esPrecioContextual(mensaje) {
    const palabrasPrecio = ['precio', 'cuesta', 'valor', 'cuanto'];
    return palabrasPrecio.some(palabra => mensaje.includes(palabra));
  }

  esHorarioContextual(mensaje) {
    const palabrasHorario = ['horario', 'hora', 'abren', 'cierran'];
    return palabrasHorario.some(palabra => mensaje.includes(palabra));
  }

  esDireccionContextual(mensaje) {
    const palabrasDireccion = ['direccion', 'ubicacion', 'dónde', 'donde'];
    return palabrasDireccion.some(palabra => mensaje.includes(palabra));
  }

  esDespedidaContextual(mensaje) {
    const palabrasDespedida = ['chau', 'gracias', 'adiós', 'bye'];
    return palabrasDespedida.some(palabra => mensaje.includes(palabra));
  }
}

// ==================== MANEJADOR DE RESPUESTAS SIMPLIFICADO ====================
class ResponseHandler {
  constructor() {
    this.recognizer = new IntentRecognizer();
  }

  async generarRespuesta(mensaje, contexto = { paso: 0, ultimoTema: null, esperandoRespuesta: null }) {
    const mensajeLower = mensaje.toLowerCase().trim();
    
    // Reiniciar contexto si es saludo nuevo
    if (this.recognizer.esSaludoContextual(mensajeLower) && contexto.paso === 0) {
      contexto = { paso: 1, ultimoTema: 'saludo', esperandoRespuesta: null, historial: [] };
    }

    // Detección de problemas de salud
    if (this.detectarProblemaSalud(mensajeLower)) {
      contexto.esperandoRespuesta = null;
      return "🩺 Por tu seguridad, prefiero pasarte con un especialista humano. ¿Un momento por favor?";
    }

    const intent = this.recognizer.detectIntent(mensajeLower, contexto);
    
    // Manejo de flujo conversacional
    if (contexto.esperandoRespuesta) {
      return this.continuarFlujoConversacional(mensajeLower, contexto, intent);
    }

    // Nueva conversación
    contexto.paso = contexto.paso + 1;
    
    switch (intent) {
      case 'saludo':
        contexto.ultimoTema = 'saludo';
        return "¡Hola! Soy Luna 👋, la asistente de Hypnottica. ¿Querés que te ayude con obras sociales, precios, horarios, dirección o lentes de contacto?";
      
      case 'lentes_contacto':
        contexto.ultimoTema = 'lentes_contacto';
        contexto.esperandoRespuesta = 'primera_vez_contacto';
        return "👁️ ¡Sí! Trabajamos con lentes de contacto. ¿Es tu primera vez o ya los usás?";
      
      case 'obra_social':
        contexto.ultimoTema = 'obra_social';
        return "🏥 Trabajamos con Medicus, Osetya, Construir Salud y Swiss Medical. ¿Necesitás saber los requisitos?";
      
      case 'precio':
        contexto.ultimoTema = 'precio';
        return "💲 Los precios varían según el producto. ¿Te interesa armazones, cristales o lentes de contacto?";
      
      case 'horario':
        contexto.ultimoTema = 'horario';
        return "⏰ Abrimos de lunes a sábado de 10:30 a 19:30. ¿Te sirve algún día en particular?";
      
      case 'direccion':
        contexto.ultimoTema = 'direccion';
        contexto.esperandoRespuesta = 'confirmar_mapa';
        return "📍 Estamos en Serrano 684, Villa Crespo. ¿Querés que te comparta un mapa de Google?";
      
      case 'despedida':
        return "¡Gracias por contactarte! Cualquier cosa, estoy acá para ayudarte. 👋";
      
      default:
        // Intentar inferir del contexto anterior
        if (contexto.ultimoTema === 'lentes_contacto') {
          contexto.esperandoRespuesta = 'primera_vez_contacto';
          return "👁️ Volviendo a tu consulta... ¿es tu primera vez con lentes de contacto o ya los usás?";
        }
        return "🤔 No te entendí. ¿Podés preguntarme por obras sociales, precios, horarios o lentes de contacto?";
    }
  }

  continuarFlujoConversacional(mensaje, contexto, intent) {
    switch (contexto.esperandoRespuesta) {
      case 'primera_vez_contacto':
        contexto.esperandoRespuesta = null;
        if (intent === 'primera_vez_confirmada' || mensaje.includes('primera') || mensaje.includes('nunca')) {
          return "🎯 Para primera vez, recomendamos consulta con nuestro contactólogo para enseñarte uso y cuidados. ¿Te interesa?";
        } else {
          return "🔄 Perfecto. Trabajamos con Acuvue, Biofinity y Air Optix. ¿Querés reponer tu marca o ver otras?";
        }

      case 'confirmar_mapa':
        contexto.esperandoRespuesta = null;
        if (intent === 'mapa_confirmado' || mensaje.includes('si') || mensaje.includes('sí')) {
          return `🗺️ **Google Maps:** https://maps.google.com/?q=Serrano+684,+Villa+Crespo,+CABA\n\n📍 Serrano 684, Villa Crespo\n🚇 A 4 cuadras de Ángel Gallardo (subte B)`;
        } else {
          return "✅ Perfecto. Te esperamos en Serrano 684. ¿Necesitás saber algo más?";
        }

      default:
        contexto.esperandoRespuesta = null;
        return this.manejarRespuestaSimple(mensaje, contexto);
    }
  }

  manejarRespuestaSimple(mensaje, contexto) {
    if (mensaje === 'si' || mensaje === 'sí') {
      switch (contexto.ultimoTema) {
        case 'lentes_contacto':
          return "¿Es tu primera vez con lentes de contacto o ya tenés experiencia?";
        default:
          return "¿En qué más te puedo ayudar?";
      }
    }
    
    if (mensaje === 'no') {
      return "¿Te ayudo con algo más?";
    }

    return "🤔 No entendí. ¿Podés reformular?";
  }

  detectarProblemaSalud(mensaje) {
    const problemasSalud = ['dolor', 'duele', 'molestia', 'infección', 'visión borrosa', 'no veo'];
    return problemasSalud.some(problema => mensaje.includes(problema));
  }
}

// ==================== INICIALIZACIÓN ====================
const memoryService = new MemoryService();
const responseHandler = new ResponseHandler();

// ==================== RUTAS BÁSICAS ====================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    name: 'Luna - Hypnottica',
    version: '2.1 - Render Fix'
  });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Hypnottica - Bot</title></head>
      <body>
        <h1>🤖 Luna - Asistente Virtual</h1>
        <p>Servidor funcionando correctamente</p>
        <a href="/probador">Ir al probador</a>
      </body>
    </html>
  `);
});

// ==================== PROBADOR SIMPLIFICADO ====================
app.get('/probador', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Probador Bot</title>
        <style>
            body { font-family: Arial; margin: 20px; }
            .chat-container { height: 400px; border: 1px solid #ccc; padding: 10px; overflow-y: auto; margin-bottom: 10px; }
            .message { margin: 5px 0; padding: 10px; border-radius: 10px; }
            .user { background: #007bff; color: white; margin-left: 20%; }
            .bot { background: #f1f1f1; margin-right: 20%; }
            input { width: 70%; padding: 10px; }
            button { padding: 10px; }
        </style>
    </head>
    <body>
        <h1>🤖 Probador - Luna</h1>
        <div class="chat-container" id="chat">
            <div class="message bot">¡Hola! Soy Luna. ¿En qué puedo ayudarte?</div>
        </div>
        <input type="text" id="input" placeholder="Escribe tu mensaje...">
        <button onclick="sendMessage()">Enviar</button>
        
        <script>
            async function sendMessage() {
                const input = document.getElementById('input');
                const message = input.value;
                const chat = document.getElementById('chat');
                
                if (!message) return;
                
                // Agregar mensaje usuario
                chat.innerHTML += '<div class="message user">' + message + '</div>';
                input.value = '';
                
                // Respuesta del bot
                try {
                    const response = await fetch('/probar-bot', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mensaje: message })
                    });
                    const data = await response.json();
                    chat.innerHTML += '<div class="message bot">' + data.respuesta + '</div>';
                } catch (error) {
                    chat.innerHTML += '<div class="message bot">❌ Error de conexión</div>';
                }
                
                chat.scrollTop = chat.scrollHeight;
            }
            
            document.getElementById('input').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') sendMessage();
            });
        </script>
    </body>
    </html>
  `);
});

app.post('/probar-bot', async (req, res) => {
  try {
    const { mensaje } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({ error: 'Falta mensaje' });
    }
    
    const userId = 'web-user';
    let contexto = memoryService.obtenerContextoUsuario(userId);
    
    const respuesta = await responseHandler.generarRespuesta(mensaje, contexto);
    
    memoryService.guardarContextoUsuario(userId, contexto);
    
    res.json({
      respuesta: respuesta,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      respuesta: "❌ Error interno del servidor"
    });
  }
});

// ==================== CONFIGURACIÓN RENDER.COM ====================
const PORT = process.env.PORT || 3000;

// Ruta específica para el webhook de Render
app.get('/webhook', (req, res) => {
  res.json({ status: 'Webhook configurado' });
});

app.post('/webhook', (req, res) => {
  res.status(200).send('OK');
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 Luna funcionando en puerto ${PORT}`);
  console.log(`✅ Listo para Render.com`);
});

module.exports = app;
