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

const obrasSociales = ["Swiss Medical", "Medicus", "Construir Salud", "Osetya"];

const horariosAtencion = {
  regular: "Lunes a Sábados: 10:30 - 19:30",
  adaptacionLC: "Lunes a Sábados: hasta las 18:30 (por la duración del procedimiento)"
};

let memoriaUsuarios = new Map();
let redisClient = null;

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
      const marca = row['B'] || '';
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
      const marca = row['B'] || '';
      const tamano = row['C'] || '';
      
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
    
    if (preciosArmazones.length === 0) return null;
    
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

// ==================== FUNCIÓN OPENAI ====================
async function consultarIA(prompt) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error("OpenAI API Key no configurada");
    return "";
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.3
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
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
      return [
        { codigo: "AC-274", marca: "Ray-Ban", modelo: "Aviador", color: "Oro", precio: "15000", descripcion: "Estilo aviador metal", categoria: "Armazones" },
        { codigo: "VK-123", marca: "Vulk", modelo: "Wayfarer", color: "Negro", precio: "12000", descripcion: "Acetato clásico", categoria: "Armazones" }
      ];
    }
    
    const prompt = `Cliente busca: "${descripcion}". Productos disponibles: ${productosConStock.map(p => `${p.codigo}|${p.marca}|${p.modelo}|${p.color}|${p.precio}|${p.categoria}|${p.descripcion}`).join('\n')}. Respondé SOLO con códigos separados por coma.`;
    const respuestaIA = await consultarIA(prompt);
    const codigos = respuestaIA.split(',').map(cod => cod.trim()).filter(cod => cod !== '');
    
    const productosEncontrados = [];
    for (const codigo of codigos.slice(0, 3)) {
      const producto = productosConStock.find(p => p.codigo && p.codigo.toLowerCase() === codigo.toLowerCase());
      if (producto) productosEncontrados.push(producto);
    }
    
    return productosEncontrados.length > 0 ? productosEncontrados : productosConStock.slice(0, 3);
  } catch (error) {
    console.error('Error en búsqueda inteligente:', error);
    return [
      { codigo: "AC-274", marca: "Ray-Ban", modelo: "Aviador", color: "Oro", precio: "15000", descripcion: "Estilo aviador metal", categoria: "Armazones" },
      { codigo: "VK-123", marca: "Vulk", modelo: "Wayfarer", color: "Negro", precio: "12000", descripcion: "Acetato clásico", categoria: "Armazones" }
    ];
  }
}

// ==================== SISTEMA DE FALLBACK ====================
const respuestasFallback = [
  "No estoy segura de entenderte completamente. ¿Podrías reformular tu pregunta?",
  "Quiero asegurarme de ayudarte bien. ¿Te refieres a información sobre stock, precios o agendar una cita?",
  "Perdoná, no capté eso. ¿Podrías decirlo de otra forma?"
];

function obtenerFallbackAleatorio() {
  return respuestasFallback[Math.floor(Math.random() * respuestasFallback.length)];
}

function detectarObraSocial(mensaje) {
  const msg = mensaje.toLowerCase();
  const obrasDetectadas = obrasSociales.filter(obra => msg.includes(obra.toLowerCase()));
  return obrasDetectadas.length > 0 ? obrasDetectadas[0] : null;
}

// ==================== PROCESAMIENTO PRINCIPAL DE MENSAJES ====================
async function procesarMensaje(mensaje, contexto, senderId) {
  const messageLower = mensaje.toLowerCase().trim();
  let respuesta = '';

  // Saludo inicial
  if (contexto.paso === 0 || messageLower.includes('hola') || messageLower === 'hi' || messageLower === '👋') {
    contexto.paso = 1;
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
        respuesta = `🏷️  *Código:* ${product.codigo || 'N/A'}\n📦  *Categoría:* ${product.categoria}\n👓  *Marca:* ${product.marca || ''}\n🔄  *Modelo:* ${product.modelo || ''}\n🎨  *Color:* ${product.color || 'N/A'}${solReceta}${descripcion}\n📊  *Stock:* ${product.cantidad || '0'} unidades\n💲  *Precio:* $${product.precio || 'N/A'}`;
      } else {
        respuesta = "❌ *Producto no encontrado.* Verificá el código o describime lo que buscás.";
      }
    }

  // Búsqueda por descripción
  } else if (messageLower.includes('busco') || messageLower.includes('quiero') || messageLower.includes('tene') || messageLower.includes('lente')) {
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

  // Consulta sobre precios
  } else if (messageLower.includes('precio') || messageLower.includes('cuesta') || messageLower === 'precios') {
    const preciosReales = await obtenerPreciosReales();
    if (preciosReales) {
      respuesta = `💲 *Precios de armazones según nuestro stock:*\n\n• Desde: $${preciosReales.min.toLocaleString('es-AR')}\n• Hasta: $${preciosReales.max.toLocaleString('es-AR')}\n• Precio promedio: $${preciosReales.avg.toLocaleString('es-AR')}\n\n_Los precios varían según marca, material y características._\n\n¿Te interesa algún modelo específico?`;
    } else {
      respuesta = "💲 *Tenemos armazones para todos los presupuestos.*\n\nLos precios varían según marca, material y diseño.\n\n¿Te interesa algún modelo en particular?";
    }

  // Consulta sobre marcas
  } else if (messageLower.includes('marca') || messageLower.includes('que marcas') || messageLower.includes('marcas tienen')) {
    const marcasReales = await obtenerMarcasReales();
    if (marcasReales.length > 0) {
      const marcasMostrar = marcasReales.slice(0, 10);
      respuesta = `👓 *Algunas de las marcas que trabajamos:*\n\n${marcasMostrar.map(m => `• ${m}`).join('\n')}`;
      if (marcasReales.length > 10) respuesta += `\n\n...y ${marcasReales.length - 10} marcas más.`;
      respuesta += `\n\n¿Te interesa alguna marca en particular?`;
    } else {
      respuesta = "👓 *Trabajamos con diversas marcas de calidad.*\n\n¿Buscás alguna marca específica?";
    }

// Obras sociales - INFORMACIÓN COMPLETA ACTUALIZADA
} else if (messageLower.includes('obra social') || messageLower.includes('prepaga') || 
           messageLower.includes('osde') || messageLower.includes('omint') ||
           messageLower.includes('medife') || messageLower.includes('galeno') ||
           messageLower.includes('swiss') || messageLower.includes('medicus') ||
           messageLower.includes('cobertura') || messageLower.includes('beneficio') ||
           messageLower.includes('receta') || messageLower.includes('oftalmologo') ||
           messageLower.includes('medico') || messageLower.includes('afiliado') ||
           messageLower.includes('carnet') || messageLower.includes('plan medico') ||
           messageLower.includes('plan de salud') || 
           /(que|qué|tienen|aceptan).*(obra social|prepaga)/i.test(mensaje)) {
  
  // Función para detectar CUALQUIER obra social mencionada
  function detectarCualquierObraSocial(mensaje) {
    const msg = mensaje.toLowerCase();
    
    // Patrones de nombres de obras sociales
    const patronesObrasSociales = [
      /\b(osde|osdepym)\b/, /\b(omint)\b/, /\b(medife|medifé)\b/, /\b(galeno)\b/,
      /\b(swiss medical|swissmedical)\b/, /\b(medicus)\b/, /\b(prevencion salud|prevensalud)\b/,
      /\b(sancor salud)\b/, /\b(asper salud)\b/, /\b(doctor salud)\b/,
      /\b(ospedyc|ospedyc)\b/, /\b(ospoce|ospoce)\b/, /\b(ospegra)\b/,
      /\b(ospaca|ospaca)\b/, /\b(ospijua)\b/, /\b(osplad)\b/,
      /\b(ospia|ospia)\b/, /\b(osdebin|osdebin)\b/, /\b(osuthgra)\b/,
      /\b(iosfa)\b/, /\b(ospfa)\b/, /\b(osfa)\b/, /\b(ospac)\b/,
      /\b(ioma)\b/, /\b(amos|amos salud)\b/, /\b(apross)\b/, /\b(oses)\b/,
      /\b(conde)\b/, /\b(sadaic)\b/, /\b(ospat)\b/, /\b(osprera)\b/,
      /\b(osseg)\b/, /\b(osdeag|osdeag)\b/, /\b(osjp|osjp)\b/
    ];
    
    // Palabras clave que indican que hablan de obras sociales
    const palabrasClaveObraSocial = [
      'obra social', 'prepaga', 'cobertura', 'beneficio', 
      'afiliado', 'carnet', 'plan médico', 'plan de salud'
    ];
    
    // 1. Buscar si menciona alguna obra social específica
    for (const patron of patronesObrasSociales) {
      const match = msg.match(patron);
      if (match) {
        return match[0].charAt(0).toUpperCase() + match[0].slice(1);
      }
    }
    
    // 2. Si no encuentra obra específica, pero usa palabras clave
    const tienePalabrasClave = palabrasClaveObraSocial.some(palabra => msg.includes(palabra));
    if (tienePalabrasClave) {
      return "obra_social_general";
    }
    
    return null;
  }
  
  const obraDetectada = detectarCualquierObraSocial(mensaje);
  
  if (obraDetectada === "obra_social_general") {
  
    // PREGUNTA GENERAL SOBRE OBRAS SOCIALES
    respuesta = `🏥 *Obras Sociales que aceptamos:*\n\n${obrasSociales.map(os => `• ${os}`).join('\n')}\n\n` +
               `📋 *Requisitos importantes:*\n\n` +
               `👁️  *Necesitás receta médica actualizada* (máximo 60 días)\n` +
               `• Debe ser de un oftalmólogo matriculado\n` +
               `• Con todos tus datos y diagnóstico detallado\n` +
               `• Con datos de tu obra social y número de afiliado\n\n` +
               `¿Tenés alguna obra social en particular?`;
               
  } else if (obraDetectada && obrasSociales.map(os => os.toLowerCase()).includes(obraDetectada.toLowerCase())) {
    // SI TENEMOS ESA OBRA SOCIAL
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
               
  } else if (obraDetectada) {
    // SI DETECTÓ UNA OBRA SOCIAL PERO NO LA TENEMOS
    respuesta = `❌ *No trabajamos con ${obraDetectada.toUpperCase()} en este momento* 😔\n\n` +
               `👉 *Pero sí contamos con:*\n` +
               `• Precios competitivos\n` +
               `• Promos exclusivas\n` +
               `• Garantía en todos nuestros productos\n` +
               `• Posibilidad de financiar tu compra en cuotas\n\n` +
               `¿Querés que te asesoremos para que encuentres el lente ideal al mejor valor?`;
               
  } else {
    // FALLBACK - No detectó obra social específica
    respuesta = `🏥 *Obras Sociales que aceptamos:*\n\n${obrasSociales.map(os => `• ${os}`).join('\n')}\n\n` +
               `📋 *Requisitos importantes:*\n\n` +
               `👁️  *Necesitás receta médica actualizada* (máximo 60 días)\n` +
               `• Debe ser de un oftalmólogo matriculado\n` +
               `• Con todos tus datos y diagnóstico detallado\n` +
               `• Con datos de tu obra social y número de afiliado\n\n` +
               `¿Tenés alguna obra social en particular?`;
  }
// Dirección - SOLO DIRECCIÓN
} else if (messageLower.includes('direccion') || messageLower.includes('dirección') ||
           messageLower.includes('ubicacion') || messageLower.includes('ubicación') ||
           messageLower.includes('donde estan') || messageLower.includes('dónde están') ||
           messageLower.includes('local') || messageLower.includes('dire')) {
  
  respuesta = `📍 *Nuestra dirección:*\nSerrano 684, Villa Crespo, CABA\n\n` +
             `¿Necesitás indicaciones para llegar?`;
    
  // Horarios de atención - SOLO HORARIOS REGULARES
} else if ((messageLower.includes('horario') || messageLower.includes('hora') || 
            messageLower.includes('cuándo') || messageLower.includes('cuando') ||
            messageLower.includes('abierto') || messageLower.includes('cierran') || 
            messageLower.includes('atención') || messageLower.includes('atencion')) &&
           !messageLower.includes('contacto') && !messageLower.includes('adaptacion')) {
  
  respuesta = `⏰ *Nuestros horarios de atención:*\n\n` +
             `📅 ${horariosAtencion.regular}\n\n` +
             `📍 *Dirección:* Serrano 684, Villa Crespo, CABA\n` +
             `¿Necesitás agendar una cita?`;
 
    // Adaptación de lentes de contacto - SOLO SI PREGUNTAN ESPECÍFICAMENTE
} else if (messageLower.includes('adaptacion') || messageLower.includes('adaptación') ||
           messageLower.includes('cita contacto') || messageLower.includes('turno contacto')) {
  
  respuesta = `👁️  *Adaptación de Lentes de Contacto:*\n\n` +
             `⏰ ${horariosAtencion.adaptacionLC}\n\n` +
             `📍 *Dirección:* Serrano 684, Villa Crespo, CABA\n` +
             `*Requisitos:*\n• Receta oftalmológica actualizada\n• Tiempo aproximado: 45-60 minutos\n\n` +
             `¿Querés agendar tu cita?`;
    
 // Lentes de contacto - RESPUESTA DIRECTA Y PRECISA
} else if (messageLower.includes('venden lente de contacto') || 
           messageLower.includes('venden lentilla') ||
           messageLower.includes('tienen lente de contacto') ||
           messageLower.includes('tienen lentilla') ||
           messageLower.includes('lente de contacto?') ||
           messageLower.includes('lentilla?')) {
  
  const marcasLC = await obtenerMarcasLC();
  
  respuesta = `👁️  *¡Sí! Trabajamos con lentes de contacto* ✅\n\n` +
             `📋 *Marcas disponibles:*\n${marcasLC.map(m => `• ${m}`).join('\n')}\n\n` +
             `💡 *Requisitos:*\n• Receta oftalmológica actualizada (obligatoria)\n• Adaptación con profesional\n\n` +
             `⏰ *Horario de adaptación:* ${horariosAtencion.adaptacionLC}\n\n` +
             `¿Qué marca te interesa o ya usás alguna?`;
    
  // Líquidos
  } else if (messageLower.includes('líquido') || messageLower.includes('liquido') || messageLower.includes('solución') || messageLower.includes('solucion')) {
    const liquidos = await obtenerLiquidos();
    respuesta = `🧴 *Líquidos para lentes de contacto:*\n\n📦 *Productos disponibles:*\n${liquidos.map(l => `• ${l.marca} ${l.tamano ? `- ${l.tamano}` : ''}`).join('\n')}\n\n💲 *Precios promocionales* todos los meses\n🎁 *Descuentos* por cantidad\n\n¿Te interesa algún producto en particular?`;

  // Agradecimientos
  } else if (messageLower.includes('gracias') || messageLower.includes('thanks') || messageLower.includes('genial')) {
    const emoji = personalidad.emojis[Math.floor(Math.random() * personalidad.emojis.length)];
    respuesta = `${emoji} ¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?`;

  // Despedidas
  } else if (messageLower.includes('chau') || messageLower.includes('adiós') || messageLower.includes('bye')) {
    respuesta = `👋 ¡Fue un gusto ayudarte! No dudes en escribirme si tenés más preguntas.\n\n*Hypnottica* - Tu visión, nuestra pasión.`;

  // Fallback
  } else {
    contexto.paso = 0;
    respuesta = `🤔 No estoy segura de entenderte. ¿Podrías decirlo de otra forma?\n\nPodés preguntarme por:\n• Stock de productos\n• Precios\n• Marcas\n• Horarios\n• Obras sociales\n\nO escribí *"hola"* para ver todas las opciones.`;
  }

  contexto.historial.push({ mensaje, respuesta, timestamp: Date.now() });
  await guardarContextoUsuario(senderId, contexto);
  return respuesta;
}

// ==================== ENDPOINT PARA WEBHOOK DE WHATSAPP ====================
app.post('/webhook', async (req, res) => {
  try {
    const senderId = req.body.From;
    const message = req.body.Body;
    
    if (!senderId || !message) {
      return res.status(400).send('Missing parameters');
    }
    
    console.log(`📩 Mensaje de ${senderId}: ${message}`);
    const contexto = await obtenerContextoUsuario(senderId);
    const respuesta = await Promise.race([
      procesarMensaje(message, contexto, senderId),
      new Promise((resolve) => setTimeout(() => resolve("⏰ Estoy procesando tu consulta..."), 8000))
    ]);
    
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(respuesta);
    res.type('text/xml').send(twiml.toString());
    
  } catch (error) {
    console.error('Error en webhook:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('❌ Ocurrió un error. Por favor, intentá nuevamente en un momento.');
    res.type('text/xml').send(twiml.toString());
  }
});

app.get('/webhook', (req, res) => {
  if (req.query && req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).send('Error en token de verificación');
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    name: personalidad.nombre,
    users: redisClient ? 'Redis' : 'Memoria (' + memoriaUsuarios.size + ' usuarios)'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 ${personalidad.nombre} está funcionando en el puerto ${PORT}`);
  console.log(`👓 Bot de WhatsApp para óptica listo para usar`);
});

process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err);
});
