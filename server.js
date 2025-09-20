const express = require('express');
const twilio = require('twilio');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==================== CONFIGURACIÓN INICIAL ====================
const personalidad = {
  nombre: "Luna",
  emojis: ["👋", "👓", "🔍", "💡", "📍", "⏳", "💎", "🔊", "🌟", "📌", "🏥"],
  velocidadRespuesta: { min: 800, max: 2500 }
};

// Obras sociales que aceptan
const obrasSociales = [
  "Swiss Medical",
  "Medicus",
  "Construir Salud",
  "Osetya"
];

// Sistema de memoria adaptable
let memoriaUsuarios = new Map();
let redisClient = null;

// Intentar conectar a Redis si existe la URL
(async () => {
  if (process.env.REDIS_URL) {
    try {
      const redis = require('redis');
      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 10000,
          timeout: 10000
        }
      });
      
      redisClient.on('error', (err) => {
        console.log('Redis usando memoria volátil:', err.message);
        redisClient = null;
      });
      
      await redisClient.connect();
      console.log('✅ Conectado a Redis Cloud');
    } catch (error) {
      console.log('❌ Redis no disponible, usando memoria volátil');
      redisClient = null;
    }
  } else {
    console.log('ℹ️  REDIS_URL no configurada, usando memoria volátil');
  }
})();

// ==================== FUNCIONES DE MEMORIA ====================
async function obtenerContextoUsuario(senderId) {
  try {
    if (redisClient) {
      const contexto = await redisClient.get(`contexto:${senderId}`);
      return contexto ? JSON.parse(contexto) : { 
        paso: 0, 
        datos: {}, 
        ultimaInteraccion: Date.now(),
        historial: [] 
      };
    } else {
      return memoriaUsuarios.get(senderId) || { 
        paso: 0, 
        datos: {}, 
        ultimaInteraccion: Date.now(),
        historial: [] 
      };
    }
  } catch (error) {
    console.error('Error obteniendo contexto:', error);
    return { paso: 0, datos: {}, ultimaInteraccion: Date.now(), historial: [] };
  }
}

async function guardarContextoUsuario(senderId, contexto) {
  try {
    contexto.ultimaInteraccion = Date.now();
    
    if (redisClient) {
      await redisClient.setex(`contexto:${senderId}`, 3600, JSON.stringify(contexto));
    } else {
      memoriaUsuarios.set(senderId, contexto);
    }
  } catch (error) {
    console.error('Error guardando contexto:', error);
  }
}

// ==================== FUNCIÓN PARA OBTENER PRODUCTOS (ESTRUCTURA EXACTA) ====================
async function obtenerProductosDeSheet(sheetTitle) {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID);
    
    // FORMA CORRECTA DE AUTENTICACIÓN
    const credentials = require(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    await doc.useServiceAccountAuth(credentials);
    
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) {
      console.error(`No se encontró la hoja: '${sheetTitle}'`);
      return [];
    }
    
    // Cargar filas a partir de la fila 4 (índice 3 para getRows)
    const rows = await sheet.getRows();
    
    const productos = [];
    
    // Leer cada fila empezando desde la fila 4 (índice 3 en el array)
    for (let i = 3; i < rows.length; i++) {
      const row = rows[i];
      
      // Leer las columnas EXACTAS como están en tu sheet
      const codigo = row['F'] || ''; // F = COD. HYPNO (columna F)
      const marca = row['C'] || '';  // C = Marca (columna C)
      const solReceta = row['E'] || ''; // E = Sol/Receta (columna E)
      const modelo = row['G'] || ''; // G = Modelo (columna G)
      const color = row['H'] || '';  // H = Color (columna H)
      const cantidad = row['I'] || '0'; // I = Cantidad (columna I)
      const precio = row['P'] || ''; // P = PRECIO (columna P)
      const descripcion = row['T'] || ''; // T = Descripciones (columna T)
      
      // Solo agregar productos que tengan marca o modelo
      if (marca.trim() !== '' || modelo.trim() !== '') {
        productos.push({
          codigo: codigo.trim(),
          marca: marca.trim(),
          sol_receta: solReceta.trim(),
          modelo: modelo.trim(),
          color: color.trim(),
          cantidad: cantidad.trim(),
          precio: precio.trim(),
          descripcion: descripcion.trim(),
          categoria: sheetTitle
        });
      }
    }
    
    console.log(`✅ Obtenidos ${productos.length} productos de ${sheetTitle}`);
    return productos;
  } catch (error) {
    console.error(`Error obteniendo productos de ${sheetTitle}:`, error);
    return [];
  }
}

// ==================== FUNCIÓN PARA OBTENER TODOS LOS PRODUCTOS ====================
async function obtenerTodosProductos() {
  try {
    const sheets = [
      process.env.SHEETS_ARMAZONES || 'STOCK ARMAZONES 1',
      process.env.SHEETS_ACCESORIOS,
      process.env.SHEETS_LC,
      process.env.SHEETS_LIQUIDOS
    ].filter(Boolean);

    let todosProductos = [];
    
    for (const sheet of sheets) {
      const productos = await obtenerProductosDeSheet(sheet);
      todosProductos = todosProductos.concat(productos);
    }
    
    console.log(`📊 Total de productos en stock: ${todosProductos.length}`);
    return todosProductos;
  } catch (error) {
    console.error('Error obteniendo todos los productos:', error);
    return [];
  }
}

// ==================== FUNCIÓN PARA OBTENER MARCAS REALES ====================
async function obtenerMarcasReales() {
  try {
    const productos = await obtenerTodosProductos();
    const marcas = new Set();
    
    productos.forEach(producto => {
      if (producto.marca && producto.marca.trim() !== '') {
        marcas.add(producto.marca.trim());
      }
    });
    
    const marcasArray = Array.from(marcas).sort();
    console.log(`🏷️ Marcas detectadas: ${marcasArray.join(', ')}`);
    return marcasArray;
  } catch (error) {
    console.error('Error obteniendo marcas:', error);
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

// ==================== FUNCIÓN BUSCAR EN SHEETS (ESTRUCTURA EXACTA) ====================
async function searchInSheet(code) {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID);
    
    // FORMA CORRECTA DE AUTENTICACIÓN
    const credentials = require(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    await doc.useServiceAccountAuth(credentials);
    
    await doc.loadInfo();

    const sheets = [
      process.env.SHEETS_ARMAZONES || 'STOCK ARMAZONES 1',
      process.env.SHEETS_ACCESORIOS,
      process.env.SHEETS_LC,
      process.env.SHEETS_LIQUIDOS
    ].filter(Boolean);

    for (const sheetTitle of sheets) {
      const sheet = doc.sheetsByTitle[sheetTitle];
      if (!sheet) continue;

      const rows = await sheet.getRows();
      
      // Buscar en todas las filas a partir de la fila 4
      for (let i = 3; i < rows.length; i++) {
        const row = rows[i];
        const rowCode = row['F'] || ''; // COD. HYPNO en columna F
        
        if (rowCode && rowCode.trim().toLowerCase() === code.trim().toLowerCase()) {
          return {
            categoria: sheetTitle,
            codigo: rowCode.trim(),
            marca: (row['C'] || '').trim(), // Marca en columna C
            sol_receta: (row['E'] || '').trim(), // Sol/Receta en columna E
            modelo: (row['G'] || '').trim(), // Modelo en columna G
            color: (row['H'] || '').trim(), // Color en columna H
            cantidad: (row['I'] || '0').trim(), // Cantidad en columna I
            precio: (row['P'] || '').trim(), // PRECIO en columna P
            descripcion: (row['T'] || '').trim() // Descripciones en columna T
          };
        }
      }
    }
    
    console.log(`❌ Código no encontrado: ${code}`);
    return null;
  } catch (error) {
    console.error('Error buscando en Sheet:', error);
    return null;
  }
}

// ==================== BÚSQUEDA INTELIGENTE POR DESCRIPCIÓN ====================
async function buscarPorDescripcion(descripcion) {
  try {
    const todosProductos = await obtenerTodosProductos();
    
    // Filtrar productos con stock
    const productosConStock = todosProductos.filter(p => {
      const stock = parseInt(p.cantidad) || 0;
      return stock > 0;
    });
    
    if (productosConStock.length === 0) {
      console.log('⚠️ No hay productos con stock');
      return [];
    }
    
    const prompt = `Cliente busca: "${descripcion}".

Productos disponibles en stock (formato: CODIGO|MARCA|MODELO|COLOR|PRECIO|CATEGORIA|DESCRIPCION):
${productosConStock.map(p => 
  `${p.codigo}|${p.marca}|${p.modelo}|${p.color}|${p.precio}|${p.categoria}|${p.descripcion}`
).join('\n')}

INSTRUCCIONES CRÍTICAS:
1. Buscá productos que coincidan con la descripción del cliente
2. Considerá la DESCRIPCIÓN de cada producto
3. Si no hay coincidencia exacta, buscá ALGO SIMILAR
4. Respondé SOLO con los códigos separados por coma

Ejemplo: "AC-123, XY-456, ZZ-789"`;

    const respuestaIA = await consultarIA(prompt);
    
    const codigos = respuestaIA.split(',').map(cod => cod.trim()).filter(cod => cod !== '');
    
    const productosEncontrados = [];
    for (const codigo of codigos.slice(0, 3)) {
      const producto = productosConStock.find(p => p.codigo && p.codigo.toLowerCase() === codigo.toLowerCase());
      if (producto) productosEncontrados.push(producto);
    }
    
    console.log(`🔍 Búsqueda: "${descripcion}" -> Encontrados: ${productosEncontrados.length} productos`);
    return productosEncontrados;
    
  } catch (error) {
    console.error('Error en búsqueda inteligente:', error);
    return [];
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

// ==================== DETECTAR OBRA SOCIAL EN MENSAJE ====================
function detectarObraSocial(mensaje) {
  const msg = mensaje.toLowerCase();
  const obrasDetectadas = obrasSociales.filter(obra => 
    msg.includes(obra.toLowerCase())
  );
  
  return obrasDetectadas.length > 0 ? obrasDetectadas[0] : null;
}

// ==================== DETECTAR MARCA EN MENSAJE ====================
async function detectarMarca(mensaje) {
  try {
    const marcasReales = await obtenerMarcasReales();
    const msg = mensaje.toLowerCase();
    
    const marcaDetectada = marcasReales.find(marca => 
      msg.includes(marca.toLowerCase())
    );
    
    return marcaDetectada || null;
  } catch (error) {
    console.error('Error detectando marca:', error);
    return null;
  }
}

// ==================== PROCESAMIENTO PRINCIPAL DE MENSAJES ====================
async function procesarMensaje(mensaje, contexto, senderId) {
  const messageLower = mensaje.toLowerCase();
  let respuesta = '';

  // Saludo inicial
  if (messageLower.includes('hola') || messageLower === 'hi' || messageLower === '👋') {
    contexto.paso = 0;
    const emoji = personalidad.emojis[Math.floor(Math.random() * personalidad.emojis.length)];
    respuesta = `${emoji} ¡Hola! Soy ${personalidad.nombre}, tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy?\n\n• Consultar stock\n• Precios\n• Agendar cita\n• Obras sociales\n• Ubicación y horarios`;

  // Buscar stock por código
  } else if (messageLower.startsWith('#stock ') || messageLower.startsWith('stock ')) {
    let code = messageLower.startsWith('#stock ') ? mensaje.split(' ')[1] : mensaje.split(' ')[1];
    
    if (!code) {
      respuesta = "❌ Contame el código del modelo que te interesa, por ejemplo: \"AC-274\"";
    } else {
      const product = await searchInSheet(code);
      
      if (product) {
        const descripcion = product.descripcion ? `\n📝 *Descripción:* ${product.descripcion}` : '';
        const solReceta = product.sol_receta ? `\n👁️  *Tipo:* ${product.sol_receta}` : '';
        
        respuesta = `
🏷️  *Código:* ${product.codigo || 'N/A'}
📦  *Categoría:* ${product.categoria}
👓  *Marca:* ${product.marca || ''}
🔄  *Modelo:* ${product.modelo || ''}
🎨  *Color:* ${product.color || 'N/A'}${solReceta}${descripcion}
📊  *Stock:* ${product.cantidad || '0'} unidades
💲  *Precio:* $${product.precio || 'N/A'}
        `;
      } else {
        respuesta = "❌ *Producto no encontrado.* Verificá el código o describime lo que buscás.";
      }
    }

  // Búsqueda por descripción
  } else if (messageLower.includes('busco') || messageLower.includes('quiero') || messageLower.includes('tene') ||
             messageLower.includes('redondo') || messageLower.includes('cuadrado') || messageLower.includes('ovalado') ||
             messageLower.includes('aviador') || messageLower.includes('wayfarer') || messageLower.includes('rectangular') ||
             messageLower.includes('metal') || messageLower.includes('acetato') || messageLower.includes('chico') ||
             messageLower.includes('grande') || messageLower.includes('mediano') || messageLower.includes('estilo')) {
    
    respuesta = "🔍 *Buscando en nuestro stock...* Un momento por favor.";
    const productosEncontrados = await buscarPorDescripcion(mensaje);
    
    if (productosEncontrados.length > 0) {
      respuesta = `🔍 *Encontré estas opciones para vos:*\n\n`;
      
      productosEncontrados.forEach((producto, index) => {
        const desc = producto.descripcion ? ` - ${producto.descripcion}` : '';
        respuesta += `${index + 1}. *${producto.codigo}* - ${producto.marca} ${producto.modelo}${desc} - $${producto.precio}\n`;
      });
      
      respuesta += `\n*Escribí #stock [código] para más detalles de cada uno.*`;
    } else {
      respuesta = "❌ *No encontré productos que coincidan.*\n\nProbá ser más específico o contactá a un asesor al *11 1234-5678*.";
    }

  // Obras sociales
  } else if (messageLower.includes('obra social') || messageLower.includes('prepaga') || 
             messageLower.includes('swiss') || messageLower.includes('medicus') ||
             messageLower.includes('construir') || messageLower.includes('osetya') ||
             messageLower.includes('cobertura') || messageLower.includes('beneficio')) {
    
    const obraDetectada = detectarObraSocial(mensaje);
    
    if (obraDetectada) {
      respuesta = `🏥 *Trabajamos con ${obraDetectada}* ✅\n\nPodés acercarte con tu credencial y te ayudamos con todo el trámite. También podés consultarnos por WhatsApp al *11 1234-5678* para más información.`;
    } else {
      respuesta = `🏥 *Obras Sociales que aceptamos:*\n\n${obrasSociales.map(os => `• ${os}`).join('\n')}\n\n¿Tenés alguna de estas? Podés acercarte con tu credencial y te ayudamos con el trámite.`;
    }

  // Marcas específicas
  } else if (await detectarMarca(messageLower)) {
    const marca = await detectarMarca(messageLower);
    respuesta = `✅ *Sí, trabajamos con ${marca}* 👓\n\nTenemos varios modelos disponibles. ¿Buscás algo en particular de ${marca} o querés que te muestre opciones?`;

  // Marcas disponibles
  } else if (messageLower.includes('marca') || messageLower.includes('que tienen') || messageLower.includes('que marcas')) {
    
    try {
      const marcasReales = await obtenerMarcasReales();
      if (marcasReales.length > 0) {
        respuesta = `👓 *Marcas que trabajamos:*\n\n${marcasReales.map(m => `• ${m}`).join('\n')}\n\n¿Te interesa alguna en particular?`;
      } else {
        respuesta = "✅ Trabajamos con las mejores marcas del mercado. ¿Buscás alguna en particular?";
      }
    } catch (error) {
      respuesta = "✅ Trabajamos con las mejores marcas del mercado. ¿Buscás alguna en particular?";
    }

  // Agendar turno
  } else if (messageLower.includes('agendar') || messageLower.includes('turno') || messageLower.includes('cita')) {
    respuesta = "📅 Para agendar una cita, podés llamarnos al *11 1234-5678* o visitarnos en *Serrano 684, Villa Crespo*.";

  // Dirección u horarios
  } else if (messageLower.includes('dirección') || messageLower.includes('donde') || messageLower.includes('ubic')) {
    respuesta = "📍 *HYPNOTTICA*\nSerrano 684, Villa Crespo. CABA.\n\n*Horarios:*\nLunes a Sábados: 10:30 - 19:30\n\n*Teléfono:* 11 1234-5678";

  // Precios
  } else if (messageLower.includes('precio') || messageLower.includes('cuesta') || messageLower.includes('valor')) {
    respuesta = "💎 *Tenemos precios para todos los presupuestos*\n\nDesde armazones económicos hasta primeras marcas. ¿Buscás algo en particular o querés que te recomiende según tu presupuesto?";

  } else {
    // Consulta a IA con información real
    try {
      const marcasReales = await obtenerMarcasReales();
      const marcasTexto = marcasReales.join(', ');
      
      const promptIA = `Eres ${personalidad.nombre}, asistente de Hypnottica óptica.
INFORMACIÓN REAL:
- Marcas disponibles: ${marcasTexto}
- Obras sociales: ${obrasSociales.join(', ')}
- Dirección: Serrano 684, Villa Crespo, CABA
- Horarios: Lunes a Sábados 10:30-19:30
- Teléfono: 11 1234-5678

Cliente pregunta: "${mensaje}".
Responde de manera profesional con información verificada. Si no sabés algo, decí la verdad.`;

      respuesta = await consultarIA(promptIA);
      
      if (!respuesta || respuesta.length < 5) {
        respuesta = obtenerFallbackAleatorio();
      }
    } catch (error) {
      respuesta = obtenerFallbackAleatorio();
    }
  }

  return respuesta;
}

// ==================== RUTA PRINCIPAL WHATSAPP ====================
app.post('/webhook', async (req, res) => {
  try {
    const incomingMessage = req.body.Body.trim();
    const senderId = req.body.From;
    console.log(`📩 Mensaje de ${senderId}: ${incomingMessage}`);

    const contexto = await obtenerContextoUsuario(senderId);
    const responseMessage = await procesarMensaje(incomingMessage, contexto, senderId);
    await guardarContextoUsuario(senderId, contexto);
    
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(responseMessage);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
    
  } catch (error) {
    console.error('Error en el servidor:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('⚠️ Estoy teniendo problemas técnicos. Por favor, intentá de nuevo.');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// ==================== RUTAS ADICIONALES ====================
app.get('/status', async (req, res) => {
  try {
    const marcasReales = await obtenerMarcasReales();
    
    res.json({ 
      status: 'ok', 
      name: personalidad.nombre,
      version: '2.3',
      redis: redisClient ? 'conectado' : 'memoria volátil',
      obras_sociales: obrasSociales,
      marcas_disponibles: marcasReales,
      total_marcas: marcasReales.length
    });
  } catch (error) {
    res.json({ 
      status: 'ok', 
      name: personalidad.nombre,
      version: '2.3',
      redis: redisClient ? 'conectado' : 'memoria volátil',
      obras_sociales: obrasSociales
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ==================== INICIO SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 ${personalidad.nombre} escuchando en puerto ${PORT}`);
  console.log(`⭐ Bot v2.3 - Con estructura exacta del Google Sheet`);
  console.log(`🏥 Obras sociales: ${obrasSociales.join(', ')}`);
  console.log(`📊 Leyendo columnas: C(Marca), E(Sol/Receta), F(COD.HYPNO), G(Modelo), H(Color), I(Cantidad), P(PRECIO), T(Descripciones)`);
});
