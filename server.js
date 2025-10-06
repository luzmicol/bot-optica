require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de chat
app.post('/api/chat', (req, res) => {
  try {
    const { userId, message } = req.body;
    
    console.log('📩 Mensaje recibido:', { userId, message });
    
    // Respuestas básicas según el mensaje
    let respuesta = '';
    
    if (message.toLowerCase().includes('hola')) {
      respuesta = '¡Hola! Soy Luna, la asistente de Hypnottica. ¿En qué puedo ayudarte?';
    } else if (message.toLowerCase().includes('precio')) {
      respuesta = 'Los armazones van desde $55.000 hasta $370.000. ¿Te interesa algún modelo en particular?';
    } else if (message.toLowerCase().includes('horario')) {
      respuesta = 'Abrimos de lunes a sábado de 10:30 a 19:30. ¿Te sirve algún día específico?';
    } else if (message.toLowerCase().includes('dirección')) {
      respuesta = 'Estamos en Serrano 684, Villa Crespo. ¿Necesitás la ubicación exacta?';
    } else {
      respuesta = `Entendí que dijiste: "${message}". ¿Podés contarme más sobre lo que necesitás?`;
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
      error: 'Error interno del servidor'
    });
  }
});

// Probador web SUPER SIMPLE
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Probador Bot</title>
        <meta charset="UTF-8">
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px; 
                background: #f5f5f5;
            }
            .container {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .chat-box {
                height: 400px;
                border: 1px solid #ddd;
                padding: 15px;
                margin: 20px 0;
                overflow-y: auto;
                background: #fafafa;
            }
            .message {
                margin: 10px 0;
                padding: 10px;
                border-radius: 10px;
                max-width: 80%;
            }
            .user-message {
                background: #007bff;
                color: white;
                margin-left: auto;
            }
            .bot-message {
                background: #e9ecef;
                color: #333;
                margin-right: auto;
            }
            .input-container {
                display: flex;
                gap: 10px;
            }
            input {
                flex: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            button {
                padding: 10px 20px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            .quick-buttons {
                display: flex;
                gap: 10px;
                margin: 10px 0;
                flex-wrap: wrap;
            }
            .quick-btn {
                padding: 8px 12px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Probador - Hypnottica Bot</h1>
            <p>Probá el bot con estos mensajes rápidos:</p>
            
            <div class="quick-buttons">
                <button class="quick-btn" onclick="enviarMensaje('Hola')">👋 Hola</button>
                <button class="quick-btn" onclick="enviarMensaje('Precios')">💰 Precios</button>
                <button class="quick-btn" onclick="enviarMensaje('Horarios')">⏰ Horarios</button>
                <button class="quick-btn" onclick="enviarMensaje('Dirección')">📍 Dirección</button>
            </div>
            
            <div class="chat-box" id="chatBox">
                <div class="message bot-message">
                    ¡Hola! Soy Luna. Escribí un mensaje o usá los botones de arriba.
                </div>
            </div>
            
            <div class="input-container">
                <input type="text" id="messageInput" placeholder="Escribe tu mensaje...">
                <button onclick="enviarMensaje()">Enviar</button>
            </div>
        </div>

        <script>
            function agregarMensaje(texto, esUsuario = false) {
                const chatBox = document.getElementById('chatBox');
                const mensaje = document.createElement('div');
                mensaje.className = esUsuario ? 'message user-message' : 'message bot-message';
                mensaje.textContent = texto;
                chatBox.appendChild(mensaje);
                chatBox.scrollTop = chatBox.scrollHeight;
            }

            async function enviarMensaje(mensajePredefinido = null) {
                const input = document.getElementById('messageInput');
                const mensaje = mensajePredefinido || input.value.trim();
                
                if (!mensaje) return;
                
                // Limpiar input si no es un mensaje predefinido
                if (!mensajePredefinido) {
                    input.value = '';
                }
                
                agregarMensaje(mensaje, true);
                
                try {
                    const respuesta = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            userId: 'user-' + Date.now(),
                            message: mensaje
                        })
                    });
                    
                    const datos = await respuesta.json();
                    
                    if (datos.success) {
                        agregarMensaje(datos.response);
                    } else {
                        agregarMensaje('❌ Error: ' + (datos.error || 'Desconocido'));
                    }
                    
                } catch (error) {
                    agregarMensaje('❌ Error de conexión con el servidor');
                }
            }

            // Enter para enviar
            document.getElementById('messageInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    enviarMensaje();
                }
            });
        </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 Servidor funcionando en puerto ' + PORT);
  console.log('🌐 Probador: https://tu-bot.onrender.com');
  console.log('❤️  Health: https://tu-bot.onrender.com/health');
});

module.exports = app;
