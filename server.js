const express = require('express');
const twilio = require('twilio');
const app = express();

app.use(express.urlencoded({ extended: true }));

// Función principal que procesa los mensajes
app.post('/webhook', (req, res) => {
  const incomingMessage = req.body.Body.toLowerCase().trim();
  const senderId = req.body.From;

  console.log(`Mensaje de ${senderId}: ${incomingMessage}`);

  let responseMessage = '';

  // --- LÓGICA DEL MENÚ PRINCIPAL ---
  if (incomingMessage === '#menu' || incomingMessage === 'menu' || incomingMessage === 'hola') {
    responseMessage = `
🤖 *OPTICA - Menú Principal* 🤖

Elige una opción:

1.  👁️ *Agendar Examen de la Vista* - Solicita tu turno.
2.  📦 *Consultar Stock* - Ver disponibilidad de armazones.
3.  💰 *Consultar Precios* - Conoce nuestras promociones.
4.  📍 *Dirección y Horarios* - Cómo llegar y cuando abrimos.
5.  👨‍💼 *Hablar con un Asesor* - Derivación inmediata a un humano.

*Ejemplo:* Escribe el número de la opción (ej: "1") o la palabra clave (ej: "#stock").
    `;

  } else if (incomingMessage === '1' || incomingMessage === 'agendar') {
    responseMessage = "⏳ *Sistema de Agendamiento en Construcción* ⏳\n\nPróximamente podrás agendar tu examen de la vista directamente por aquí. Por ahora, te invitamos a llamarnos por teléfono para coordinar tu turno. ¡Gracias!";

  } else if (incomingMessage === '2' || incomingMessage === '#stock') {
    responseMessage = "📦 *Sistema de Stock en Construcción* 📦\n\nEstamos conectando nuestro inventario para que puedas consultar la disponibilidad al instante. Por ahora, pregúntanos por tu modelo favorito y te respondemos al momento.";

  } else if (incomingMessage === '3' || incomingMessage === '#precios') {
    responseMessage = "💎 *Tenemos precios para todos los presupuestos* 💎\n\nDesde armazones económicos hasta de primeras marcas. Contacta con un asesor para recibir una cotización personalizada sin compromiso.";

  } else if (incomingMessage === '4' || incomingMessage === '#direccion') {
    responseMessage = "📍 *Nuestra Dirección* 📍\n\n*Optica Vision*\nAv. Principal 1234, Ciudad.\n\n*Horarios:*\nLunes a Sábados: 10:30 - 19:30";

  } else if (incomingMessage === '5') {
    responseMessage = "🔊 Derivando tu conversación a un asesor humano. Por favor, espera un momento...";

  } else {
    // Para cualquier otro mensaje, responde con un mensaje por defecto
    responseMessage = "⚠️ *Opción no reconocida* ⚠️\n\nPor favor, escribe *'#menu'* para ver las opciones disponibles.";
  }

  // Construye la respuesta para Twilio
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(responseMessage);

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
