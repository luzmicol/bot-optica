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
app.post('/api/chat', (req, res) => {
  try {
    const { userId, message } = req.body;
    
    console.log('📩 Mensaje recibido:', { userId, message });
    
    const mensajeLower = message.toLowerCase();
    let respuesta = '';

    // DETECCIÓN MEJORADA
    if (mensajeLower.includes('hola') || mensajeLower.includes('buenas')) {
      respuesta = '¡Hola! Soy Luna, la asistente de Hypnottica. ¿En qué puedo ayudarte?\n\nPodés preguntarme por:\n• 👓 Armazones y marcas\n• 👁️ Lentes de contacto  \n• 💰 Precios y promociones\n• 🏥 Obras sociales\n• ⏰ Horarios\n• 📍 Dirección';

    } else if (mensajeLower.includes('direccion') || mensajeLower.includes('ubicacion') || mensajeLower.includes('dónde') || mensajeLower.includes('donde')) {
      respuesta = '📍 **Estamos en:**\nSerrano 684, Villa Crespo, CABA\n\n🚇 *A 4 cuadras del subte Ángel Gallardo (Línea B)*\n\n¿Querés que te comparta la ubicación en Google Maps?';

    } else if (mensajeLower.includes('horario') || mensajeLower.includes('hora') || mensajeLower.includes('abren') || mensajeLower.includes('cierran')) {
      respuesta = '⏰ **Nuestros horarios:**\nLunes a Sábado: 10:30 - 19:30\nDomingos: Cerrado\n\n¿Te sirve algún día en particular?';

    } else if (mensajeLower.includes('precio') || mensajeLower.includes('cuesta') || mensajeLower.includes('valor') || mensajeLower.includes('cuanto')) {
      respuesta = '💰 **Rangos de precios:**\n\n👓 **Armazones:** $55.000 - $370.000\n👁️ **Lentes de contacto:** $15.000 - $40.000\n🧴 **Líquidos:** $3.500 - $7.000\n\n💡 *Los precios varían según marca y características.*\n¿Te interesa algún producto en particular?';

    } else if (mensajeLower.includes('obra social') || mensajeLower.includes('prepaga') || mensajeLower.includes('medicus') || mensajeLower.includes('osetya') || mensajeLower.includes('swiss')) {
      respuesta = '🏥 **Obras sociales que aceptamos:**\n\n• Medicus\n• Osetya\n• Construir Salud\n• Swiss Medical\n\n📋 *Requisitos: Receta vigente (60 días) y credencial.*\n¿Tenés alguna obra social en particular?';

    } else if (mensajeLower.includes('vulk') || mensajeLower.includes('ray-ban') || mensajeLower.includes('oakley') || mensajeLower.includes('sarkany')) {
      const marca = mensajeLower.includes('vulk') ? 'Vulk' : 
                   mensajeLower.includes('ray-ban') ? 'Ray-Ban' :
                   mensajeLower.includes('oakley') ? 'Oakley' : 'Sarkany';
      respuesta = `👓 **Sí, trabajamos con ${marca}!**\n\nTenemos varios modelos disponibles. ¿Te interesa probarte alguno en persona? Los armazones se eligen siempre en la óptica para asegurar el ajuste perfecto.\n\n📍 *Serrano 684 - Villa Crespo*`;

    } else if (mensajeLower.includes('lente') && mensajeLower.includes('contacto')) {
      respuesta = '👁️ **¡Sí! Trabajamos con lentes de contacto.**\n\nMarcas: Acuvue, Biofinity, Air Optix\n\n¿Es tu primera vez o ya los usás?';

    } else if (mensajeLower.includes('armazon') || mensajeLower.includes('marco') || mensajeLower.includes('anteojo')) {
      respuesta = '👓 **Tenemos una gran variedad de armazones!**\n\nMarcas: Ray-Ban, Oakley, Vulk, Sarkany y más.\n\n💡 *Recomendación: Vení a la óptica para probártelos y encontrar el que mejor se adapte a tu rostro.*\n\n¿Te interesa alguna marca en particular?';

    } else if (mensajeLower.includes('stock') || mensajeLower.includes('disponible') || mensajeLower.includes('tienen')) {
      respuesta = '📦 **Para consultar stock específico:**\n\nNecesito que me digas qué producto buscás:\n• 👓 Armazones (qué marca/modelo)\n• 👁️ Lentes de contacto (qué marca)\n• 🧴 Líquidos\n\n¿Qué producto te interesa?';

    } else if (mensajeLower.includes('gracias') || mensajeLower.includes('chau') || mensajeLower.includes('adiós')) {
      respuesta = '¡Gracias por contactarte! 😊\n\nCualquier cosa, estoy acá para ayudarte.\n\n📍 *Recordá: Serrano 684, Villa Crespo*\n📞 *Tel: 1132774631*';

    } else {
      respuesta = `🤔 No estoy segura de entender "${message}".\n\n¿Podés preguntarme algo de esto?\n\n• 👓 Marcas de armazones (Ray-Ban, Vulk, etc.)\n• 👁️ Lentes de contacto\n• 💰 Precios\n• 🏥 Obras sociales\n• ⏰ Horarios\n• 📍 Dirección\n• 📦 Stock`;
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
