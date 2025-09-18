const express = require('express');
const twilio = require('twilio');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.post('/webhook', (req, res) => {
  console.log('Mensaje recibido!', req.body);
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message('🤖 ¡Hola! Soy el asistente de la óptica. Estamos en construcción. Pronto estaré para ayudarte.');
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
