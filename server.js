const express = require('express');
const twilio = require('twilio');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const app = express();

app.use(express.urlencoded({ extended: true }));

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

// ==================== RUTA PRINCIPAL WHATSAPP ====================
app.post('/webhook', async (req, res) => {
  // --- MANEJO DE ERRORES GLOBAL ---
  try {
    const incomingMessage = req.body.Body.trim();
    const senderId = req.body.From;
    console.log(`Mensaje de ${senderId}: ${incomingMessage}`);

    let responseMessage = '';
    const messageLower = incomingMessage.toLowerCase();

    // --- DETECCIÓN DE INTENCIONES NATURALES ---
    
    // Saludo inicial
    if (messageLower.includes('hola') || messageLower === 'hi' || messageLower === '👋') {
      responseMessage = `¡Hola! 👋 Soy tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy? Puedes preguntarme por stock, precios o agendar una cita.`;

    // Buscar stock por código (con o sin #)
    } else if (messageLower.startsWith('#stock ') || messageLower.startsWith('stock ') || /\b(stock|tenen|tienen|busco)\b.*\b([A-Za-z0-9\-]+)\b/.test(messageLower)) {
      let code;
      if (messageLower.startsWith('#stock ')) {
        code = incomingMessage.split(' ')[1];
      } else if (messageLower.startsWith('stock ')) {
        code = incomingMessage.split(' ')[1];
      } else {
        const match = incomingMessage.match(/\b([A-Za-z0-9\-]+)\b/);
        code = match ? match[1] : null;
      }

      if (!code) {
        responseMessage = "❌ Contame el código del modelo que te interesa, por ejemplo: \"AC-274\"";
      } else {
        const sheetName = process.env.SHEETS_ARMAZONES || 'STOCK ARMAZONES 1';
        console.log("Buscando código:", code);
        
        const product = await searchInSheet(sheetName, code);
        if (product) {
          responseMessage = `
🏷️  *Código:* ${product['COD. HYPNO']}
👓  *Modelo:* ${product['Marca']} ${product['Modelo']}
🎨  *Color:* ${product['Color']}
📦  *Stock:* ${product['Cantidad']} unidades
💲  *Precio:* $${product['PRECIO']}
          `;
        } else {
          responseMessage = "❌ *Producto no encontrado.*\n\nVerificá el código e intentá nuevamente.";
        }
      }

    // BÚSQUEDA INTELIGENTE POR DESCRIPCIÓN
    } else if (messageLower.includes('busco') || messageLower.includes('quiero') || messageLower.includes('tene') || 
               messageLower.includes('aviador') || messageLower.includes('wayfarer') || messageLower.includes('redondo') ||
               messageLower.includes('rectangular') || messageLower.includes('cuadrado') || messageLower.includes('angular') ||
               messageLower.includes('ray-ban') || messageLower.includes('oakley') || messageLower.includes('carter') ||
               messageLower.includes('vulk')) {
      
      responseMessage = "🔍 *Buscando en nuestro stock...* Un momento por favor.";
      
      const productosEncontrados = await buscarPorDescripcion(incomingMessage);
      
      if (productosEncontrados.length > 0) {
        responseMessage = `🔍 *Encontré estas opciones para vos:*\n\n`;
        
        productosEncontrados.forEach((producto, index) => {
          responseMessage += `${index + 1}. *${producto.codigo}* - ${producto.marca} ${producto.modelo} ${producto.color} - $${producto.precio}\n`;
        });
        
        responseMessage += `\n*Escribí #stock [código] para más detalles de cada uno.*`;
      } else {
        responseMessage = "❌ *No encontré productos que coincidan.*\n\nProbá ser más específico o escribí el código del producto.";
      }

    // Agendar o turno
    } else if (messageLower.includes('agendar') || messageLower.includes('turno') || messageLower.includes('hora') || messageLower.includes('cita')) {
      responseMessage = `⏳ *Sistema de Agendamiento en Construcción* ⏳\n\nPróximamente podrás agendar tu turno directamente por aquí. Por ahora, te invitamos a llamarnos por teléfono para coordinar. ¡Gracias!`;

    // Precios
    } else if (messageLower.includes('precio') || messageLower.includes('cuesta') || messageLower.includes('sale')) {
      responseMessage = "💎 *Tenemos precios para todos los presupuestos* 💎\n\nDesde armazones económicos hasta de primeras marcas. Contacta con un asesor para recibir una cotización personalizada sin compromiso.";

    // Dirección u horarios
    } else if (messageLower.includes('dirección') || messageLower.includes('donde') || messageLower.includes('ubic') || messageLower.includes('horario')) {
      responseMessage = "📍 *Nuestra Dirección* 📍\n\n*HYPNOTTICA*\nSerrano 684, Villa Crespo. CABA.\n\n*Horarios:*\nLunes a Sábados: 10:30 - 19:30";

    // Hablar con humano
    } else if (messageLower.includes('humano') || messageLower.includes('persona') || messageLower.includes('asesor') || messageLower.includes('telefono')) {
      responseMessage = "🔊 Te derivo con un asesor. Por favor, espera un momento...";

    } else {
      // --- CONSULTA A IA PARA PREGUNTAS ABIERTAS ---
      const marcasReales = await obtenerMarcasUnicas();
      const marcasTexto = marcasReales.join(', ');

      const promptIA = `Eres un asistente de la óptica Hypnottica. 
      INFORMACIÓN REAL ACTUALIZADA:
      - Marcas disponibles: ${marcasTexto}
      - Dirección: Serrano 684, Villa Crespo, CABA
      - Horarios: Lunes a Sábados 10:30-19:30
      
      Cliente pregunta: "${incomingMessage}". 
      Responde SOLO con información verificada. Si no sabés algo, decí la verdad.`;

      responseMessage = await consultarIA(promptIA);
    }

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(responseMessage);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
    
  } catch (error) {
    console.error('Error grave en el servidor:', error);
    // Aunque falle todo, respondemos SOMETHING a Twilio
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('⚠️ Estoy teniendo problemas técnicos momentáneos. Por favor, intentá de nuevo en un minuto.');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// ==================== INICIO SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
