// server.js - FLUJO MEJORADO
require('dotenv').config();
const express = require('express');
const DataManager = require('./core/DataManager');
const app = express();

app.use(express.json());

let dataManager;

async function initializeApp() {
  dataManager = new DataManager();
  const success = await dataManager.initialize();
  console.log(success ? '✅ Conectado a datos reales' : '⚠️ Modo básico');
}

initializeApp();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});
// Endpoint de diagnóstico ACTUALIZADO
app.get('/api/diagnostico', async (req, res) => {
  try {
    const diagnostico = await dataManager.diagnosticarConexion();
    const marcas = await dataManager.getMarcasReales();
    const estadisticas = await dataManager.getEstadisticasCompletas();
    
    res.json({
      diagnostico: diagnostico.split('\n'),
      marcas,
      estadisticas,
      variables_entorno: {
        SHEETS_ARMAZONES: process.env.SHEETS_ARMAZONES ? '✅ Configurado' : '❌ No configurado',
        GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? '✅ Configurado' : '❌ No configurado'
      }
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});
// Agregá esto en server.js después del health check
app.get('/api/diagnostico', async (req, res) => {
  try {
    const diagnostico = await dataManager.diagnosticarConexion();
    const marcas = await dataManager.getMarcasReales();
    
    res.json({
      diagnostico,
      marcas,
      sheets_id: process.env.SHEETS_ARMAZONES ? '✅ Configurado' : '❌ No configurado',
      service_account: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? '✅ Configurado' : '❌ No configurado'
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});
// Endpoint de chat MEJORADO
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    console.log('💬 Mensaje:', message);
    
    const mensajeLower = message.toLowerCase();
    let respuesta = '';

    // DETECCIÓN MEJORADA CON FLUJO LÓGICO
    if (mensajeLower.includes('hola') || mensajeLower.includes('buenas')) {
      respuesta = '¡Hola! Soy Luna 👋 de Hypnottica. ¿En qué puedo ayudarte?\n\nPodés consultar:\n• 👓 Armazones en stock\n• 👁️ Lentes de contacto\n• 🎁 Kits y combos\n• 📍 Horarios y dirección';

    } else if ((mensajeLower.includes('lente') && mensajeLower.includes('contacto')) || mensajeLower.includes('lentilla')) {
      // LENTES DE CONTACTO - SOLO MARCAS
      const marcasLC = dataManager.getMarcasLentesContacto();
      respuesta = `👁️ **Marcas de lentes de contacto:**\n\n${marcasLC.map(m => `• ${m}`).join('\n')}\n\n¿Te interesa alguna marca en particular?`;

    } else if (mensajeLower.includes('marca') || mensajeLower.includes('armazon') || 
               mensajeLower.includes('vulk') || mensajeLower.includes('sarkany') ||
               mensajeLower.includes('ray-ban') || mensajeLower.includes('oakley')) {
      
      // MARCAS REALES DEL STOCK
      const marcasReales = await dataManager.getMarcasReales();
      
      if (marcasReales.length > 0) {
        respuesta = `👓 **Marcas disponibles en stock:**\n\n${marcasReales.map(m => `• ${m}`).join('\n')}\n\n¿De qué marca querés ver modelos?`;
      } else {
        respuesta = '📊 Estoy consultando el stock. ¿Qué marca específica te interesa?';
      }

    } else if (mensajeLower.includes('vulk') || mensajeLower.includes('sarkany') || 
               mensajeLower.includes('ray-ban') || mensajeLower.includes('oakley')) {
      
      // BUSCAR MODELOS DE MARCA ESPECÍFICA
      let marcaBuscada = '';
      if (mensajeLower.includes('vulk')) marcaBuscada = 'Vulk';
      else if (mensajeLower.includes('sarkany')) marcaBuscada = 'Sarkany';
      else if (mensajeLower.includes('ray-ban')) marcaBuscada = 'Ray-Ban';
      else if (mensajeLower.includes('oakley')) marcaBuscada = 'Oakley';
      
      const modelos = await dataManager.buscarPorMarca(marcaBuscada);
      
      if (modelos.length > 0) {
        respuesta = `👓 **${marcaBuscada} - Modelos en stock:**\n\n`;
        
        modelos.slice(0, 4).forEach((modelo, index) => {
          respuesta += `${index + 1}. ${modelo.modelo}\n`;
          respuesta += `   🎨 ${modelo.color} | 💰 $${modelo.precio} | 📦 ${modelo.stock} un.\n`;
          if (modelo.descripcion) respuesta += `   📝 ${modelo.descripcion}\n`;
          respuesta += '\n';
        });
        
        respuesta += `📍 **Vení a probártelos:** Serrano 684, Villa Crespo`;
      } else {
        respuesta = `🔍 No encontré modelos de ${marcaBuscada} en stock en este momento. ¿Te interesa otra marca?`;
      }

    } else if (mensajeLower.includes('stock') || mensajeLower.includes('disponible') || 
               mensajeLower.includes('modelo') || mensajeLower.includes('tienen')) {
      
      respuesta = '🔍 **Para consultar stock:**\n\nDecime qué marca te interesa:\n• Vulk\n• Sarkany\n• O alguna otra marca específica\n\n¿Qué buscás?';

    } else if (mensajeLower.includes('precio') || mensajeLower.includes('cuesta') || mensajeLower.includes('valor')) {
      
      // PRECIOS REALES SOLO SI HAY DATOS
      const rango = await dataManager.getRangoPreciosReal();
      
      if (rango) {
        respuesta = `💰 **Precios de armazones:**\n$${rango.min} - $${rango.max}\n\n*Varían según marca y modelo.*`;
      } else {
        respuesta = '💰 Los precios dependen del modelo y marca. ¿Te interesa alguna en particular para consultar?';
      }

    } else if (mensajeLower.includes('combo') || mensajeLower.includes('kit') || mensajeLower.includes('pack')) {
      
      const combos = dataManager.getCombos();
      respuesta = `🎁 **Kits disponibles:**\n\n${combos.map(c => `• **${c.nombre}** - $${c.precio}\n   📦 ${c.productos.join(', ')}`).join('\n\n')}\n\n¿Te interesa algún kit?`;

    } else if (mensajeLower.includes('obra social') || mensajeLower.includes('prepaga') || mensajeLower.includes('medicus')) {
      
      respuesta = '🏥 **Obras sociales:**\n• Medicus\n• Osetya\n• Construir Salud\n• Swiss Medical\n\n📋 Requisitos: Receta vigente + credencial';

    } else if (mensajeLower.includes('horario')) {
      
      respuesta = '⏰ **Horarios:**\nLunes a Sábado: 10:30 - 19:30\n\n📍 **Dirección:** Serrano 684, Villa Crespo';

    } else if (mensajeLower.includes('direccion') || mensajeLower.includes('ubicacion')) {
      
      respuesta = '📍 **Hypnottica Óptica**\nSerrano 684, Villa Crespo, CABA\n🚇 A 4 cuadras de Ángel Gallardo (Línea B)\n📞 1132774631';

    } else {
      
      respuesta = `🤔 No entendí "${message}".\n\nPodés preguntarme por:\n• Marcas de armazones\n• Lentes de contacto\n• Kits y combos\n• Horarios y dirección\n\n¿En qué te ayudo?`;
    }
    
    res.json({
      success: true,
      response: respuesta
    });
    
  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({
      success: false,
      response: '⚠️ Error temporal. Por favor, intentá nuevamente.'
    });
  }
});

// Probador web MEJORADO
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Hypnottica Bot - Stock Real</title>
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
            <h1>🤖 Hypnottica - Stock Real</h1>
            <p>Probá consultando marcas específicas:</p>
            
            <div class="quick-buttons">
                <button class="quick-btn" onclick="enviarMensaje('Marcas de armazones')">👓 Marcas reales</button>
                <button class="quick-btn" onclick="enviarMensaje('Lentes de contacto')">👁️ Lentes contacto</button>
                <button class="quick-btn" onclick="enviarMensaje('Vulk')">🕶️ Modelos Vulk</button>
                <button class="quick-btn" onclick="enviarMensaje('Kits disponibles')">🎁 Kits reales</button>
            </div>
            
            <div class="chat-box" id="chatBox">
                <div class="message bot-message">
                    ¡Hola! Consulto stock REAL de Google Sheets.
                    Probá preguntando por marcas específicas como "Vulk" o "Sarkany".
                </div>
            </div>
            
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Ej: Modelos Vulk en stock..." onkeypress="if(event.key=='Enter') enviarMensaje()">
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
  console.log('🚀 Bot mejorado en puerto ' + PORT);
});

module.exports = app;
