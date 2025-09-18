const express = require('express');
const twilio = require('twilio');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const app = express();

app.use(express.urlencoded({ extended: true }));

// Configuración de Google Sheets
const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const doc = new GoogleSpreadsheet(SHEETS_ID);

// Función para buscar en una hoja específica
async function searchInSheet(sheetName, code) {
  try {
    await doc.useServiceAccountAuth(require('./credentials.json')); // Usaremos auth más simple luego
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheetName];
    const rows = await sheet.getRows();

    // Buscar el código en la columna 'cod.hypno'
    const foundRow = rows.find(row => row.get('cod.hypno')?.toLowerCase() === code.toLowerCase());
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

  // --- LÓGICA PRINCIPAL MEJORADA ---
  if (incomingMessage.toLowerCase() === '#menu' || incomingMessage.toLowerCase() === 'menu' || incomingMessage.toLowerCase() === 'hola') {
    responseMessage = `
🤖 *HYPNOTTICA - Menú Principal* 🤖

Elige una opción:

1.  👁️ *Agendar Examen de la Vista* - Solicita tu turno.
2.  📦 *Consultar Stock* - Ver disponibilidad de armazones.
3.  💰 *Consultar Precios* - Conoce nuestras promociones.
4.  📍 *Dirección y Horarios* - Cómo llegar y cuando abrimos.
5.  👨‍💼 *Hablar con un Asesor* - Derivación inmediata a un humano.

*Ejemplo:* Escribe el número de la opción (ej: "1") o la palabra clave (ej: "#stock").
    `;

  } else if (incomingMessage.toLowerCase() === '1') {
    responseMessage = "⏳ *Sistema de Agendamiento en Construcción* ⏳\n\nPróximamente podrás agendar tu examen de la vista directamente por aquí. Por ahora, te invitamos a llamarnos por teléfono para coordinar tu turno. ¡Gracias!";

  } else if (incomingMessage.toLowerCase().startsWith('#stock ')) {
    // Comando: #stock COD123
    const code = incomingMessage.split(' ')[1];
    if (!code) {
      responseMessage = "❌ Por favor, escribí un código después de #stock. Ejemplo: #stock RB123";
    } else {
      responseMessage = "🔍 *Buscando en el stock...* 🔍\n\n(Esta función está en desarrollo. Pronto tendrás la info al instante)";
      // Aquí integraré la búsqueda en el Sheets luego
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
