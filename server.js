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

app.get('/probador', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Probador Bot - Hypnottica</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #25D366, #128C7E);
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
            }
            
            .header p {
                opacity: 0.9;
                font-size: 1.1em;
            }
            
            .chat-container {
                padding: 20px;
                height: 500px;
                overflow-y: auto;
                border-bottom: 1px solid #eee;
            }
            
            .message {
                margin: 15px 0;
                padding: 15px 20px;
                border-radius: 20px;
                max-width: 80%;
                animation: fadeIn 0.3s ease-in;
            }
            
            .user-message {
                background: #25D366;
                color: white;
                margin-left: auto;
                border-bottom-right-radius: 5px;
            }
            
            .bot-message {
                background: #f0f0f0;
                color: #333;
                margin-right: auto;
                border-bottom-left-radius: 5px;
                white-space: pre-line;
            }
            
            .input-container {
                padding: 20px;
                display: flex;
                gap: 10px;
                background: #f8f9fa;
            }
            
            .input-container input {
                flex: 1;
                padding: 15px 20px;
                border: 2px solid #ddd;
                border-radius: 25px;
                font-size: 16px;
                outline: none;
                transition: border-color 0.3s;
            }
            
            .input-container input:focus {
                border-color: #25D366;
            }
            
            .input-container button {
                padding: 15px 25px;
                background: #25D366;
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: background 0.3s;
            }
            
            .input-container button:hover {
                background: #128C7E;
            }
            
            .quick-buttons {
                padding: 15px 20px;
                background: #f8f9fa;
                border-top: 1px solid #eee;
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .quick-button {
                padding: 10px 15px;
                background: white;
                border: 2px solid #25D366;
                border-radius: 20px;
                color: #25D366;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s;
            }
            
            .quick-button:hover {
                background: #25D366;
                color: white;
            }
            
            .status {
                padding: 10px 20px;
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                margin: 10px 20px;
                border-radius: 5px;
                font-size: 14px;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .typing-indicator {
                display: inline-block;
                padding: 10px 15px;
                background: #f0f0f0;
                border-radius: 15px;
                color: #666;
                font-style: italic;
            }
            
            .typing-dots {
                display: inline-block;
                animation: typing 1.4s infinite;
            }
            
            @keyframes typing {
                0%, 60%, 100% { opacity: 0.3; }
                30% { opacity: 1; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 Luna - Probador</h1>
                <p>Asistente Virtual de Hypnottica</p>
            </div>
            
            <div class="status">
                💡 <strong>Tip:</strong> Probá consultas como "stock AC-274", "busco lentes ray-ban", "precios", etc.
            </div>
            
            <div class="chat-container" id="chatContainer">
                <div class="message bot-message">
                    👋 ¡Hola! Soy Luna, tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy?\n\n• Consultar stock\n• Precios\n• Agendar cita\n• Obras sociales\n• Ubicación y horarios
                </div>
            </div>
            
            <div class="quick-buttons" id="quickButtons">
                <div class="quick-button" onclick="sendQuickMessage('hola')">👋 Hola</div>
                <div class="quick-button" onclick="sendQuickMessage('#stock AC-274')">📦 Stock por código</div>
                <div class="quick-button" onclick="sendQuickMessage('busco lentes ray-ban')">🔍 Buscar lentes</div>
                <div class="quick-button" onclick="sendQuickMessage('precios')">💲 Precios</div>
                <div class="quick-button" onclick="sendQuickMessage('marcas')">👓 Marcas</div>
                <div class="quick-button" onclick="sendQuickMessage('obra social')">🏥 Obras sociales</div>
                <div class="quick-button" onclick="sendQuickMessage('horarios')">⏰ Horarios</div>
                <div class="quick-button" onclick="sendQuickMessage('direccion')">📍 Dirección</div>
            </div>
            
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Escribe tu mensaje..." onkeypress="handleKeyPress(event)">
                <button onclick="sendMessage()">Enviar</button>
            </div>
        </div>

        <script>
            let conversationHistory = [];
            
            function addMessage(message, isUser = false) {
                const chatContainer = document.getElementById('chatContainer');
                const messageDiv = document.createElement('div');
                messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
                messageDiv.innerHTML = message.replace(/\\n/g, '<br>');
                chatContainer.appendChild(messageDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            
            function showTyping() {
                const chatContainer = document.getElementById('chatContainer');
                const typingDiv = document.createElement('div');
                typingDiv.className = 'message bot-message';
                typingDiv.id = 'typingIndicator';
                typingDiv.innerHTML = '<span class="typing-indicator">Luna está escribiendo<span class="typing-dots">...</span></span>';
                chatContainer.appendChild(typingDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            
            function hideTyping() {
                const typingIndicator = document.getElementById('typingIndicator');
                if (typingIndicator) {
                    typingIndicator.remove();
                }
            }
            
            async function sendMessage() {
                const input = document.getElementById('messageInput');
                const message = input.value.trim();
                
                if (!message) return;
                
                // Agregar mensaje del usuario
                addMessage(message, true);
                input.value = '';
                
                // Mostrar "escribiendo"
                showTyping();
                
                try {
                    const response = await fetch('/probar-bot', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            mensaje: message,
                            senderId: 'web-user-' + Date.now()
                        })
                    });
                    
                    const data = await response.json();
                    hideTyping();
                    
                    // Agregar respuesta del bot
                    if (data.respuesta) {
                        addMessage(data.respuesta);
                    } else {
                        addMessage('❌ No se recibió respuesta del servidor');
                    }
                    
                } catch (error) {
                    hideTyping();
                    addMessage('❌ Error de conexión. Verifica que el servidor esté funcionando.');
                    console.error('Error:', error);
                }
            }
            
            function sendQuickMessage(message) {
                document.getElementById('messageInput').value = message;
                sendMessage();
            }
            
            function handleKeyPress(event) {
                if (event.key === 'Enter') {
                    sendMessage();
                }
            }
            
            // Mensaje de bienvenida automático después de 2 segundos
            setTimeout(() => {
                addMessage('💡 *Tip:* Podés probar comandos como "stock AC-274", "busco lentes de sol", "precios", etc.');
            }, 2000);
        </script>
    </body>
    </html>
  `);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 ${config.personalidad.nombre} funcionando en puerto ${PORT}`);
});

module.exports = app;
