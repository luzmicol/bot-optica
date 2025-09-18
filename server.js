const express = require('express');
const twilio = require('twilio');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const app = express();

app.use(express.urlencoded({ extended: true }));

// Función para buscar en una hoja específica (VERSIÓN AJUSTADA A TU STRUCTURA)
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

    // --- HEADERS EN FILA 3, DATOS DESDE FILA 4 ---
    await sheet.loadHeaderRow(3); // Headers en fila 3
    const rows = await sheet.getRows();
    
    console.log("Headers detectados:", sheet.headerValues); // ← Debug crucial

    // Buscar el código en la columna 'COD. HYPNO'
    const foundRow = rows.find(row => {
      const rowCode = row['COD. HYPNO'];
      console.log(`Comparando: '${rowCode}' con '${code}'`);
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

  // --- LÓGICA PRINCIPAL ---
  if (incomingMessage.toLowerCase() === '#menu' || incomingMessage.toLowerCase() === 'menu' || incomingMessage.toLowerCase() === 'hola') {
    responseMessage = `
🤖 *HYPNOTTICA - Menú Principal* 🤖

Elige una opción:

1.  👁️ *Control de Refracción* (Para usuarios con receta existente)
2.  📦 *Consultar Stock* - Ver disponibilidad de armazones.
3.  💰 *Consultar Precios* - Conoce nuestras promociones.
4.  📍 *Dirección y Horarios* - Cómo llegar y cuando abrimos.
5.  👨‍💼 *Hablar con un Asesor* - Derivación inmediata a un humano.

*Ejemplo:* Escribe el número de la opción (ej: "1") o la palabra clave (ej: "#stock").
    `;

  } else if (incomingMessage.toLowerCase() === '1') {
    responseMessage = `👁️  *¿Qué tipo de servicio necesitás?*

1.  📋 *Control de Refracción* (Para usuarios con receta existente)
2.  🔍 *Adaptación de Lentes de Contacto* (Aprendé a usarlos por primera vez)
3.  🎯 *Consulta de Armazones* (Asesoramiento para elegir tu modelo)

*Respondé con el número de la opción.*`;

  } else if (incomingMessage.toLowerCase().startsWith('#stock ')) {
    const code = incomingMessage.split(' ')[1];
    if (!code) {
      responseMessage = "❌ Por favor, escribí un código después de #stock. Ejemplo: #stock AC-274";
    } else {
      const sheetName = process.env.SHEETS_ARMAZONES || 'STOCK ARMAZONES 1';
      console.log("DEBUG - Buscando en Hoja:", sheetName);
      console.log("DEBUG - Buscando Código:", code);
      
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

  } else if (incomingMessage.toLowerCase() === '3') {
    responseMessage = "💎 *Tenemos precios para todos los presupuestos* 💎\n\nDesde armazones económicos hasta de primeras marcas. Contacta con un asesor para recibir a cotización personalizada sin compromiso.";

  } else if (incomingMessage.toLowerCase() === '4') {
    responseMessage = "📍 *Nuestra Dirección* 📍\n\n*HYPNOTTICA*\nSerrano 684, Villa Crespo. CABA.\n\n*Horarios:*\nLunes a Sábados: 10:30 - 19:30";

  } else if (incomingMessage.toLowerCase() === '5') {
    responseMessage = "🔊 Derivando tu conversación a un asesor humano. Por favor, espera un momento...";

  } else {
    responseMessage = "⚠️ *Opción no reconocida* ⚠️\n\nPor favor, escribe *'#menu'* para ver las opciones disponibles.";
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
