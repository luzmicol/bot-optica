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

// Endpoint de chat MEJORADO
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    console.log('Mensaje recibido:', { userId, message });
    
    const mensajeLower = message.toLowerCase();
    let respuesta = '';

    if (mensajeLower.includes('hola') || mensajeLower.includes('buenas')) {
      respuesta = '¡Hola! Soy Luna 👋, asistente de Hypnottica. ¿En qué puedo ayudarte?\n\nPodés consultar:\n• 👓 Armazones en stock\n• 👁️ Lentes de contacto\n• 🧴 Líquidos y accesorios\n• 💰 Precios\n• 📍 Dirección y horarios';

    } else if (mensajeLower.includes('marca') || mensajeLower.includes('armazon') || 
               mensajeLower.includes('ray-ban') || mensajeLower.includes('oakley') || 
               mensajeLower.includes('vulk') || mensajeLower.includes('sarkany')) {
      
      respuesta = `👓 **Marcas que trabajamos:**\n\n• Ray-Ban\n• Oakley\n• Vulk\n• Sarkany\n• Y muchas más\n\n¿Te interesa ver disponibilidad de alguna marca en particular?`;

    } else if (mensajeLower.includes('stock') || mensajeLower.includes('disponible') || 
               mensajeLower.includes('tienen') || mensajeLower.includes('modelo')) {
      
      respuesta = '📦 Para consultar stock específico, necesito que me digas:\n\n• Qué marca te interesa (Ray-Ban, Oakley, Vulk, etc.)\n• O algún modelo en particular\n\n¿Qué estás buscando?';

    } else if (mensajeLower.includes('lente') && mensajeLower.includes('contacto')) {
      respuesta = `👁️ **Lentes de contacto disponibles:**\n\n• Acuvue Oasis (Mensuales/Diarios)\n• Biofinity (Mensuales)\n• Air Optix (Mensuales)\n\n¿Te interesa alguna marca?`;

    } else if (mensajeLower.includes('liquido') || mensajeLower.includes('solucion')) {
      respuesta = `🧴 **Líquidos y soluciones:**\n\n• Solución Multiuso (Renu, Opti-Free)\n• Gotas Humectantes (Systane, Blink)\n• Peróxido (Ao Sept, Clear Care)\n\n¿Qué tipo de líquido necesitás?`;

    } else if (mensajeLower.includes('precio') || mensajeLower.includes('cuesta') || mensajeLower.includes('valor')) {
      respuesta = `💰 **Rangos de precios:**\n\n👓 Armazones: $55.000 - $370.000\n👁️ Lentes de contacto: $15.000 - $25.000\n🧴 Líquidos: $3.500 - $7.000\n\n*Los precios varían según marca y características.*`;

    } else if (mensajeLower.includes('direccion') || mensajeLower.includes('ubicacion')) {
      respuesta = '📍 **Hypnottica Óptica**\nSerrano 684, Villa Crespo, CABA\n🚇 A 4 cuadras de Ángel Gallardo (Línea B)\n📞 1132774631';

    } else if (mensajeLower.includes('horario')) {
      respuesta = '⏰ **Horarios de atención:**\nLunes a Sábado: 10:30 - 19:30\n\n¿Te sirve algún día en particular?';

    } else if (mensajeLower.includes('obra social')) {
      respuesta = '🏥 **Obras sociales que aceptamos:**\n\n• Medicus\n• Osetya\n• Construir Salud\n• Swiss Medical\n\n¿Tenés alguna en particular?';

    } else {
      respuesta = `🤔 No estoy segura de entender "${message}".\n\nPodés preguntarme por:\n• Marcas y modelos de armazones\n• Stock disponible\n• Precios\n• Lentes de contacto\n• Líquidos y accesorios\n• Horarios y dirección`;
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
      response: '⚠️ Estoy teniendo dificultades técnicas. Por favor, intentá nuevamente.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
                white-space: pre-line;
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
                <button class="quick-btn" onclick="enviarMensaje('Marcas de armazones')">👓 Marcas</button>
                <button class="quick-btn" onclick="enviarMensaje('Precios')">💰 Precios</button>
                <button class="quick-btn" onclick="enviarMensaje('Lentes de contacto')">👁️ Lentes contacto</button>
                <button class="quick-btn" onclick="enviarMensaje('Horarios')">⏰ Horarios</button>
                <button class="quick-btn" onclick="enviarMensaje('Obras sociales')">🏥 Obras sociales</button>
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
                        agregarMensaje('Error: ' + (datos.error || 'Desconocido'));
                    }
                    
                } catch (error) {
                    agregarMensaje('Error de conexión con el servidor');
                }
            }

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
