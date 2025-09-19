const express = require('express');
const twilio = require('twilio');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const app = express();

app.use(express.urlencoded({ extended: true }));

// ==================== FUNCIÓN PARA OBTENER MARCAS ÚNICAS ====================
async function obtenerMarcasUnicas() {
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID);
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[process.env.SHEETS_ARMAZONES || 'STOCK ARMAZONES 1'];
    if (!sheet) return [];
    
    await sheet.loadHeaderRow(3);
    const rows = await sheet.getRows();
    
    // Extraer todas las marcas únicas (sin repetir)
    const marcas = new Set();
    rows.forEach(row => {
      const marca = row['Marca'];
      if (marca && marca.trim() !== '') {
        marcas.add(marca.trim());
      }
    });
    
    return Array.from(marcas).sort(); // Convertir Set a Array y ordenar
  } catch (error) {
    console.error('Error obteniendo marcas:', error);
    return [];
  }
}

// ==================== FUNCIÓN OPENAI (GPT-4o-mini) ====================
async function consultarIA(prompt) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const url = 'https://api.openai.com/v1/chat/completions';

  try {
    // Obtener las marcas REALES del sheet
    const marcasReales = await obtenerMarcasUnicas();
    const marcasTexto = marcasReales.join(', ');

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
          content: `Eres un asistente de la óptica Hypnottica. 
          INFORMACIÓN REAL ACTUALIZADA:
          - Marcas disponibles: ${marcasTexto}
          - Dirección: Serrano 684, Villa Crespo, CABA
          - Horarios: Lunes a Sábados 10:30-19:30
          
          Cliente pregunta: "${prompt}". 
          Responde SOLO con información verificada. Si no sabés algo, decí la verdad.`
        }],
        max_tokens: 150
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      return "¡Hola! Trabajamos con las mejores marcas del mercado. ¿Te interesa alguna en particular?";
    }
    
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "¡Hola! ¿Te gustaría saber sobre las marcas que manejamos?";
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
  const incomingMessage = req.body.Body.trim();
  const senderId = req.body.From;
  console.log(`Mensaje de ${senderId}: ${incomingMessage}`);

  let responseMessage = '';
  const messageLower = incomingMessage.toLowerCase();

  // --- DETECCIÓN DE INTENCIONES NATURALES ---
  
  // Saludo inicial
  if (messageLower.includes('hola') || messageLower === 'hi' || messageLower === '👋') {
    responseMessage = `¡Hola! 👋 Soy tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy? Puedes preguntarme por stock, precios o agendar una cita.`;

  // Buscar stock (con o sin #)
  } else if (messageLower.startsWith('#stock ') || messageLower.startsWith('stock ') || /\b(stock|tenen|tienen|busco)\b.*\b([A-Za-z0-9\-]+)\b/.test(messageLower)) {
    let code;
    if (messageLower.startsWith('#stock ')) {
      code = incomingMessage.split(' ')[1];
    } else if (messageLower.startsWith('stock ')) {
      code = incomingMessage.split(' ')[1];
    } else {
      // Extrae código del mensaje natural: "tenen AC-274?" → "AC-274"
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
    responseMessage = await consultarIA(incomingMessage);
  }

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(responseMessage);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

// ==================== INICIO SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
