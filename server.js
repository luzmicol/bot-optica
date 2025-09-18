const express = require('express');
const twilio = require('twilio');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const app = express();

app.use(express.urlencoded({ extended: true }));

// Configuración de Google Sheets
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const doc = new GoogleSpreadsheet(SHEETS_ID);

// Función para buscar en una hoja específica (VERSIÓN DEFINITIVA)
async function searchInSheet(sheetName, code) {
  try {
    // AUTENTICACIÓN NUEVA para la versión actual de la librería
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    await doc.useServiceAccountAuth(credentials);
    
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      console.error(`No se encontró la hoja: ${sheetName}`);
      return null;
    }
    const rows = await sheet.getRows();

    // Buscar el código en la columna 'COD. HYPNO' (¡EXACTO como está en el Sheets!)
    const foundRow = rows.find(row => {
      const rowCode = row.get('COD. HYPNO'); // <- CAMBIADO A 'COD. HYPNO'
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
      responseMessage = "❌ Por favor, escribí un código después de #stock. Ejemplo: #stock RB123";
    } else {
      console.log("DEBUG - Buscando en Hoja:", process.env.SHEETS_ARMAZONES);
      console.log("DEBUG - Buscando Código:", code);
      
      const product = await searchInSheet(process.env.SHEETS_ARMAZONES, code);
      if (product) {
        responseMessage = `
🏷️  *Código:* ${product.get('COD. HYPNO')}  <!-- CAMBIADO A 'COD. HYPNO' -->
👓  *Modelo:* ${product.get('marca')} ${product.get('modelo')}
🎨  *Color:* ${product.get('color')}
📦  *Stock:* ${product.get('cantidad')} unidades
💲  *Precio:* $${product.get('precio')}
        `;
      } else {
        responseMessage = "❌ *Producto no encontrado.*\n\nVerificá el código e intentá nuevamente.";
      }
    }

  } else if (incomingMessage.toLowerCase() === '3') {
    responseMessage = "💎 *Tenemos precios para todos los presupuestos* 💎\n\nDesde armazones económicos hasta de primeras marcas. Contacta con un asesor para recibir una cotización personalizada sin compromiso.";

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
