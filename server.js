require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const BaseBot = require('./core/BaseBot');
const HYPNOTTICA_CONFIG = require('./businesses/hypnottica/config');

class HypnotticaFramework {
  constructor() {
    this.app = express();
    this.bot = null;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupProbador();
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'Hypnottica AI Framework',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        business: 'hypnottica',
        features: [
          'google-sheets-integration',
          'context-management', 
          'product-catalog',
          'multi-intent-handling',
          'web-chat-interface'
        ]
      });
    });

    // Business info
    this.app.get('/api/business', (req, res) => {
      res.json({
        business: HYPNOTTICA_CONFIG,
        endpoints: {
          chat: 'POST /api/chat',
          health: 'GET /health',
          business: 'GET /api/business',
          probador: 'GET /probador'
        }
      });
    });

    // Main chat endpoint
    this.app.post('/api/chat', async (req, res) => {
      try {
        const { userId, message, channel = 'web' } = req.body;

        if (!userId || !message) {
          return res.status(400).json({
            success: false,
            error: 'Se requieren userId y message'
          });
        }

        console.log(`💬 Chat request - User: ${userId}, Channel: ${channel}`);

        // Asegurar que el bot esté inicializado
        if (!this.bot) {
          this.bot = new BaseBot(HYPNOTTICA_CONFIG);
          await this.bot.initialize();
        }

        const response = await this.bot.processMessage(userId, message);

        // Analytics básico
        this.trackInteraction(userId, message, response, channel);

        res.json({
          success: true,
          response,
          business: 'hypnottica',
          timestamp: new Date().toISOString(),
          context: {
            userId,
            channel,
            messageLength: message.length
          }
        });

      } catch (error) {
        console.error('❌ Error en endpoint /api/chat:', error);
        
        res.status(500).json({
          success: false,
          response: "⚠️ Estoy teniendo dificultades técnicas. Por favor, intentá nuevamente en unos momentos.",
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Endpoint para probar conexión con Google Sheets
    this.app.get('/api/test-sheets', async (req, res) => {
      try {
        if (!this.bot) {
          this.bot = new BaseBot(HYPNOTTICA_CONFIG);
          await this.bot.initialize();
        }

        const armazones = await this.bot.dataManager.getProducts('armazones');
        const lentesContacto = await this.bot.dataManager.getProducts('lentes_contacto');
        const liquidos = await this.bot.dataManager.getProducts('liquidos');

        res.json({
          success: true,
          sheets: {
            armazones: {
              count: armazones.length,
              sample: armazones.slice(0, 3)
            },
            lentes_contacto: {
              count: lentesContacto.length,
              sample: lentesContacto.slice(0, 3)
            },
            liquidos: {
              count: liquidos.length,
              sample: liquidos.slice(0, 3)
            }
          }
        });

      } catch (error) {
        console.error('Error testing sheets:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  }

   setupProbador() {
    // Crear carpeta public si no existe
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public');
    }

    // HTML del probador CORREGIDO
    const probadorHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Probador - Hypnottica Bot</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
            height: 90vh;
            display: flex;
            flex-direction: column;
        }
        .header { 
            background: linear-gradient(135deg, #25D366, #128C7E); 
            color: white; 
            padding: 20px; 
            text-align: center; 
        }
        .chat-container { 
            flex: 1;
            padding: 15px; 
            overflow-y: auto; 
            border-bottom: 1px solid #eee; 
            display: flex;
            flex-direction: column;
        }
        .message { 
            margin: 8px 0; 
            padding: 12px 16px; 
            border-radius: 18px; 
            max-width: 85%; 
            animation: fadeIn 0.3s; 
            line-height: 1.4;
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
            padding: 15px; 
            display: flex; 
            gap: 10px; 
            background: #f8f9fa;
        }
        .input-container input { 
            flex: 1; 
            padding: 12px 16px; 
            border: 2px solid #ddd; 
            border-radius: 25px; 
            font-size: 16px; 
        }
        .input-container button { 
            padding: 12px 20px; 
            background: #25D366; 
            color: white; 
            border: none; 
            border-radius: 25px; 
            cursor: pointer; 
        }
        .quick-buttons { 
            padding: 12px 15px; 
            background: #f8f9fa; 
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px; 
        }
        .quick-button { 
            padding: 8px 12px; 
            background: white; 
            border: 1px solid #25D366; 
            border-radius: 15px; 
            color: #25D366; 
            cursor: pointer; 
            font-size: 12px; 
        }
        @keyframes fadeIn { 
            from { opacity: 0; transform: translateY(10px); } 
            to { opacity: 1; transform: translateY(0); } 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Probador - Hypnottica Bot</h1>
            <p>Probá las respuestas del bot en tiempo real</p>
        </div>
        
        <div class="chat-container" id="chatContainer">
            <div class="message bot-message">
                ¡Hola! Soy Luna, tu asistente de Hypnottica. 😊

¿En qué puedo ayudarte hoy?

• 👓 Consultar armazones y modelos
• 👁️ Información de lentes de contacto  
• 💰 Precios y promociones
• 📦 Stock disponible
• 🏥 Obras sociales
• ⏰ Horarios de atención
• 📍 Dirección y ubicación
            </div>
        </div>
        
        <div class="quick-buttons">
            <div class="quick-button" onclick="enviarMensajeRapido('Hola')">👋 Hola</div>
            <div class="quick-button" onclick="enviarMensajeRapido('Qué armazones tienen?')">👓 Armazones</div>
            <div class="quick-button" onclick="enviarMensajeRapido('Precios')">💰 Precios</div>
            <div class="quick-button" onclick="enviarMensajeRapido('Lentes de contacto')">👁️ Lentes contacto</div>
            <div class="quick-button" onclick="enviarMensajeRapido('Horarios')">⏰ Horarios</div>
            <div class="quick-button" onclick="enviarMensajeRapido('Dirección')">📍 Dirección</div>
        </div>
        
        <div class="input-container">
            <input type="text" id="mensajeInput" placeholder="Escribe tu mensaje...">
            <button onclick="enviarMensaje()">Enviar</button>
        </div>
    </div>

    <script>
        const userId = 'user-' + Math.random().toString(36).substring(2, 9);
        
        function agregarMensaje(mensaje, esUsuario = false) {
            const chatContainer = document.getElementById('chatContainer');
            const mensajeDiv = document.createElement('div');
            mensajeDiv.className = esUsuario ? 'message user-message' : 'message bot-message';
            mensajeDiv.textContent = mensaje;
            chatContainer.appendChild(mensajeDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        async function enviarMensaje() {
            const input = document.getElementById('mensajeInput');
            const mensaje = input.value.trim();
            
            if (!mensaje) return;
            
            agregarMensaje(mensaje, true);
            input.value = '';
            
            try {
                const respuesta = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({ 
                        userId: userId,
                        message: mensaje 
                    })
                });
                
                const datos = await respuesta.json();
                
                if (datos.success) {
                    agregarMensaje(datos.response);
                } else {
                    agregarMensaje('Error: ' + (datos.error || 'Desconocido'));
                }
                
            } catch (error) {
                agregarMensaje('Error de conexión con el servidor');
            }
        }
        
        function enviarMensajeRapido(mensaje) {
            document.getElementById('mensajeInput').value = mensaje;
            enviarMensaje();
        }

        // Enter para enviar
        document.getElementById('mensajeInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                enviarMensaje();
            }
        });

        console.log('User ID:', userId);
    </script>
</body>
</html>
`;

    // Guardar el probador
    fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), probadorHTML);

    // Ruta para el probador web
    this.app.get('/probador', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Ruta raíz también redirige al probador
    this.app.get('/', (req, res) => {
      res.redirect('/probador');
    });

    // Servir archivos estáticos
    this.app.use(express.static('public'));
  }

  trackInteraction(userId, message, response, channel) {
    // Analytics básico
    console.log(`📊 Analytics - User: ${userId}, Channel: ${channel}, ` +
                `Message: "${message.substring(0, 50)}...", ` +
                `Response: ${response.length} chars`);
  }

  async start() {
    try {
      // Inicializar el bot
      this.bot = new BaseBot(HYPNOTTICA_CONFIG);
      await this.bot.initialize();

      const PORT = process.env.PORT || 3000;
      
      this.app.listen(PORT, () => {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 HYPNOTTICA AI FRAMEWORK INICIADO CORRECTAMENTE');
        console.log('='.repeat(60));
        console.log(`📍 Puerto: ${PORT}`);
        console.log(`🏢 Negocio: ${HYPNOTTICA_CONFIG.name}`);
        console.log(`🤖 Bot: ${HYPNOTTICA_CONFIG.personality.name}`);
        console.log(`📊 Fuentes de datos: Google Sheets (${Object.keys(HYPNOTTICA_CONFIG.dataSources).length} sheets)`);
        console.log(`🌐 Probador: http://localhost:${PORT}/probador`);
        console.log(`🌐 Health: http://localhost:${PORT}/health`);
        console.log(`🌐 Entornos: ${process.env.NODE_ENV || 'development'}`);
        console.log('='.repeat(60));
        console.log('\n📋 Endpoints disponibles:');
        console.log(`   GET  /                   - Probador web`);
        console.log(`   GET  /probador           - Probador web`);
        console.log(`   GET  /health             - Health check`);
        console.log(`   GET  /api/business       - Información del negocio`);
        console.log(`   POST /api/chat           - Chat principal`);
        console.log(`   GET  /api/test-sheets    - Probar conexión Sheets`);
        console.log('\n💡 ¡El bot está listo para usar!');
        console.log('\n');
      });

    } catch (error) {
      console.error('❌ Error iniciando el framework:', error);
      process.exit(1);
    }
  }
}

// Iniciar la aplicación
const framework = new HypnotticaFramework();
framework.start();

module.exports = framework.app;
