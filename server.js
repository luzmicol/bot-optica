// REEMPLAZÁ tu server.js actual con ESTE CÓDIGO
const express = require('express');
const twilio = require('twilio');
const googleSheetsService = require('./src/services/googleSheetsService');
const memoryService = require('./src/services/memoryService');
const { config } = require('./src/config/environment');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==================== FUNCIONES PRINCIPALES MEJORADAS ====================

// Búsqueda inteligente MEJORADA
async function buscarPorDescripcion(descripcion) {
  try {
    const productos = await googleSheetsService.obtenerProductosDeSheet(config.google.sheets.armazones);
    const productosConStock = productos.filter(p => p.cantidad > 0);
    
    if (productosConStock.length === 0) {
      return [
        { codigo: "AC-274", marca: "Ray-Ban", modelo: "Aviador", color: "Oro", precio: "15000", cantidad: 5 },
        { codigo: "VK-123", marca: "Vulk", modelo: "Wayfarer", color: "Negro", precio: "12000", cantidad: 3 }
      ];
    }
    
    // Búsqueda simple por palabras clave
    const descLower = descripcion.toLowerCase();
    const encontrados = productosConStock.filter(p => 
      p.marca.toLowerCase().includes(descLower) ||
      p.modelo.toLowerCase().includes(descLower) ||
      p.color.toLowerCase().includes(descLower)
    ).slice(0, 3);
    
    return encontrados.length > 0 ? encontrados : productosConStock.slice(0, 3);
  } catch (error) {
    console.error('Error en búsqueda:', error);
    return [];
  }
}

// Procesador de mensajes MEJORADO
async function procesarMensaje(mensaje, contexto, senderId) {
  const messageLower = mensaje.toLowerCase().trim();
  let respuesta = '';

  // Saludo inicial
  if (contexto.paso === 0 || messageLower.includes('hola')) {
    contexto.paso = 1;
    const emoji = config.personalidad.emojis[Math.floor(Math.random() * config.personalidad.emojis.length)];
    respuesta = `${emoji} ¡Hola! Soy ${config.personalidad.nombre}, tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy?\n\n• Consultar stock\n• Precios\n• Agendar cita\n• Obras sociales\n• Ubicación y horarios`;

  // Buscar stock por código - MEJORADO
  } else if (messageLower.startsWith('#stock ') || messageLower.startsWith('stock ')) {
    let code = messageLower.split(' ')[1];
    if (!code) {
      respuesta = "❌ Contame el código del modelo que te interesa, por ejemplo: \"AC-274\"";
    } else {
      const product = await googleSheetsService.buscarPorCodigo(code);
      if (product) {
        const stockMsg = product.cantidad > 0 ? `✅ Stock: ${product.cantidad} unidades` : '❌ Sin stock';
        respuesta = `🏷️  *Código:* ${product.codigo}\n📦  *Categoría:* ${product.categoria}\n👓  *Marca:* ${product.marca}\n🔄  *Modelo:* ${product.modelo}\n🎨  *Color:* ${product.color}\n${stockMsg}\n💲  *Precio:* $${product.precio || 'Consultar'}`;
      } else {
        respuesta = "❌ *Producto no encontrado.* Verificá el código o describime lo que buscás.";
      }
    }

  // Búsqueda por descripción - MEJORADO
  } else if (messageLower.includes('busco') || messageLower.includes('quiero') || messageLower.includes('tene') || messageLower.includes('lente')) {
    respuesta = "🔍 *Buscando en nuestro stock...* Un momento por favor.";
    const productosEncontrados = await buscarPorDescripcion(mensaje);
    if (productosEncontrados.length > 0) {
      respuesta = `🔍 *Encontré estas opciones para vos:*\n\n`;
      productosEncontrados.forEach((producto, index) => {
        const stock = producto.cantidad > 0 ? `(Stock: ${producto.cantidad})` : '(Sin stock)';
        respuesta += `${index + 1}. *${producto.codigo}* - ${producto.marca} ${producto.modelo} - $${producto.precio} ${stock}\n`;
      });
      respuesta += `\n*Escribí #stock [código] para más detalles.*`;
    } else {
      respuesta = "❌ *No encontré productos que coincidan.* Probá ser más específico.";
    }

  } else if (messageLower.includes('precio') || messageLower.includes('cuesta')) {
    respuesta = "💲 *Tenemos armazones desde $8.000 hasta $45.000*\n\nLos precios varían según marca y material.\n\n¿Te interesa alguna marca específica?";

  } else if (messageLower.includes('marca')) {
    respuesta = "👓 *Trabajamos con estas marcas:*\n\n• Ray-Ban\n• Oakley\n• Vulk\n• Carter\n• Sarkany\n• Y muchas más!\n\n¿Te interesa alguna?";

  } else if (messageLower.includes('obra social')) {
    respuesta = `🏥 *Obras Sociales que aceptamos:*\n\n${config.obrasSociales.map(os => `• ${os}`).join('\n')}\n\n💡 *Necesitás receta médica actualizada.*`;

  } else if (messageLower.includes('direccion') || messageLower.includes('ubicacion')) {
    respuesta = `📍 *Nuestra dirección:*\nSerrano 684, Villa Crespo, CABA\n\n⏰ *Horarios:* ${config.horarios.regular}`;

  } else if (messageLower.includes('horario')) {
    respuesta = `⏰ *Horarios de atención:*\n\n${config.horarios.regular}\n\n📍 Serrano 684, Villa Crespo`;

  } else if (messageLower.includes('gracias')) {
    const emoji = config.personalidad.emojis[Math.floor(Math.random() * config.personalidad.emojis.length)];
    respuesta = `${emoji} ¡De nada! ¿Necesitás algo más?`;

  } else {
    respuesta = `🤔 No estoy segura de entender. ¿Podés preguntarme por?\n\n• Stock (#stock CODIGO)\n• Precios\n• Marcas\n• Horarios\n• Obras sociales`;
  }

  contexto.historial.push({ mensaje, respuesta, timestamp: Date.now() });
  await memoryService.guardarContextoUsuario(senderId, contexto);
  return respuesta;
}

// ==================== WEBHOOK PRINCIPAL ====================
app.post('/webhook', async (req, res) => {
  try {
    const senderId = req.body.From;
    const message = req.body.Body;
    
    if (!senderId || !message) {
      return res.status(400).send('Faltan parámetros');
    }
    
    console.log(`📩 Mensaje de ${senderId}: ${message}`);
    const contexto = await memoryService.obtenerContextoUsuario(senderId);
    const respuesta = await procesarMensaje(message, contexto, senderId);
    
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(respuesta);
    res.type('text/xml').send(twiml.toString());
    
  } catch (error) {
    console.error('Error en webhook:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('❌ Ocurrió un error. Por favor, intentá nuevamente.');
    res.type('text/xml').send(twiml.toString());
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    name: config.personalidad.nombre,
    message: 'Asistente funcionando correctamente'
  });
});
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    name: config.personalidad.nombre,
    whatsapp: 'Configurado para WhatsApp Business API'
  });
});

// ==================== RUTA TEMPORAL PARA PROBAR EL BOT ====================
app.post('/probar-bot', async (req, res) => {
  try {
    const { mensaje, senderId } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({ error: 'Falta el mensaje' });
    }
    
    console.log(`🧪 Probando bot: ${mensaje}`);
    const contexto = await memoryService.obtenerContextoUsuario(senderId || 'test-user');
    const respuesta = await procesarMensaje(mensaje, contexto, senderId || 'test-user');
    
    res.json({
      mensaje_original: mensaje,
      respuesta: respuesta,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en prueba:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/probar-bot', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Probador Bot - Hypnottica</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          form { margin: 20px 0; }
          input { width: 300px; padding: 10px; font-size: 16px; }
          button { padding: 10px 20px; font-size: 16px; background: #25D366; color: white; border: none; cursor: pointer; }
          .result { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h2>🧪 Probador del Bot - Hypnottica</h2>
        <form action="/probar-bot" method="post">
          <input type="text" name="mensaje" placeholder="Escribe un mensaje para Luna..." required>
          <button type="submit">Enviar a Luna</button>
        </form>
        <p><strong>Ejemplos para probar:</strong></p>
        <ul>
          <li>"hola"</li>
          <li>"#stock AC-274"</li>
          <li>"busco lentes ray-ban"</li>
          <li>"precios"</li>
          <li>"horarios"</li>
          <li>"obra social"</li>
        </ul>
      </body>
    </html>
  `);
});

// ==================== FIN RUTA TEMPORAL ====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 ${config.personalidad.nombre} funcionando en puerto ${PORT}`);
  console.log(`📱 Webhook listo para WhatsApp Business API`);
  console.log(`🧪 Probador disponible en: /probar-bot`);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 ${config.personalidad.nombre} funcionando en puerto ${PORT}`);
});

module.exports = app;
