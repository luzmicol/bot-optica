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
    const productos = await googleSheetsService.obtenerTodosProductos();
    const marcas = [...new Set(productos.map(p => p.marca).filter(m => m))].sort();
    const marcasMostrar = marcas.slice(0, 10);
    
    respuesta = `👓 *Algunas de las marcas que trabajamos:*\n\n${marcasMostrar.map(m => `• ${m}`).join('\n')}`;
    if (marcas.length > 10) respuesta += `\n\n...y ${marcas.length - 10} marcas más.`;
    respuesta += `\n\n¿Te interesa alguna marca en particular?`;

  } else if (messageLower.includes('obra social')) {
    respuesta = `🏥 *Obras Sociales que aceptamos:*\n\n${config.obrasSociales.map(os => `• ${os}`).join('\n')}\n\n💡 *Necesitás receta médica actualizada.*`;

  } else if (messageLower.includes('direccion') || messageLower.includes('ubicacion')) {
    respuesta = `📍 *Nuestra dirección:*\nSerrano 684, Villa Crespo, CABA\n\n⏰ *Horarios:* ${config.horarios.regular}`;

  } else if (messageLower.includes('horario')) {
    respuesta = `⏰ *Horarios de atención:*\n\n${config.horarios.regular}\n\n📍 Serrano 684, Villa Crespo`;

  } else if (messageLower.includes('lente de contacto') || messageLower.includes('lentes de contacto') || messageLower.includes('lentilla')) {
    const marcasLC = await googleSheetsService.obtenerMarcasLC();
    respuesta = `👁️  *¡Sí! Trabajamos con lentes de contacto* ✅\n\n📋 *Marcas disponibles:*\n${marcasLC.map(m => `• ${m}`).join('\n')}\n\n💡 *Requisitos:*\n• Receta oftalmológica actualizada (obligatoria)\n• Adaptación con profesional\n\n⏰ *Horario de adaptación:* ${config.horarios.adaptacionLC}\n\n¿Qué marca te interesa o ya usás alguna?`;

  } else if (messageLower.includes('líquido') || messageLower.includes('liquido') || messageLower.includes('solución') || messageLower.includes('solucion')) {
    const liquidos = await googleSheetsService.obtenerLiquidos();
    respuesta = `🧴 *Líquidos para lentes de contacto:*\n\n📦 *Productos disponibles:*\n${liquidos.map(l => `• ${l.marca} ${l.tamano ? `- ${l.tamano}` : ''}`).join('\n')}\n\n💲 *Precios promocionales* todos los meses\n🎁 *Descuentos* por cantidad\n\n¿Te interesa algún producto en particular?`;

  } else if (messageLower.includes('gracias') || messageLower.includes('thanks') || messageLower.includes('genial')) {
    const emoji = config.personalidad.emojis[Math.floor(Math.random() * config.personalidad.emojis.length)];
    respuesta = `${emoji} ¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?`;

  } else if (messageLower.includes('chau') || messageLower.includes('adiós') || messageLower.includes('bye')) {
    respuesta = `👋 ¡Fue un gusto ayudarte! No dudes en escribirme si tenés más preguntas.\n\n*Hypnottica* - Tu visión, nuestra pasión.`;

  } else {
    contexto.paso = 0;
    respuesta = `🤔 No estoy segura de entenderte. ¿Podrías decirlo de otra forma?\n\nPodés preguntarme por:\n• Stock de productos\n• Precios\n• Marcas\n• Horarios\n• Obras sociales\n\nO escribí *"hola"* para ver todas las opciones.`;
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
            <a href="/test">Página de Test</a> |
            <a href="/probador">Probador del Bot</a> |
            <a href="/test-sheets">Test Google Sheets</a>
          </p>
          <p>✨ Asistente virtual para WhatsApp listo para usar</p>
        </div>
      </body>
    </html>
  `);
});

// ==================== RUTAS DE PRUEBA MEJORADAS ====================

// Ruta POST para el probador - VERSIÓN QUE SÍ USA GOOGLE SHEETS
app.post('/probar-bot', async (req, res) => {
  try {
    const { mensaje } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({ error: 'Falta el mensaje' });
    }
    
    console.log(`🧪 Web Probador - Mensaje: "${mensaje}"`);
    
    // Usar memoryService para mantener contexto como en WhatsApp
    const senderId = 'web-user-' + Date.now();
    let contexto = await memoryService.obtenerContextoUsuario(senderId);
    
    console.log(`📝 Contexto: paso ${contexto.paso}`);
    
    // Procesar el mensaje con la función REAL
    let respuesta;
    try {
      respuesta = await procesarMensaje(mensaje, contexto, senderId);
      console.log(`🤖 Respuesta REAL generada: ${respuesta.substring(0, 100)}...`);
    } catch (error) {
      console.error('❌ Error en procesarMensaje:', error);
      respuesta = "❌ Ocurrió un error procesando tu mensaje. Por favor, intentá nuevamente.";
    }
    
    // Guardar contexto actualizado
    await memoryService.guardarContextoUsuario(senderId, contexto);
    
    res.json({
      mensaje_original: mensaje,
      respuesta: respuesta,
      timestamp: new Date().toISOString(),
      contexto_paso: contexto.paso
    });
    
  } catch (error) {
    console.error('❌ Error general en probador web:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      respuesta: "❌ Error del servidor. Por favor, recargá la página e intentá nuevamente."
    });
  }
});

// Ruta para probar Google Sheets directamente
app.get('/test-sheets', async (req, res) => {
  try {
    console.log('🧪 TEST DIRECTO DE GOOGLE SHEETS...');
    
    // Probar buscar un código específico
    const producto = await googleSheetsService.buscarPorCodigo('AC-274');
    
    // Probar obtener marcas de LC
    const marcasLC = await googleSheetsService.obtenerMarcasLC();
    
    // Probar obtener líquidos
    const liquidos = await googleSheetsService.obtenerLiquidos();
    
    // Probar obtener todos los productos
    const todosProductos = await googleSheetsService.obtenerTodosProductos();
    
    res.json({
      producto_ejemplo: producto,
      marcas_lc: marcasLC,
      liquidos: liquidos,
      total_productos: todosProductos.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Ruta de diagnóstico para Google Sheets
app.get('/diagnostico-sheets', async (req, res) => {
  try {
    console.log('🔍 Ejecutando diagnóstico de Google Sheets...');
    
    const envCheck = {
      GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID ? '✅ Configurado' : '❌ Faltante',
      GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? '✅ Configurado' : '❌ Faltante',
      SHEETS_ARMAZONES: process.env.SHEETS_ARMAZONES || 'Usando valor por defecto',
      SHEETS_LC: process.env.SHEETS_LC || 'No configurado',
      SHEETS_ACCESORIOS: process.env.SHEETS_ACCESORIOS || 'No configurado',
      SHEETS_LIQUIDOS: process.env.SHEETS_LIQUIDOS || 'No configurado'
    };
    
    const diagnostico = await googleSheetsService.diagnosticar();
    
    res.json({
      entorno: envCheck,
      diagnostico: diagnostico,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.json({ 
      error: error.message,
      stack: error.stack 
    });
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
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #25D366, #128C7E); color: white; padding: 30px; text-align: center; }
            .header h1 { font-size: 2.5em; margin-bottom: 10px; }
            .header p { opacity: 0.9; font-size: 1.1em; }
            .chat-container { padding: 20px; height: 500px; overflow-y: auto; border-bottom: 1px solid #eee; }
            .message { margin: 15px 0; padding: 15px 20px; border-radius: 20px; max-width: 80%; animation: fadeIn 0.3s ease-in; }
            .user-message { background: #25D366; color: white; margin-left: auto; border-bottom-right-radius: 5px; }
            .bot-message { background: #f0f0f0; color: #333; margin-right: auto; border-bottom-left-radius: 5px; white-space: pre-line; }
            .input-container { padding: 20px; display: flex; gap: 10px; background: #f8f9fa; }
            .input-container input { flex: 1; padding: 15px 20px; border: 2px solid #ddd; border-radius: 25px; font-size: 16px; outline: none; transition: border-color 0.3s; }
            .input-container input:focus { border-color: #25D366; }
            .input-container button { padding: 15px 25px; background: #25D366; color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: bold; transition: background 0.3s; }
            .input-container button:hover { background: #128C7E; }
            .quick-buttons { padding: 15px 20px; background: #f8f9fa; border-top: 1px solid #eee; display: flex; flex-wrap: wrap; gap: 10px; }
            .quick-button { padding: 10px 15px; background: white; border: 2px solid #25D366; border-radius: 20px; color: #25D366; cursor: pointer; font-size: 14px; transition: all 0.3s; }
            .quick-button:hover { background: #25D366; color: white; }
            .status { padding: 10px 20px; background: #fff3cd; border-left: 4px solid #ffc107; margin: 10px 20px; border-radius: 5px; font-size: 14px; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .typing-indicator { display: inline-block; padding: 10px 15px; background: #f0f0f0; border-radius: 15px; color: #666; font-style: italic; }
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
                <div class="quick-button" onclick="sendQuickMessage('lentes de contacto')">👁️ Lentes contacto</div>
                <div class="quick-button" onclick="sendQuickMessage('líquidos')">🧴 Líquidos</div>
            </div>
            
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Escribe tu mensaje..." onkeypress="handleKeyPress(event)">
                <button onclick="sendMessage()">Enviar</button>
            </div>
        </div>

        <script>
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
                typingDiv.innerHTML = '<span class="typing-indicator">Luna está escribiendo...</span>';
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
                
                addMessage(message, true);
                input.value = '';
                
                showTyping();
                
                try {
                    const response = await fetch('/probar-bot', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mensaje: message })
                    });
                    
                    const data = await response.json();
                    hideTyping();
                    
                    if (data.respuesta) {
                        addMessage(data.respuesta);
                    } else {
                        addMessage('❌ No se recibió respuesta');
                    }
                    
                } catch (error) {
                    hideTyping();
                    addMessage('❌ Error de conexión');
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
        </script>
    </body>
    </html>
  `);
});
// ==================== DEBUG DETALLADO DE GOOGLE SHEETS ====================

app.get('/debug-sheets', async (req, res) => {
  try {
    console.log('🐛 INICIANDO DEBUG DETALLADO DE GOOGLE SHEETS...');
    
    // 1. Verificar configuración
    const configCheck = {
      sheets_id: process.env.GOOGLE_SHEETS_ID ? '✅ Configurado' : '❌ Faltante',
      service_account: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? '✅ Configurado' : '❌ Faltante',
      armazones: process.env.SHEETS_ARMAZONES || 'Usando por defecto',
      lc: process.env.SHEETS_LC || 'No configurado',
      accesorios: process.env.SHEETS_ACCESORIOS || 'No configurado',
      liquidos: process.env.SHEETS_LIQUIDOS || 'No configurado'
    };
    
    console.log('🔍 Configuración:', configCheck);
    
    // 2. Probar inicialización
    let initResult;
    try {
      await googleSheetsService.initialize();
      initResult = '✅ Inicialización exitosa';
    } catch (initError) {
      initResult = `❌ Error en inicialización: ${initError.message}`;
    }
    
    // 3. Probar cada hoja individualmente
    const hojas = ['STOCK ARMAZONES 1', 'Stock LC', 'Stock Accesorios', 'Stock Liquidos'];
    const resultados = {};
    
    for (const hoja of hojas) {
      console.log(`\n🔍 Probando hoja: ${hoja}`);
      try {
        const productos = await googleSheetsService.obtenerProductosDeSheet(hoja);
        resultados[hoja] = {
          estado: '✅ OK',
          productos: productos.length,
          primeros: productos.slice(0, 2), // Primeros 2 para ejemplo
          error: null
        };
        console.log(`✅ ${hoja}: ${productos.length} productos`);
      } catch (error) {
        resultados[hoja] = {
          estado: '❌ ERROR',
          productos: 0,
          primeros: [],
          error: error.message
        };
        console.log(`❌ ${hoja}: ${error.message}`);
      }
    }
    
    // 4. Probar búsqueda específica
    console.log('\n🔍 Probando búsqueda por código...');
    let busquedaResult;
    try {
      const producto = await googleSheetsService.buscarPorCodigo('AC-274');
      busquedaResult = producto ? '✅ Producto encontrado' : '❌ Producto no encontrado';
    } catch (error) {
      busquedaResult = `❌ Error en búsqueda: ${error.message}`;
    }
    
    res.json({
      configuracion: configCheck,
      inicializacion: initResult,
      hojas: resultados,
      busqueda: busquedaResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ERROR en debug:', error);
    res.json({ 
      error: error.message,
      stack: error.stack
    });
  }
});
// Agregá esta ruta temporal para ver la estructura REAL
app.get('/debug-estructura', async (req, res) => {
  try {
    console.log('🔍 ANALIZANDO ESTRUCTURA REAL DE LAS HOJAS...');
    
    await googleSheetsService.initialize();
    
    const hojas = ['STOCK ARMAZONES 1', 'Stock LC', 'Stock Accesorios', 'Stock Liquidos'];
    const estructura = {};
    
    for (const hoja of hojas) {
      console.log(`\n📊 Analizando estructura de: ${hoja}`);
      const sheet = googleSheetsService.doc.sheetsByTitle[hoja];
      
      if (!sheet) {
        estructura[hoja] = { error: 'Hoja no encontrada' };
        continue;
      }
      
      // Probar diferentes filas de encabezado
      let headerRow = 0;
      let headerValues = [];
      
      for (let rowNum of [1, 2, 3]) {
        try {
          await sheet.loadHeaderRow(rowNum);
          headerValues = sheet.headerValues || [];
          if (headerValues.some(val => val && val.trim() !== '')) {
            headerRow = rowNum;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Leer primeras filas de datos
      const rows = await sheet.getRows();
      const primerasFilas = rows.slice(0, 3).map(row => row._rawData);
      
      estructura[hoja] = {
        headerRow,
        headerValues: headerValues.filter(h => h && h.trim()),
        totalFilas: rows.length,
        primerasFilas
      };
    }
    
    res.json(estructura);
    
  } catch (error) {
    res.json({ error: error.message });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 ${config.personalidad.nombre} funcionando en puerto ${PORT}`);
});

module.exports = app;
