const express = require('express');
const { config } = require('./src/config/environment');
const googleSheetsService = require('./src/services/googleSheetsService');
const memoryService = require('./src/services/memoryService');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==================== FUNCIONES PRINCIPALES ====================
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

async function procesarMensaje(mensaje, contexto, senderId) {
  const messageLower = mensaje.toLowerCase().trim();
  let respuesta = '';

  if (contexto.paso === 0 || messageLower.includes('hola')) {
    contexto.paso = 1;
    const emoji = config.personalidad.emojis[Math.floor(Math.random() * config.personalidad.emojis.length)];
    respuesta = `${emoji} ¡Hola! Soy ${config.personalidad.nombre}, tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy?\n\n• Consultar stock\n• Precios\n• Agendar cita\n• Obras sociales\n• Ubicación y horarios`;

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

// ==================== WEBHOOK PARA WHATSAPP ====================
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    
    if (!value || !value.messages) {
      return res.status(200).send('EVENT_RECEIVED');
    }
    
    const message = value.messages[0];
    const senderId = message.from;
    const messageText = message.text?.body;
    
    if (!messageText) {
      return res.status(200).send('OK');
    }
    
    console.log(`📩 Mensaje de ${senderId}: ${messageText}`);
    const contexto = await memoryService.obtenerContextoUsuario(senderId);
    const respuesta = await procesarMensaje(messageText, contexto, senderId);
    
    // Enviar respuesta a WhatsApp
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    if (ACCESS_TOKEN && value.metadata) {
      await fetch(`https://graph.facebook.com/v17.0/${value.metadata.phone_number_id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: senderId,
          text: { body: respuesta }
        })
      });
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(200).send('OK');
  }
});

// Verificación del webhook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === (process.env.WHATSAPP_VERIFY_TOKEN || 'hypnottica_token')) {
    console.log('✅ Webhook verificado por WhatsApp');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Error en verificación de webhook');
    res.sendStatus(403);
  }
});

// Health check simple
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    name: config.personalidad.nombre,
    service: 'Asistente Óptica Hypnottica'
  });
});

// Ruta de prueba simple
app.get('/test', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>🤖 Bot Hypnottica - Funcionando</h1>
        <p>El servidor está online. WhatsApp configurado.</p>
        <p><a href="/health">Health Check</a></p>
      </body>
    </html>
  `);
});
// Página principal
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Hypnottica - Asistente Virtual</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
          .container { max-width: 600px; margin: 0 auto; }
          .status { background: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 Hypnottica - Asistente Virtual</h1>
          <div class="status">
            <h2>✅ Servidor funcionando correctamente</h2>
            <p><strong>Nombre:</strong> ${config.personalidad.nombre}</p>
            <p><strong>Estado:</strong> Online</p>
          </div>
          <p>
            <a href="/health">Health Check</a> | 
            <a href="/test">Página de Test</a>
          </p>
          <p>✨ Asistente virtual para WhatsApp listo para usar</p>
        </div>
      </body>
    </html>
  `);
});
// Ruta para probar el bot desde web
app.post('/probar-bot', async (req, res) => {
  try {
    const { mensaje, senderId } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({ error: 'Falta el mensaje' });
    }
    
    console.log(`🧪 Web Probador: ${mensaje}`);
    const contexto = await memoryService.obtenerContextoUsuario(senderId || 'web-user');
    const respuesta = await procesarMensaje(mensaje, contexto, senderId || 'web-user');
    
    res.json({
      mensaje_original: mensaje,
      respuesta: respuesta,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en probador web:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// ==================== PROBADOR WEB INTERACTIVO ====================

app.post('/probar-bot', async (req, res) => {
  try {
    const { mensaje, senderId } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({ error: 'Falta el mensaje' });
    }
    
    console.log(`🧪 Web Probador - Mensaje: "${mensaje}"`);
    
    // Usar un ID único para la sesión web
    const webUserId = senderId || 'web-user-' + Date.now();
    
    // Obtener contexto del usuario
    let contexto;
    try {
      contexto = await memoryService.obtenerContextoUsuario(webUserId);
      console.log(`📝 Contexto obtenido: paso ${contexto.paso}`);
    } catch (error) {
      console.error('Error obteniendo contexto:', error);
      contexto = { paso: 0, datos: {}, historial: [] };
    }
    
    // Procesar el mensaje
    let respuesta;
    try {
      respuesta = await procesarMensaje(mensaje, contexto, webUserId);
      console.log(`🤖 Respuesta generada: ${respuesta.substring(0, 50)}...`);
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      respuesta = "❌ Ocurrió un error procesando tu mensaje. Por favor, intentá nuevamente.";
    }
    // Agregá esto DESPUÉS de la función procesarMensaje para verificar
console.log('=== DEBUG PROBADOR ===');
console.log('Mensaje recibido:', mensaje);
console.log('Contexto paso:', contexto.paso);
console.log('Tipo de mensaje:', typeof mensaje);
console.log('=== FIN DEBUG ===');
    
    // Guardar contexto actualizado
    try {
      await memoryService.guardarContextoUsuario(webUserId, contexto);
    } catch (error) {
      console.error('Error guardando contexto:', error);
    }
    
    res.json({
      mensaje_original: mensaje,
      respuesta: respuesta,
      timestamp: new Date().toISOString(),
      contexto_paso: contexto.paso
    });
    
  } catch (error) {
    console.error('Error general en probador web:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      respuesta: "❌ Error del servidor. Por favor, recargá la página e intentá nuevamente."
    });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 ${config.personalidad.nombre} funcionando en puerto ${PORT}`);
});

module.exports = app;
