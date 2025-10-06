// server.js - CON DATOS REALES
require('dotenv').config();
const express = require('express');
const DataManager = require('./core/DataManager');
const app = express();

app.use(express.json());

let dataManager;

// Inicializar DataManager al iniciar
async function initializeApp() {
  dataManager = new DataManager();
  const success = await dataManager.initialize();
  
  if (success) {
    console.log('✅ App inicializada con datos reales');
  } else {
    console.log('⚠️ App iniciada en modo básico (sin Google Sheets)');
  }
}

initializeApp();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de chat CON DATOS REALES
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    console.log('💬 Mensaje:', message);
    
    const mensajeLower = message.toLowerCase();
    let respuesta = '';

    if (mensajeLower.includes('hola') || mensajeLower.includes('buenas')) {
      respuesta = '¡Hola! Soy Luna 👋 de Hypnottica. ¿En qué puedo ayudarte?\n\nConsultá por:\n• 👓 Armazones en stock (marcas reales)\n• 👁️ Lentes de contacto\n• 🧴 Kits y combos\n• 💰 Precios reales\n• 📍 Dirección';

    } else if (mensajeLower.includes('marca') || mensajeLower.includes('armazon') || 
               mensajeLower.includes('ray-ban') || mensajeLower.includes('oakley') || 
               mensajeLower.includes('vulk') || mensajeLower.includes('sarkany')) {
      
      // MARCAS REALES DEL STOCK
      const marcas = await dataManager.getMarcasDisponibles();
      
      if (marcas.length > 0) {
        respuesta = `👓 **Marcas en stock:**\n\n${marcas.map(m => `• ${m}`).join('\n')}\n\n¿Te interesa ver modelos de alguna marca?`;
      } else {
        respuesta = '👓 Trabajamos con Ray-Ban, Oakley, Vulk, Sarkany y más. ¿Qué marca te interesa?';
      }

    } else if (mensajeLower.includes('stock') || mensajeLower.includes('disponible') || 
               mensajeLower.includes('tienen') || mensajeLower.includes('modelo')) {
      
      // BUSCAR EN STOCK REAL
      const armazones = await dataManager.buscarArmazones(mensajeLower);
      
      if (armazones.length > 0) {
        respuesta = `📦 **Encontramos ${armazones.length} modelos:**\n\n`;
        
        armazones.slice(0, 4).forEach((armazon, index) => {
          respuesta += `${index + 1}. **${armazon.marca}** ${armazon.modelo}\n`;
          respuesta += `   🎨 ${armazon.color} | 💰 $${armazon.precio} | 📦 ${armazon.stock} un.\n`;
          if (armazon.descripcion) respuesta += `   📝 ${armazon.descripcion}\n`;
          respuesta += '\n';
        });
        
        respuesta += '¿Te interesa alguno?';
      } else {
        respuesta = '🔍 Decime la marca o modelo que buscás para consultar stock exacto.';
      }

    } else if (mensajeLower.includes('lente') && mensajeLower.includes('contacto')) {
      const lentes = dataManager.getLentesContacto();
      respuesta = `👁️ **Lentes de contacto:**\n\n${lentes.map(l => `• **${l.marca}** (${l.tipos.join(', ')})`).join('\n')}\n\n¿Qué marca te interesa?`;

    } else if (mensajeLower.includes('combo') || mensajeLower.includes('kit') || mensajeLower.includes('pack')) {
      const combos = dataManager.getCombos();
      respuesta = `🎁 **Kits y Combos disponibles:**\n\n${combos.map(c => `• **${c.nombre}** - $${c.precio}\n   📦 ${c.productos.join(', ')}`).join('\n\n')}\n\n¿Te interesa algún kit?`;

    } else if (mensajeLower.includes('liquido') || mensajeLower.includes('solucion')) {
      const liquidos = dataManager.getLiquidos();
      respuesta = `🧴 **Líquidos disponibles:**\n\n${liquidos.map(l => `• ${l.tipo} ${l.disponible ? '✅' : '❌'}`).join('\n')}\n\n¿Para qué tipo de lente necesitás líquido?`;

    } else if (mensajeLower.includes('precio') || mensajeLower.includes('cuesta') || mensajeLower.includes('valor')) {
      // PRECIOS REALES
      const rango = await dataManager.getRangoPrecios();
      const preciosText = rango.min > 0 ? `$${rango.min} - $${rango.max}` : 'Consultar';
      
      respuesta = `💰 **Precios reales:**\n\n👓 Armazones: ${preciosText}\n🎁 Kits: $9.500 - $45.000\n👁️ Lentes contacto: Consultar\n\n*Los precios varían según marca y modelo.*`;

    } else if (mensajeLower.includes('direccion') || mensajeLower.includes('ubicacion')) {
      respuesta = '📍 **Hypnottica Óptica**\nSerrano 684, Villa Crespo, CABA\n🚇 A 4 cuadras de Ángel Gallardo (Línea B)\n📞 1132774631\n⏰ Lunes a Sábado 10:30-19:30';

    } else if (mensajeLower.includes('horario')) {
      respuesta = '⏰ **Horarios:**\nLunes a Sábado: 10:30 - 19:30\nDomingos: Cerrado\n\n¿Te sirve algún día?';

    } else if (mensajeLower.includes('obra social')) {
      respuesta = '🏥 **Obras sociales:**\n• Medicus\n• Osetya\n• Construir Salud\n• Swiss Medical\n\n📋 Requisitos: Receta vigente + credencial';

    } else {
      respuesta = `🤔 No entendí "${message}".\n\nPodés preguntarme por:\n• Marcas y modelos en stock\n• Precios reales\n• Kits y combos\n• Lentes de contacto\n• Horarios y dirección`;
    }
    
    res.json({
      success: true,
      response: respuesta,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({
      success: false,
      response: '⚠️ Error temporal. Por favor, intentá nuevamente.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Probador web
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Hypnottica Bot - Datos Reales</title>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
            .container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .chat-box { height: 400px; border: 1px solid #ddd; padding: 15px; margin: 20px 0; overflow-y: auto; background: #fafafa; }
            .message { margin: 10px 0; padding: 10px; border-radius: 10px; max-width: 80%; white-space: pre-line; }
            .user-message { background: #007bff; color: white; margin-left: auto; }
            .bot-message { background: #e9ecef; color: #333; margin-right: auto; }
            .input-container { display: flex; gap: 10px; }
            input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
            .quick-buttons { display: flex; gap: 10px; margin: 10px 0; flex-wrap: wrap; }
            .quick-btn { padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Hypnottica Bot - Datos Reales</h1>
            <p>Probá con stock real de Google Sheets:</p>
            
            <div class="quick-buttons">
                <button class="quick-btn" onclick="enviarMensaje('Marcas en stock')">👓 Marcas reales</button>
                <button class="quick-btn" onclick="enviarMensaje('Kits disponibles')">🎁 Kits reales</button>
                <button class="quick-btn" onclick="enviarMensaje('Precios armazones')">💰 Precios reales</button>
                <button class="quick-btn" onclick="enviarMensaje('Lentes de contacto')">👁️ Lentes contacto</button>
            </div>
            
            <div class="chat-box" id="chatBox">
                <div class="message bot-message">
                    ¡Hola! Soy Luna. Consulto stock REAL de Google Sheets. 
                    Probá preguntando por marcas o kits disponibles.
                </div>
            </div>
            
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Ej: Ray-Ban en stock..." onkeypress="if(event.key=='Enter') enviarMensaje()">
                <button onclick="enviarMensaje()">Enviar</button>
            </div>
        </div>

        <script>
            async function enviarMensaje(mensajePredefinido = null) {
                const input = document.getElementById('messageInput');
                const mensaje = mensajePredefinido || input.value.trim();
                if (!mensaje) return;
                
                const chatBox = document.getElementById('chatBox');
                chatBox.innerHTML += '<div class="message user-message">' + mensaje + '</div>';
                if (!mensajePredefinido) input.value = '';
                
                try {
                    const respuesta = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: 'user-' + Date.now(), message: mensaje })
                    });
                    
                    const datos = await respuesta.json();
                    chatBox.innerHTML += '<div class="message bot-message">' + datos.response + '</div>';
                    chatBox.scrollTop = chatBox.scrollHeight;
                } catch (error) {
                    chatBox.innerHTML += '<div class="message bot-message">❌ Error de conexión</div>';
                }
            }
        </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 Hypnottica Bot con datos REALES en puerto ' + PORT);
  console.log('🌐 Probador: https://tu-bot.onrender.com');
});

module.exports = app;
