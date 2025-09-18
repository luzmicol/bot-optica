const express = require('express');
const twilio = require('twilio');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const app = express();

app.use(express.urlencoded({ extended: true }));

// Función para consultar a DeepSeek (IA)
async function consultarIA(prompt) {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  const url = 'https://api.deepseek.com/v1/chat/completions';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling DeepSeek:", error);
    return "Lo siento, estoy teniendo problemas técnicos. Por favor, intentá de nuevo más tarde.";
  }
}

// Función para buscar en una hoja específica
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

// Función principal que procesa los mensajes
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
    responseMessage = await consultarIA(`Eres un asistente de la óptica Hypnottica. El cliente pregunta: "${incomingMessage}". Responde de manera helpful y profesional. Si no sabés algo, invitá al cliente a visitar el local o a agendar una cita. No inventes información sobre productos que no tienes confirmación.`);
  }

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(responseMessage);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
