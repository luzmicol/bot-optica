const express = require('express');
const twilio = require('twilio');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const fetch = require('node-fetch');
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

// ==================== FUNCIÓN PARA OBTENER PRECIOS REALES ====================
async function obtenerPreciosReales() {
  try {
    const productos = await obtenerTodosProductos();
    const preciosArmazones = productos
      .filter(p => p.categoria.includes('ARMAZON') && p.precio && !isNaN(parseFloat(p.precio)))
      .map(p => parseFloat(p.precio.replace('$', '').replace(',', '')))
      .filter(precio => precio > 0);
    
    if (preciosArmazones.length === 0) {
      return null;
    }
    
    const minPrice = Math.min(...preciosArmazones);
    const maxPrice = Math.max(...preciosArmazones);
    const avgPrice = Math.round(preciosArmazones.reduce((a, b) => a + b, 0) / preciosArmazones.length);
    
    return { min: minPrice, max: maxPrice, avg: avgPrice };
  } catch (error) {
    console.error('Error obteniendo precios reales:', error);
    return null;
  }
}

// ==================== FUNCIÓN PARA OBTENER MARCAS REALES ====================
async function obtenerMarcasReales() {
  try {
    const productos = await obtenerTodosProductos();
    const marcas = new Set();
    
    productos.forEach(producto => {
      if (producto.marca && producto.marca.trim() !== '' && 
          !producto.marca.toLowerCase().includes('sin marca') &&
          !producto.marca.toLowerCase().includes('varios')) {
        marcas.add(producto.marca.trim());
      }
    });
    
    const marcasArray = Array.from(marcas).sort();
    console.log(`🏷️ Marcas detectadas REALES: ${marcasArray.join(', ')}`);
    return marcasArray.length > 0 ? marcasArray : ['Ray-Ban', 'Oakley', 'Vulk', 'Carter', 'Sarkany'];
  } catch (error) {
    console.error('Error obteniendo marcas, usando marcas por defecto:', error);
    return ['Ray-Ban', 'Oakley', 'Vulk', 'Carter', 'Sarkany'];
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
  const messageLower = mensaje.toLowerCase().trim();
  let respuesta = '';

  console.log(`🔍 Procesando: "${mensaje}" -> Contexto paso: ${contexto.paso}`);

  // Saludo inicial - MÁS FLEXIBLE
  if (contexto.paso === 0 || 
      messageLower.includes('hola') || 
      messageLower === 'hi' || 
      messageLower === '👋' ||
      messageLower.includes('buenas') ||
      messageLower.includes('buenos')) {
    
    contexto.paso = 1;
    const emoji = personalidad.emojis[Math.floor(Math.random() * personalidad.emojis.length)];
    respuesta = `${emoji} ¡Hola! Soy ${personalidad.nombre}, tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy?\n\n` +
                `• *Consultar stock* - Decíme "stock" o el código del producto\n` +
                `• *Precios* - Consultá precios de productos\n` +
                `• *Marcas* - Conocé nuestras marcas disponibles\n` +
                `• *Agendar cita* - Reservá tu turno\n` +
                `• *Obras sociales* - Información de cobertura\n` +
                `• *Horarios* - Nuestros horarios de atención`;

  // Buscar stock por código - MÁS FLEXIBLE
  } else if (messageLower.startsWith('#') || 
             messageLower.startsWith('stock ') || 
             messageLower.includes('codigo') ||
             messageLower.includes('código') ||
             (messageLower.length <= 10 && /[a-zA-Z]-\d+/i.test(messageLower))) {
    
    let code = '';
    if (messageLower.startsWith('#')) {
      code = mensaje.split('#')[1]?.trim();
    } else if (messageLower.startsWith('stock ')) {
      code = mensaje.split(' ')[1]?.trim();
    } else if (messageLower.includes('codigo') || messageLower.includes('código')) {
      // Extraer código después de "código"
      const match = mensaje.match(/(codigo|código)[:\s]*([a-zA-Z0-9-]+)/i);
      code = match ? match[2] : '';
    } else {
      code = messageLower;
    }
    
    if (!code) {
      respuesta = "❌ Por favor, decíme el *código del producto* que te interesa.\n\nEjemplo: *AC-274* o *#AC-274*";
    } else {
      respuesta = "🔍 *Buscando el producto...* Un momento por favor.";
      // Guardar contexto para buscar
      contexto.paso = 2;
      contexto.datos.ultimaBusqueda = code;
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
💲  *Precio:* $${product.precio || 'Consultar'}
        `;
      } else {
        respuesta = "❌ *No encontré ese código.* ¿Podrías verificarlo?\n\n" +
                   "O contame qué tipo de lente buscás y te ayudo a encontrar alternativas.";
      }
    }

  // Consulta sobre precios - CON DATOS REALES
  } else if (messageLower.includes('precio') || 
             messageLower.includes('cuesta') || 
             messageLower.includes('cuanto sale') ||
             messageLower.includes('valor') ||
             messageLower === 'precios') {
    
    const preciosReales = await obtenerPreciosReales();
    
    if (preciosReales) {
      respuesta = `💲 *Precios de armazones según nuestro stock:*\n\n` +
                  `• Desde: $${preciosReales.min.toLocaleString('es-AR')}\n` +
                  `• Hasta: $${preciosReales.max.toLocaleString('es-AR')}\n` +
                  `• Precio promedio: $${preciosReales.avg.toLocaleString('es-AR')}\n\n` +
                  `_Los precios varían según marca, material y características._\n\n` +
                  `¿Te interesa algún modelo específico? Decíme el *código* o describime lo que buscás.`;
    } else {
      respuesta = "💲 *Tenemos armazones para todos los presupuestos.*\n\n" +
                  "Los precios varían según:\n• Marca\n• Material (acetato, metal, etc.)\n• Diseño\n• Características especiales\n\n" +
                  "¿Te interesa algún modelo en particular? Decíme el *código* o describime lo que buscás.";
    }

  // Consulta sobre marcas - SOLO MARCAS REALES
  } else if (messageLower.includes('marca') || 
             messageLower.includes('que marcas') ||
             messageLower.includes('qué marcas') ||
             messageLower.includes('marcas tienen')) {
    
    const marcasReales = await obtenerMarcasReales();
    
    if (marcasReales.length > 0) {
      // Mostrar máximo 10 marcas para no saturar
      const marcasMostrar = marcasReales.slice(0, 10);
      respuesta = `👓 *Algunas de las marcas que trabajamos:*\n\n${marcasMostrar.map(m => `• ${m}`).join('\n')}`;
      
      if (marcasReales.length > 10) {
        respuesta += `\n\n...y ${marcasReales.length - 10} marcas más.`;
      }
      
      respuesta += `\n\n¿Te interesa alguna marca en particular?`;
    } else {
      respuesta = "👓 *Trabajamos con diversas marcas de calidad.*\n\n¿Buscás alguna marca específica?";
    }

  // Búsqueda por descripción - MÁS FLEXIBLE
  } else if (messageLower.includes('busco') || 
             messageLower.includes('quiero') || 
             messageLower.includes('tene') ||
             messageLower.includes('tienen') ||
             messageLower.includes('lente') ||
             messageLower.includes('lentes') ||
             messageLower.includes('anteojo') ||
             messageLower.includes('anteojos') ||
             messageLower.includes('gafa') ||
             messageLower.includes('gafas') ||
             messageLower.includes('vulk') ||
             messageLower.includes('ray-ban') ||
             messageLower.includes('oakley') ||
             messageLower.includes('sarkany') ||
             messageLower.includes('carter') ||
             messageLower.includes('redondo') || 
             messageLower.includes('cuadrado') || 
             messageLower.includes('ovalado') ||
             messageLower.includes('aviador') || 
             messageLower.includes('wayfarer') || 
             messageLower.includes('rectangular') ||
             messageLower.includes('metal') || 
             messageLower.includes('acetato') || 
             messageLower.includes('chico') ||
             messageLower.includes('grande') || 
             messageLower.includes('mediano') || 
             messageLower.includes('estilo') ||
             messageLower.includes('lente de contacto') || 
             messageLower.includes('lentilla') || 
             messageLower.includes('contacto')) {
    
    respuesta = "🔍 *Buscando en nuestro stock...* Un momento por favor.";
    const productosEncontrados = await buscarPorDescripcion(mensaje);
    
    if (productosEncontrados.length > 0) {
      respuesta = `🔍 *Encontré estas opciones para vos:*\n\n`;
      
      productosEncontrados.forEach((producto, index) => {
        const desc = producto.descripcion ? ` - ${producto.descripcion}` : '';
        respuesta += `${index + 1}. *${producto.codigo}* - ${producto.marca} ${producto.modelo}${desc} - $${producto.precio}\n`;
      });
      
      respuesta += `\n*Escribí el código (ej: AC-274) para más detalles de cada uno.*`;
    } else {
      respuesta = "❌ *No encontré productos que coincidan exactamente.*\n\n" +
                 "Probá ser más específico o contactá a un asesor al *11 1234-5678*.\n\n" +
                 "También podés:\n• Decirme un código específico\n• Visitarnos para ver todos los modelos";
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
                 `• Con todos tus datos y diagnóstico detallado\n` +
                 `• Con datos de tu obra social y número de afiliado\n\n` +
                 `¿Tenés alguna obra social en particular? Decíme cuál y te doy más info.`;
    }

  // Horarios de atención
  } else if (messageLower.includes('horario') || messageLower.includes('hora') || messageLower.includes('cuándo') ||
             messageLower.includes('abierto') || messageLower.includes('cierran') || messageLower.includes('atención')) {
    
    respuesta = `⏰ *Nuestros horarios de atención:*\n\n` +
               `📅 ${horariosAtencion.regular}\n` +
               `👁️  *Adaptación de lentes de contacto:* ${horariosAtencion.adaptacionLC}\n\n` +
               `📍 *Dirección:* Av. Corrientes 1234, CABA\n` +
               `📞 *Teléfono:* 11 1234-5678\n\n` +
               `¿Necesitás agendar una cita?`;

  // Lentes de contacto - SIN PRECIOS FIJOS
  } else if (messageLower.includes('lente de contacto') || 
             messageLower.includes('lentilla') || 
             messageLower.includes('contacto')) {
    
    const marcasLC = await obtenerMarcasLC();
    
    respuesta = `👁️  *Lentes de Contacto disponibles:*\n\n` +
               `📋 *Marcas que trabajamos:*\n${marcasLC.map(m => `• ${m}`).join('\n')}\n\n` +
               `💡 *Importante:* Necesitás receta oftalmológica actualizada\n` +
               `⏰ *Adaptación:* ${horariosAtencion.adaptacionLC}\n\n` +
               `¿Qué marca te interesa o ya usás alguna?`;

  // Líquidos para lentes de contacto - SIN PRECIOS FIJOS
  } else if (messageLower.includes('líquido') || 
             messageLower.includes('liquido') || 
             messageLower.includes('solución') || 
             messageLower.includes('solucion')) {
    
    const liquidos = await obtenerLiquidos();
    
    respuesta = `🧴 *Líquidos para lentes de contacto:*\n\n` +
               `📦 *Productos disponibles:*\n${liquidos.map(l => `• ${l.marca} ${l.tamano ? `- ${l.tamano}` : ''}`).join('\n')}\n\n` +
               `💲 *Precios promocionales* todos los meses\n` +
               `🎁 *Descuentos* por cantidad\n\n` +
               `¿Te interesa algún producto en particular?`;

  // Agradecimientos
  } else if (messageLower.includes('gracias') || messageLower.includes('thanks') || 
             messageLower.includes('genial') || messageLower.includes('perfecto')) {
    
    const emoji = personalidad.emojis[Math.floor(Math.random() * personalidad.emojis.length)];
    respuesta = `${emoji} ¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?`;

  // Despedidas
  } else if (messageLower.includes('chau') || messageLower.includes('adiós') || 
             messageLower.includes('bye') || messageLower.includes('nos vemos')) {
    
    respuesta = `👋 ¡Fue un gusto ayudarte! No dudes en escribirme si tenés más preguntas.\n\n` +
               `*Hypnottica* - Tu visión, nuestra pasión.`;

  // Fallback para mensajes no reconocidos
  } else {
    contexto.paso = 0; // Reiniciar contexto si no se entiende
    respuesta = `🤔 No estoy segura de entenderte. ¿Podrías decirlo de otra forma?\n\n` +
               `Podés preguntarme por:\n• Stock de productos\n• Precios\n• Marcas\n• Horarios\n• Obras sociales\n\n` +
      // Fallback para mensajes no reconocidos
  } else {
    contexto.paso = 0; // Reiniciar contexto si no se entiende
    respuesta = `🤔 No estoy segura de entenderte. ¿Podrías decirlo de otra forma?\n\n` +
               `Podés preguntarme por:\n• Stock de productos\n• Precios\n• Marcas\n• Horarios\n• Obras sociales\n\n` +
               `O escribí *"hola"* para ver todas las opciones.`;
  }

  // Guardar contexto actualizado
  contexto.historial.push({ mensaje, respuesta, timestamp: Date.now() });
  await guardarContextoUsuario(senderId, contexto);
  
  return respuesta;
}

// ==================== ENDPOINT PARA WEBHOOK DE WHATSAPP ====================
app.post('/webhook', async (req, res) => {
  try {
    // Verificar firma de Twilio si es necesario
    const twilioSignature = req.headers['x-twilio-signature'];
    const url = process.env.TWILIO_WEBHOOK_URL;
    
    if (process.env.TWILIO_AUTH_TOKEN && twilioSignature && url) {
      const isValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN,
        twilioSignature,
        url,
        req.body
      );
      
      if (!isValid) {
        return res.status(403).send('Invalid signature');
      }
    }
    
    // Obtener datos del mensaje
    const senderId = req.body.From;
    const message = req.body.Body;
    
    if (!senderId || !message) {
      return res.status(400).send('Missing parameters');
    }
    
    console.log(`📩 Mensaje de ${senderId}: ${message}`);
    
    // Obtener contexto del usuario
    const contexto = await obtenerContextoUsuario(senderId);
    
    // Procesar mensaje con timeout para evitar demoras
    const respuesta = await Promise.race([
      procesarMensaje(message, contexto, senderId),
      new Promise((resolve) => setTimeout(() => resolve("⏰ Estoy procesando tu consulta..."), 8000))
    ]);
    
    // Responder con Twilio
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(respuesta);
    
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
    
  } catch (error) {
    console.error('Error en webhook:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('❌ Ocurrió un error. Por favor, intentá nuevamente en un momento.');
    
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// ==================== ENDPOINT PARA VERIFICACIÓN DEL WEBHOOK ====================
app.get('/webhook', (req, res) => {
  // Verificación para Twilio
  if (req.query && req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).send('Error en token de verificación');
  }
});

// ==================== ENDPOINT DE SALUD ====================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    name: personalidad.nombre,
    users: redisClient ? 'Redis' : 'Memoria (' + memoriaUsuarios.size + ' usuarios)'
  });
});

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 ${personalidad.nombre} está funcionando en el puerto ${PORT}`);
  console.log(`👓 Bot de WhatsApp para óptica listo para usar`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err);
});
