// server.js

const express = require('express');
const { config } = require('./src/config/optica');
const GoogleSheetsService = require('./src/services/googleSheetsService');
const IntentRecognizer = require('./src/intents/recognition');
const MemoryService = require('./src/services/memoryService');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const googleSheetsService = new GoogleSheetsService();
const memoryService = new MemoryService();

// Función principal para procesar mensajes
async function procesarMensaje(mensaje, senderId) {
  try {
    // Obtener contexto del usuario
    let contexto = await memoryService.obtenerContextoUsuario(senderId);

    // Detectar intención
    const intencion = IntentRecognizer.detectIntent(mensaje);

    // Procesar según la intención
    let respuesta = await procesarIntencion(intencion, mensaje, contexto);

    // Guardar contexto actualizado
    contexto.ultimaIntencion = intencion;
    contexto.historial = contexto.historial || [];
    contexto.historial.push({ mensaje, respuesta, timestamp: Date.now() });
    await memoryService.guardarContextoUsuario(senderId, contexto);

    return respuesta;
  } catch (error) {
    console.error('Error procesando mensaje:', error);
    return '❌ Ocurrió un error procesando tu mensaje. Por favor, intentá nuevamente.';
  }
}

async function procesarIntencion(intencion, mensaje, contexto) {
  switch (intencion) {
    case 'greeting':
      return `👋 ¡Hola! Soy ${config.personalidad.nombre}, tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy?\n\n• Consultar stock\n• Precios\n• Agendar cita\n• Obras sociales\n• Ubicación y horarios`;

    case 'farewell':
      return `👋 ¡Fue un gusto ayudarte! No dudes en escribirme si tenés más preguntas.\n\n*Hypnottica* - Tu visión, nuestra pasión.`;

    case 'health_insurance':
      return `🏥 *Obras Sociales que aceptamos:*\n\n${config.obrasSociales.aceptadas.map(os => `• ${os}`).join('\n')}\n\n💡 *Requisitos:*\n${config.obrasSociales.requisitos.receta}\n\n📄 *Documentación:* ${config.obrasSociales.requisitos.documentacion}\n⏳ *Vigencia receta:* ${config.obrasSociales.requisitos.vigencia}\n${config.obrasSociales.requisitos.restricciones}`;

    case 'price_query':
      return `💲 *Precios de armazones:*\n${config.precios.rangoArmazones}\n\n💳 *Promociones:*\n${Object.entries(config.precios.promociones.cuotas).map(([key, value]) => `• ${key}: ${value}`).join('\n')}\n\n💰 *Descuento por pago en efectivo:* ${config.precios.promociones.descuentoEfectivo}`;

    case 'brand_query':
      const marcasArmazones = await googleSheetsService.obtenerTodosProductos();
      const marcasUnicas = [...new Set(marcasArmazones.map(p => p.marca).filter(m => m !== 'N/A'))];
      return `👓 *Marcas de armazones que trabajamos:*\n${marcasUnicas.map(m => `• ${m}`).join('\n')}\n\n👁️ *Marcas de lentes de contacto:*\n${config.productos.lentesContacto.marcas.map(m => `• ${m}`).join('\n')}`;

    case 'stock_code_query':
      const codigo = mensaje.split(' ')[1];
      if (!codigo) {
        return "❌ Por favor, indicá el código del producto. Ejemplo: `#stock AC-274`";
      }
      const producto = await googleSheetsService.buscarPorCodigo(codigo);
      if (producto) {
        return `📦 *${producto.marca} - ${producto.modelo}*\n\n🆔 Código: ${producto.codigo}\n👓 Tipo: ${producto.tipo_lente}\n📝 Descripción: ${producto.descripcion}\n💰 Precio: $${producto.precio}\n📊 Stock: ${producto.cantidad} unidades\n${producto.disponible ? '✅ DISPONIBLE' : '❌ SIN STOCK'}`;
      } else {
        return "❌ No se encontró ningún producto con ese código. ¿Podrías verificarlo?";
      }

    case 'stock_search_query':
      // Aquí podrías implementar una búsqueda por descripción
      return "🔍 Contame qué tipo de lentes buscás (por ejemplo: 'lentes de sol ray-ban') y te ayudo a encontrar opciones.";

    case 'contact_lens_query':
      const marcasLC = await googleSheetsService.obtenerMarcasLC();
      return `👁️ *Lentes de contacto*\n\n📋 *Marcas disponibles:*\n${marcasLC.map(m => `• ${m}`).join('\n')}\n\n💡 *Tipos:* ${config.productos.lentesContacto.tipos.join(', ')}\n\n${config.productos.lentesContacto.nota}`;

    case 'liquid_query':
      const liquidos = await googleSheetsService.obtenerLiquidos();
      return `🧴 *Líquidos para lentes de contacto:*\n\n${liquidos.map(l => `• ${l.marca} - ${l.tamaño}`).join('\n')}`;

    case 'schedule_query':
      return `⏰ *Horarios de atención:*\n${config.horarios}\n\n📍 ${config.direccion}`;

    case 'location_query':
      return `📍 *Nuestra dirección:*\n${config.direccion}\n\n⏰ *Horarios:* ${config.horarios}`;

    case 'shipping_query':
      return `🚚 *Envíos a domicilio:*\n${config.consultasFrecuentes.envios}`;

    case 'financing_query':
      return `💳 *Financiación:*\n${config.consultasFrecuentes.financiacion}`;

    case 'frequent_question':
      // Podrías tener un sistema de preguntas frecuentes más elaborado
      return `🤔 *Preguntas frecuentes:*\n\n• Precios: ${config.consultasFrecuentes.precios}\n• Obras sociales: ${config.consultasFrecuentes.obrasSociales}\n• Tiempos de entrega: Particulares: ${config.consultasFrecuentes.tiempoEntrega.particulares}, Obra social: ${config.consultasFrecuentes.tiempoEntrega.obraSocial}\n• Ubicación: ${config.consultasFrecuentes.ubicacion}\n• Horarios: ${config.consultasFrecuentes.horarios}`;

    default:
      return `🤔 No estoy segura de entenderte. ¿Podrías decirlo de otra forma?\n\nPodés preguntarme por:\n• Stock de productos\n• Precios\n• Marcas\n• Horarios\n• Obras sociales\n\nO escribí *"hola"* para ver todas las opciones.`;
  }
}

// Ruta para el probador web
app.post('/probar-bot', async (req, res) => {
  try {
    const { mensaje } = req.body;
    const respuesta = await procesarMensaje(mensaje, 'web-user');
    res.json({ respuesta });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta de diagnóstico
app.get('/debug-sheets', async (req, res) => {
  try {
    await googleSheetsService.initialize();
    const armazones = await googleSheetsService.obtenerProductosDeSheet('STOCK ARMAZONES 1');
    const lc = await googleSheetsService.obtenerProductosDeSheet('Stock LC');
    const liquidos = await googleSheetsService.obtenerProductosDeSheet('Stock Liquidos');

    res.json({
      configuracion: {
        sheets_id: process.env.GOOGLE_SHEETS_ID ? '✅ Configurado' : '❌ Faltante',
        api_key: process.env.GOOGLE_API_KEY ? '✅ Configurado' : '❌ Faltante'
      },
      hojas: {
        'STOCK ARMAZONES 1': { productos: armazones.length },
        'Stock LC': { productos: lc.length },
        'Stock Liquidos': { productos: liquidos.length }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 ${config.personalidad.nombre} funcionando en puerto ${PORT}`);
});
