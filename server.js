const express = require('express');
const twilio = require('twilio');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==================== CONFIGURACIÓN INICIAL ====================
const personalidad = {
  nombre: "Luna",
  emojis: ["👋", "👓", "🔍", "💡", "📍", "⏳", "💎", "🔊", "🌟", "📌", "🏥", "📋", "👁️", "⏰", "🧴"],
  velocidadRespuesta: { min: 800, max: 2500 }
};

// Obras sociales que aceptan
const obrasSociales = [
  "Swiss Medical",
  "Medicus",
  "Construir Salud",
  "Osetya"
];

// Horarios de atención
const horariosAtencion = {
  regular: "Lunes a Sábados: 10:30 - 19:30",
  adaptacionLC: "Lunes a Sábados: hasta las 18:30 (por la duración del procedimiento)"
};

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

// ==================== FUNCIÓN PARA OBTENER PRODUCTOS ====================
async function obtenerProductosDeSheet(sheetTitle) {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID);
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    
    await doc.useServiceAccountAuth({
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    });
    
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) {
      console.error(`No se encontró la hoja: '${sheetTitle}'`);
      return [];
    }
    
    await sheet.loadHeaderRow(3);
    const rows = await sheet.getRows();
    
    const productos = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const codigo = row['COD. HYPNO'] || row['Código'] || '';
      const marca = row['Marca'] || '';
      const solReceta = row['Sol/Receta'] || '';
      const modelo = row['Modelo'] || '';
      const color = row['Color'] || '';
      const cantidad = row['Cantidad'] || '0';
      const precio = row['PRECIO'] || '';
      const descripcion = row['Descripciones'] || '';
      
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

// ==================== FUNCIÓN PARA OBTENER MARCAS DE LENTES DE CONTACTO ====================
async function obtenerMarcasLC() {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID);
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    
    await doc.useServiceAccountAuth({
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    });
    
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[process.env.SHEETS_LC];
    if (!sheet) {
      console.error('No se encontró la hoja de Lentes de Contacto');
      return ['Acuvue', 'Air Optix', 'Biofinity', 'FreshLook'];
    }
    
    await sheet.loadHeaderRow(2);
    const rows = await sheet.getRows();
    
    const marcas = new Set();
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const marca = row['B'] || ''; // Columna B para marcas de LC
      if (marca.trim() !== '') {
        marcas.add(marca.trim());
      }
    }
    
    const marcasArray = Array.from(marcas).sort();
    console.log(`👁️ Marcas de LC detectadas: ${marcasArray.join(', ')}`);
    return marcasArray;
  } catch (error) {
    console.error('Error obteniendo marcas de LC:', error);
    return ['Acuvue', 'Air Optix', 'Biofinity', 'FreshLook'];
  }
}

// ==================== FUNCIÓN PARA OBTENER LÍQUIDOS ====================
async function obtenerLiquidos() {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID);
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    
    await doc.useServiceAccountAuth({
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    });
    
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[process.env.SHEETS_LIQUIDOS];
    if (!sheet) {
      console.error('No se encontró la hoja de Líquidos');
      return [{marca: 'Renu', tamano: '300ml'}, {marca: 'Opti-Free', tamano: '300ml'}];
    }
    
    await sheet.loadHeaderRow(2);
    const rows = await sheet.getRows();
    
    const liquidos = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const marca = row['B'] || ''; // Columna B para marcas
      const tamano = row['C'] || ''; // Columna C para tamaño
      
      if (marca.trim() !== '') {
        liquidos.push({
          marca: marca.trim(),
          tamano: tamano.trim() || 'Consultar'
        });
      }
    }
    
    console.log(`🧴 Líquidos detectados: ${liquidos.length} productos`);
    return liquidos;
  } catch (error) {
    console.error('Error obteniendo líquidos:', error);
    return [{marca: 'Renu', tamano: '300ml'}, {marca: 'Opti-Free', tamano: '300ml'}];
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
    console.error('Error obteniendo marcas, usando marcas por defecto:', error);
    return ['Ray-Ban', 'Oakley', 'Vulk', 'Carter', 'Sarkany', 'Acuvue', 'Rusty'];
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
async function searchInSheet(code) {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID);
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    
    await doc.useServiceAccountAuth({
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    });
    
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

      await sheet.loadHeaderRow(3);
      const rows = await sheet.getRows();
      
      const foundRow = rows.find(row => {
        const rowCode = row['COD. HYPNO'] || row['Código'];
        return rowCode && rowCode.toLowerCase().trim() === code.toLowerCase().trim();
      });
      
      if (foundRow) {
        return {
          categoria: sheetTitle,
          codigo: foundRow['COD. HYPNO'] || '',
          marca: foundRow['Marca'] || '',
          sol_receta: foundRow['Sol/Receta'] || '',
          modelo: foundRow['Modelo'] || '',
          color: foundRow['Color'] || '',
          cantidad: foundRow['Cantidad'] || '0',
          precio: foundRow['PRECIO'] || '',
          descripcion: foundRow['Descripciones'] || ''
        };
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
    
    const productosConStock = todosProductos.filter(p => {
      const stock = parseInt(p.cantidad) || 0;
      return stock > 0;
    });
    
    if (productosConStock.length === 0) {
      console.log('⚠️ No hay productos con stock, usando ejemplos');
      return [
        { codigo: "AC-274", marca: "Ray-Ban", modelo: "Aviador", color: "Oro", precio: "15000", descripcion: "Estilo aviador metal", categoria: "Armazones" },
        { codigo: "VK-123", marca: "Vulk", modelo: "Wayfarer", color: "Negro", precio: "12000", descripcion: "Acetato clásico", categoria: "Armazones" },
        { codigo: "SK-456", marca: "Sarkany", modelo: "Redondo", color: "Plateado", precio: "18000", descripcion: "Metal redondo vintage", categoria: "Armazones" }
      ];
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
    return productosEncontrados.length > 0 ? productosEncontrados : productosConStock.slice(0, 3);
    
  } catch (error) {
    console.error('Error en búsqueda inteligente, usando ejemplos:', error);
    return [
      { codigo: "AC-274", marca: "Ray-Ban", modelo: "Aviador", color: "Oro", precio: "15000", descripcion: "Estilo aviador metal", categoria: "Armazones" },
      { codigo: "VK-123", marca: "Vulk", modelo: "Wayfarer", color: "Negro", precio: "12000", descripcion: "Acetato clásico", categoria: "Armazones" },
      { codigo: "SK-456", marca: "Sarkany", modelo: "Redondo", color: "Plateado", precio: "18000", descripcion: "Metal redondo vintage", categoria: "Armazones" }
    ];
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
             messageLower.includes('grande') || messageLower.includes('mediano') || messageLower.includes('estilo') ||
             messageLower.includes('lente de contacto') || messageLower.includes('lentilla') || messageLower.includes('contacto')) {
    
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

  // Obras sociales - INFORMACIÓN COMPLETA ACTUALIZADA
  } else if (messageLower.includes('obra social') || messageLower.includes('prepaga') || 
             messageLower.includes('swiss') || messageLower.includes('medicus') ||
             messageLower.includes('construir') || messageLower.includes('osetya') ||
             messageLower.includes('cobertura') || messageLower.includes('beneficio') ||
             messageLower.includes('receta') || messageLower.includes('oftalmologo') ||
             messageLower.includes('medico') || messageLower.includes('cobertura')) {
    
    const obraDetectada = detectarObraSocial(mensaje);
    
    if (obraDetectada) {
      respuesta = `🏥 *Trabajamos con ${obraDetectada}* ✅\n\n📋 *¡Importante! Para usar tu obra social necesitás:*\n\n` +
                 `👁️  *Receta médica OBLIGATORIA* con:\n` +
                 `• Nombre completo y matrícula del oftalmólogo\n` +
                 `• Tus datos personales (nombre, DNI)\n` +
                 `• Datos de la obra social y número de afiliado\n` +
                 `• Diagnóstico claro y detallado\n\n` +
                 `💡 *Recordá que:*\n` +
                 `• La receta tiene *validez de 60 días hábiles*\n` +
                 `• La obra social *solo cubre lo que indica la receta*\n` +
                 `• Si dice "lente de lejos", no cubre lentes de cerca\n` +
                 `• *No cubren lentes de contacto* con receta de armazones\n\n` +
                 `¿Tenés la receta? ¡Acercate y te ayudamos con todo! 📞 *11 1234-5678*`;
    } else {
      respuesta = `🏥 *Obras Sociales que aceptamos:*\n\n${obrasSociales.map(os => `• ${os}`).join('\n')}\n\n` +
                 `📋 *Requisitos importantes:*\n\n` +
                 `👁️  *Necesitás receta médica actualizada* (máximo 60 días)\n` +
                 `• Debe ser de un oftalmólogo matriculado\n` +
                 `• Con todos tus datos y los de la obra social\n` +
                 `• Indicando exactamente lo que necesitás\n\n` +
                 `💡 *La obra social solo cubre lo específicamente recetado.*\n\n` +
                 `¿Tenés alguna de estas obras sociales? 🎯`;
    }

  // Información específica sobre recetas
  } else if (messageLower.includes('receta') || messageLower.includes('validez') || 
             messageLower.includes('60 dias') || messageLower.includes('oftalmologo')) {
    
    respuesta = `📋 *Información sobre recetas médicas:*\n\n` +
               `👁️  *¿Qué necesita tu receta?*\n` +
               `• Nombre y matrícula del oftalmólogo\n` +
               `• Tus datos completos (nombre, DNI, fecha)\n` +
               `• Diagnóstico detallado y específico\n` +
               `• Datos de tu obra social\n\n` +
               `⏳ *Validez:* 60 días hábiles desde la emisión\n\n` +
               `🎯 *Importante:*\n` +
               `• La obra social *solo cubre exactamente lo recetado*\n` +
               `• Si dice "lente de lejos", no cubre lentes de cerca\n` +
               `• Receta de armazones ≠ cobertura para lentes de contacto\n\n` +
               `¿Necesitás más información? 📞 *11 1234-5678*`;

  // Lentes de contacto y marcas específicas
  } else if (messageLower.includes('lente de contacto') || messageLower.includes('lentilla') || 
             messageLower.includes('contacto') || messageLower.includes('lc')) {
    
    try {
      const marcasLC = await obtenerMarcasLC();
      respuesta = `👁️  *Lentes de Contacto que trabajamos:*\n\n${marcasLC.map(m => `• ${m}`).join('\n')}\n\n` +
                 `💡 *Servicios disponibles:*\n` +
                 `• Adaptación para primeros usuarios\n` +
                 `• Enseñanza de colocación y cuidado\n` +
                 `• Control de refracción para verificar recetas\n\n` +
                 `⏰ *Agendá tu cita de adaptación hasta 1 hora antes del cierre*`;
    } catch (error) {
      respuesta = `👁️  *Trabajamos con las mejores marcas de lentes de contacto:*\n\n• Acuvue\n• Air Optix\n• Biofinity\n• FreshLook\n\n` +
                 `💡 *Ofrecemos adaptación para primeros usuarios y controles de refracción.*\n\n` +
                 `⏰ *Agendá tu cita hasta 1 hora antes del cierre*`;
    }

  // Líquidos para lentes de contacto
  } else if (messageLower.includes('liquido') || messageLower.includes('solucion') || 
             messageLower.includes('limpieza') || messageLower.includes('liquidos')) {
    
    try {
      const liquidos = await obtenerLiquidos();
      respuesta = `🧴 *Líquidos para lentes de contacto:*\n\n`;
      
      liquidos.forEach(liquido => {
        respuesta += `• ${liquido.marca} - ${liquido.tamano}\n`;
      });
      
      respuesta += `\n💧 *Tenemos soluciones de limpieza y mantenimiento*`;
    } catch (error) {
      respuesta = `🧴 *Líquidos para lentes de contacto:*\n\n• Renu - 300ml\n• Opti-Free - 300ml\n• AquaSoft - 300ml\n\n` +
                 `💧 *Soluciones de limpieza y mantenimiento disponibles*`;
    }

  // Agendar turno - INFORMACIÓN ACTUALIZADA
  } else if (messageLower.includes('agendar') || messageLower.includes('turno') || messageLower.includes('cita') ||
             messageLower.includes('adaptacion') || messageLower.includes('control')) {
    
    respuesta = `📅 *Servicios para agendar:*\n\n` +
               `👁️  *Control de refracción:*\n` +
               `• Verificación de recetas médicas\n` +
               `• Chequeo de que la graduación sea correcta\n\n` +
               `👁️  *Adaptación de lentes de contacto:*\n` +
               `• Enseñanza de colocación y remoción\n` +
               `• Instrucciones de cuidado
