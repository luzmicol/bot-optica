const express = require('express');
const twilio = require('twilio');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const redis = require('redis');
const textToSpeech = require('@google-cloud/text-to-speech');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==================== CONFIGURACIÓN INICIAL ====================
const personalidad = {
  nombre: "Luna",
  tono: "amigable pero profesional",
  emojis: ["👋", "👓", "🔍", "💡", "📍", "⏳", "💎", "🔊", "🌟", "📌"],
  velocidadRespuesta: { min: 1000, max: 3000 }
};

// Configuración de Redis (para memoria de conversación)
let redisClient;
(async () => {
  if (process.env.REDIS_URL) {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    await redisClient.connect();
    console.log('Conectado a Redis');
  } else {
    console.log('Redis no configurado, usando memoria volátil');
    // Implementación simple en memoria para desarrollo
    redisClient = {
      store: new Map(),
      async get(key) { return this.store.get(key); },
      async setex(key, exp, value) { this.store.set(key, value); setTimeout(() => this.store.delete(key), exp*1000); },
      async set(key, value) { this.store.set(key, value); },
      async exists(key) { return this.store.has(key); }
    };
  }
})();

// Cliente de Text-to-Speech (opcional)
let ttsClient;
if (process.env.GOOGLE_TTS_KEY) {
  ttsClient = new textToSpeech.TextToSpeechClient();
}

// ==================== FUNCIONES DE MEMORIA Y CONTEXTO ====================
async function obtenerContextoUsuario(senderId) {
  try {
    const contexto = await redisClient.get(`contexto:${senderId}`);
    return contexto ? JSON.parse(contexto) : { 
      paso: 0, 
      datos: {}, 
      ultimaInteraccion: Date.now(),
      historial: [] 
    };
  } catch (error) {
    console.error('Error obteniendo contexto:', error);
    return { paso: 0, datos: {}, ultimaInteraccion: Date.now(), historial: [] };
  }
}

async function guardarContextoUsuario(senderId, contexto) {
  try {
    contexto.ultimaInteraccion = Date.now();
    await redisClient.setex(`contexto:${senderId}`, 3600, JSON.stringify(contexto));
  } catch (error) {
    console.error('Error guardando contexto:', error);
  }
}

async function registrarInteraccion(senderId, mensaje, respuesta, efectiva = true) {
  try {
    const historial = await redisClient.get(`historial:${senderId}`) || "[]";
    const parsedHistorial = JSON.parse(historial);
    
    parsedHistorial.push({
      timestamp: Date.now(),
      mensaje,
      respuesta,
      efectiva
    });
    
    // Mantener solo las últimas 50 interacciones
    if (parsedHistorial.length > 50) {
      parsedHistorial.shift();
    }
    
    await redisClient.setex(`historial:${senderId}`, 86400, JSON.stringify(parsedHistorial)); // 24 horas
  } catch (error) {
    console.error('Error registrando interacción:', error);
  }
}

// ==================== FUNCIÓN PARA OBTENER TODOS LOS PRODUCTOS ====================
async function obtenerTodosProductos() {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID);
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[process.env.SHEETS_ARMAZONES || 'STOCK ARMAZONES 1'];
    if (!sheet) return [];
    
    await sheet.loadHeaderRow(3);
    const rows = await sheet.getRows();
    
    // Extraer todos los productos con la estructura exacta de tu sheet
    const productos = [];
    rows.forEach(row => {
      if (row['Marca'] && row['Marca'].trim() !== '') {
        productos.push({
          codigo: row['COD. HYPNO'] || '',
          marca: row['Marca'] || '',
          sol_receta: row['Sol/Receta'] || '',
          modelo: row['Modelo'] || '',
          color: row['Color'] || '',
          precio: row['PRECIO'] || '',
          cantidad: row['Cantidad'] || '0'
        });
      }
    });
    
    return productos;
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    return [];
  }
}

// ==================== FUNCIÓN PARA OBTENER MARCAS ÚNICAS ====================
async function obtenerMarcasUnicas() {
  const productos = await obtenerTodosProductos();
  const marcas = new Set();
  
  productos.forEach(producto => {
    if (producto.marca) marcas.add(producto.marca.trim());
  });
  
  return Array.from(marcas).sort();
}

// ==================== BÚSQUEDA INTELIGENTE POR DESCRIPCIÓN ====================
async function buscarPorDescripcion(descripcion) {
  try {
    const todosProductos = await obtenerTodosProductos();
    
    // Filtrar productos con stock
    const productosConStock = todosProductos.filter(p => parseInt(p.cantidad) > 0);
    
    const prompt = `Cliente busca: "${descripcion}".

Productos disponibles en stock (formato: CODIGO|MARCA|MODELO|COLOR|PRECIO):
${productosConStock.map(p => 
  `${p.codigo}|${p.marca}|${p.modelo}|${p.color}|${p.precio}`
).join('\n')}

INSTRUCCIONES CRÍTICAS:
1. ENTENDÉ FORMAS: "rectangular" = cuadrado, angular, bordes rectos
2. "aviador" = estilo piloto, doble puente, teja
3. "wayfarer" = estilo cuadrado, grueso, clásico
4. "redondo" = circular, ovalado, sin esquinas
5. Si no hay coincidencia exacta, buscá ALGO SIMILAR

Analiza la descripción y selecciona los 3 productos que mejor coincidan. 
Responde SOLO con los códigos separados por coma, en orden de relevancia.

Ejemplo: "AC-123, XY-456, ZZ-789"`;

    const respuestaIA = await consultarIA(prompt);
    
    // Extraer códigos de la respuesta
    const codigos = respuestaIA.split(',').map(cod => cod.trim()).filter(cod => cod !== '');
    
    // Buscar los productos completos por código
    const productosEncontrados = [];
    for (const codigo of codigos.slice(0, 3)) {
      const producto = productosConStock.find(p => p.codigo.toLowerCase() === codigo.toLowerCase());
      if (producto) productosEncontrados.push(producto);
    }
    
    return productosEncontrados;
    
  } catch (error) {
    console.error('Error en búsqueda inteligente:', error);
    return [];
  }
}

// ==================== FUNCIÓN OPENAI (GPT-4o-mini) ====================
async function consultarIA(prompt) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error("OpenAI API Key no configurada");
    return "";
  }
  
  const url = 'https://api.openai.com/v1/chat/completions';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user', 
          content: prompt
        }],
        max_tokens: 150,
        temperature: 0.3
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      return "";
    }
    
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "";
  }
}

// ==================== FUNCIÓN BUSCAR EN SHEETS ====================
async function searchInSheet(sheetName, code) {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID);
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      console.error(`No se encontró la hoja: '${sheetName}'`);
      return null;
    }

    await sheet.loadHeaderRow(3);
    const rows = await sheet.getRows();
    
    const foundRow = rows.find(row => {
      const rowCode = row['COD. HYPNO'];
      return rowCode && rowCode.toLowerCase().trim() === code.toLowerCase().trim();
    });
    return foundRow;
  } catch (error) {
    console.error('Error buscando en Sheet:', error);
    return null;
  }
}

// ==================== ANÁLISIS DE SENTIMIENTO ====================
async function analizarSentimiento(texto) {
  const prompt = `Analiza el sentimiento del siguiente texto en español (0-100, donde 0 es muy negativo y 100 muy positivo): "${texto}". Responde solo con el número.`;
  
  try {
    const respuesta = await consultarIA(prompt);
    const sentimiento = parseInt(respuesta);
    return isNaN(sentimiento) ? 50 : Math.max(0, Math.min(100, sentimiento));
  } catch (error) {
    return 50; // Neutral por defecto
  }
}

// ==================== SISTEMA DE FALLBACK ====================
const respuestasFallback = [
  "No estoy segura de entenderte completamente. ¿Podrías reformular tu pregunta?",
  "Quiero asegurarme de ayudarte bien. ¿Te refieres a información sobre stock, precios o agendar una cita?",
  "Perdoná, no capté eso. ¿Podrías decirlo de otra forma?",
  "Voy a derivarte con un especialista que te puede ayudar mejor con eso.",
  "¿Podrías contarme más específicamente qué necesitas? Así puedo ayudarte mejor."
];

function obtenerFallbackAleatorio() {
  return respuestasFallback[Math.floor(Math.random() * respuestasFallback.length)];
}

// ==================== GENERACIÓN DE RESPUESTA DE VOZ (OPCIONAL) ====================
async function generarRespuestaVoz(texto) {
  if (!ttsClient || !process.env.GOOGLE_TTS_KEY) return null;

  try {
    const request = {
      input: { text: texto },
      voice: { languageCode: 'es-ES', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    return response.audioContent;
  } catch (error) {
    console.error('Error generando voz:', error);
    return null;
  }
}

// ==================== PROCESAMIENTO PRINCIPAL DE MENSAJES ====================
async function procesarMensaje(mensaje, contexto, senderId, nivelSentimiento) {
  const messageLower = mensaje.toLowerCase();
  let respuesta = '';

  // Saludo inicial con personalidad
  if (messageLower.includes('hola') || messageLower === 'hi' || messageLower === '👋' || 
      messageLower.includes('buenas') || messageLower.includes('qué tal')) {
    contexto.paso = 0;
    
    const emoji = personalidad.emojis[Math.floor(Math.random() * personalidad.emojis.length)];
    respuesta = `${emoji} ¡Hola! Soy ${personalidad.nombre}, tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy? Puedes preguntarme por:\n\n• Stock de armazones\n• Precios\n• Agendar una cita\n• Nuestra ubicación y horarios`;

  // Buscar stock por código
  } else if (messageLower.startsWith('#stock ') || messageLower.startsWith('stock ') || 
             /\b(stock|tenen|tienen|busco|consult)\b.*\b([A-Za-z0-9\-]+)\b/.test(messageLower)) {
    
    let code;
    if (messageLower.startsWith('#stock ')) {
      code = mensaje.split(' ')[1];
    } else if (messageLower.startsWith('stock ')) {
      code = mensaje.split(' ')[1];
    } else {
      const match = mensaje.match(/\b([A-Za-z0-9\-]+)\b/);
      code = match ? match[1] : null;
    }

    if (!code) {
      respuesta = "❌ Contame el código del modelo que te interesa, por ejemplo: \"AC-274\"";
    } else {
      const sheetName = process.env.SHEETS_ARMAZONES || 'STOCK ARMAZONES 1';
      const product = await searchInSheet(sheetName, code);
      
      if (product) {
        respuesta = `
🏷️  *Código:* ${product['COD. HYPNO']}
👓  *Modelo:* ${product['Marca']} ${product['Modelo']}
🎨  *Color:* ${product['Color']}
📦  *Stock:* ${product['Cantidad']} unidades
💲  *Precio:* $${product['PRECIO']}
        `;
        
        // Guardar en historial de consultas
        contexto.datos.ultimaConsulta = product['COD. HYPNO'];
      } else {
        respuesta = "❌ *Producto no encontrado.*\n\nVerificá el código e intentá nuevamente. Podés pedirme que te ayude a buscar describiendo el modelo que querés.";
      }
    }

  // Búsqueda inteligente por descripción
  } else if (messageLower.includes('busco') || messageLower.includes('quiero') || messageLower.includes('tene') || 
             messageLower.includes('aviador') || messageLower.includes('wayfarer') || messageLower.includes('redondo') ||
             messageLower.includes('rectangular') || messageLower.includes('cuadrado') || messageLower.includes('angular') ||
             messageLower.includes('ray-ban') || messageLower.includes('oakley') || messageLower.includes('carter') ||
             messageLower.includes('vulk') || messageLower.includes('estilo')) {
    
    respuesta = "🔍 *Buscando en nuestro stock...* Un momento por favor.";
    const productosEncontrados = await buscarPorDescripcion(mensaje);
    
    if (productosEncontrados.length > 0) {
      respuesta = `🔍 *Encontré estas opciones para vos:*\n\n`;
      
      productosEncontrados.forEach((producto, index) => {
        respuesta += `${index + 1}. *${producto.codigo}* - ${producto.marca} ${producto.modelo} ${producto.color} - $${producto.precio}\n`;
      });
      
      respuesta += `\n*Escribí #stock [código] para más detalles de cada uno.*`;
      contexto.datos.ultimaBusqueda = mensaje;
    } else {
      respuesta = "❌ *No encontré productos que coincidan.*\n\nProbá ser más específico o escribí el código del producto. También podés contactar a un asesor para ayuda personalizada.";
    }

  // Agendar o turno
  } else if (messageLower.includes('agendar') || messageLower.includes('turno') || 
             messageLower.includes('hora') || messageLower.includes('cita')) {
    
    if (contexto.paso === 0) {
      respuesta = `⏳ *Para agendar una cita, necesito algunos datos:*\n\n¿Para qué fecha te gustaría reservar? (por ejemplo: "15 de octubre" o "próxima semana")`;
      contexto.paso = 1;
      contexto.datos.tipoCita = 'optometria';
    } else if (contexto.paso === 1) {
      contexto.datos.fechaPreferencia = mensaje;
      respuesta = `📅 *Anotado preferencia para ${mensaje}.*\n\n¿Preferís turno mañana o tarde?`;
      contexto.paso = 2;
    } else if (contexto.paso === 2) {
      contexto.datos.turnoPreferencia = mensaje;
      respuesta = `👍 *Perfecto. Te confirmo que tenemos disponibilidad para ${contexto.datos.fechaPreferencia} a la ${mensaje}.*\n\n¿Podrías decirme tu nombre y teléfono para confirmar la cita?`;
      contexto.paso = 3;
    } else if (contexto.paso === 3) {
      // Aquí normalmente conectarías con tu sistema de calendario
      respuesta = `✅ *¡Cita agendada exitosamente!*\n\nResumen:\n- Fecha: ${contexto.datos.fechaPreferencia}\n- Turno: ${contexto.datos.turnoPreferencia}\n- Contacto: ${mensaje}\n\nTe esperamos en *Hypnottica*, Serrano 684, Villa Crespo. CABA. ¡No faltes!`;
      
      // Reiniciar contexto
      contexto.paso = 0;
      contexto.datos = {};
    }

  // Precios
  } else if (messageLower.includes('precio') || messageLower.includes('cuesta') || 
             messageLower.includes('sale') || messageLower.includes('valor')) {
    
    respuesta = "💎 *Tenemos precios para todos los presupuestos* 💎\n\nDesde armazones económicos hasta de primeras marcas. ¿Buscás algo en particular o querés que te recomiende según tu presupuesto?";

  // Dirección u horarios
  } else if (messageLower.includes('dirección') || messageLower.includes('donde') || 
             messageLower.includes('ubic') || messageLower.includes('horario') || 
             messageLower.includes('ubicacion') || messageLower.includes('local')) {
    
    respuesta = "📍 *Nuestra Dirección* 📍\n\n*HYPNOTTICA*\nSerrano 684, Villa Crespo. CABA.\n\n*Horarios:*\nLunes a Sábados: 10:30 - 19:30\n\n*Teléfono:* 11 1234-5678";

  // Hablar con humano
  } else if (messageLower.includes('humano') || messageLower.includes('persona') || 
             messageLower.includes('asesor') || messageLower.includes('telefono') ||
             messageLower.includes('llamar')) {
    
    respuesta = "🔊 Te derivo con un asesor. Por favor, espera un momento...\n\nMientras tanto, podés llamarnos al *11 1234-5678* o visitarnos en *Serrano 684, Villa Crespo*.";

  // Agradecimientos
  } else if (messageLower.includes('gracias') || messageLower.includes('thank')) {
    respuesta = `🌟 ¡De nada! Estoy aquí para ayudarte. ¿Necesitás algo más?`;

  // Despedidas
  } else if (messageLower.includes('chau') || messageLower.includes('adiós') || 
             messageLower.includes('bye') || messageLower.includes('nos vemos')) {
    
    respuesta = `👋 ¡Hasta pronto! Que tengas un excelente día. No dudes en escribirme si necesitás algo más.`;

  } else {
    // Consulta a IA para preguntas abiertas con contexto mejorado
    const marcasReales = await obtenerMarcasUnicas();
    const marcasTexto = marcasReales.join(', ');

    const promptIA = `Eres ${personalidad.nombre}, un asistente de la óptica Hypnottica. 
INFORMACIÓN REAL ACTUALIZADA:
- Marcas disponibles: ${marcasTexto}
- Dirección: Serrano 684, Villa Crespo, CABA
- Horarios: Lunes a Sábados 10:30-19:30
- Teléfono: 11 1234-5678

Contexto de la conversación: ${JSON.stringify(contexto)}

Cliente pregunta: "${mensaje}". 
Responde de manera ${personalidad.tono}, usando emojis apropiados pero sin exagerar.
Si no sabés algo, decí la verdad y ofrecé ayudar con otra cosa.`;

    respuesta = await consultarIA(promptIA);
    
    // Si la IA no da una respuesta útil, usar fallback
    if (!respuesta || respuesta.length < 5) {
      respuesta = obtenerFallbackAleatorio();
    }
  }

  // Ajustar respuesta según sentimiento detectado
  if (nivelSentimiento < 30) {
    // Usuario frustrado o negativo
    respuesta = respuesta.replace('¡Hola!', 'Lamento escuchar que algo no está bien. ¡Hola!');
    if (!respuesta.includes('disculp') && !respuesta.includes('perdon')) {
      respuesta = 'Lamento las molestias. ' + respuesta;
    }
  } else if (nivelSentimiento > 70) {
    // Usuario positivo
    respuesta = respuesta.replace('¡Hola!', '¡Me alegra tu entusiasmo! ¡Hola!');
  }

  // Añadir toque personalizado aleatorio
  const frasesPersonalizadas = [
    "\n\n¿Hay algo más en lo que pueda ayudarte?",
    "\n\n¡Espero haberte sido de ayuda!",
    "\n\nNo dudes en preguntarme cualquier otra cosa.",
    "\n\n¿Necesitás información sobre algo más?"
  ];
  
  if (!respuesta.includes(frasesPersonalizadas[0]) && Math.random() > 0.5) {
    respuesta += frasesPersonalizadas[Math.floor(Math.random() * frasesPersonalizadas.length)];
  }

  return respuesta;
}

// ==================== RUTA PRINCIPAL WHATSAPP ====================
app.post('/webhook', async (req, res) => {
  try {
    const incomingMessage = req.body.Body.trim();
    const senderId = req.body.From;
    console.log(`Mensaje de ${senderId}: ${incomingMessage}`);

    // Obtener contexto previo
    const contexto = await obtenerContextoUsuario(senderId);
    
    // Analizar sentimiento
    const nivelSentimiento = await analizarSentimiento(incomingMessage);
    
    // Procesar mensaje
    const responseMessage = await procesarMensaje(incomingMessage, contexto, senderId, nivelSentimiento);
    
    // Actualizar contexto
    await guardarContextoUsuario(senderId, contexto);
    
    // Registrar interacción
    await registrarInteraccion(senderId, incomingMessage, responseMessage, true);
    
    // Simular tiempo de escritura humana
    const tiempoEscritura = Math.random() * 
      (personalidad.velocidadRespuesta.max - personalidad.velocidadRespuesta.min) + 
      personalidad.velocidadRespuesta.min;

    // Enviar respuesta después del delay simulado
    setTimeout(async () => {
      const twiml = new twilio.twiml.MessagingResponse();
      
      // Opcional: añadir respuesta de voz si está configurado
      if (ttsClient && process.env.GOOGLE_TTS_KEY && contexto.datos.enviarVoz) {
        const audioContent = await generarRespuestaVoz(responseMessage.replace(/[**]/g, ''));
        if (audioContent) {
          twiml.message({}, responseMessage);
          // Nota: Twilio necesita que el audio esté hospedado en una URL pública
          // twiml.message().media('URL_DEL_AUDIO');
        } else {
          twiml.message(responseMessage);
        }
      } else {
        twiml.message(responseMessage);
      }
      
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
    }, tiempoEscritura);
    
  } catch (error) {
    console.error('Error grave en el servidor:', error);
    // Aunque falle todo, respondemos algo a Twilio
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('⚠️ Estoy teniendo problemas técnicos momentáneos. Por favor, intentá de nuevo en un minuto.');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// ==================== RUTAS ADICIONALES ====================
// Ruta para estado del servicio
app.get('/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    name: personalidad.nombre,
    version: '2.0',
    features: ['memory', 'personality', 'sentiment-analysis', 'product-search']
  });
});

// Ruta para estadísticas (protegida)
app.get('/stats', async (req, res) => {
  // Aquí podrías implementar autenticación básica
  try {
    const keys = await redisClient.sendCommand(['KEYS', 'historial:*']);
    const totalInteractions = keys.length;
    
    res.json({
      totalUsers: totalInteractions,
      status: 'active',
      personality: personalidad.nombre
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// ==================== INICIO SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 ${personalidad.nombre} escuchando en puerto ${PORT}`);
  console.log(`⭐ Características activadas: Memoria de conversación, Personalidad, Análisis de sentimiento`);
});
