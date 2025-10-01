const express = require('express');
const GoogleSheetsService = require('./src/services/googleSheetsService');
const IntentRecognizer = require('./src/intents/recognition');
const config = require('./src/config/optica');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar servicios
const sheetsService = new GoogleSheetsService();
const intentRecognizer = new IntentRecognizer();

// 🟢 MANEJADOR PRINCIPAL DE MENSAJES
async function procesarMensaje(mensaje, contexto = {}) {
  const intent = intentRecognizer.detectIntent(mensaje);
  console.log(`🎯 Intención detectada: ${intent}`);

  switch (intent) {
    case 'saludo':
      return `👋 ¡Hola! Soy ${config.bot.nombre}, tu asistente de ${config.optica.nombre}. ¿En qué puedo ayudarte hoy? 🌙\n\nPuedo ayudarte con:\n• Consultas de stock\n• Precios y promociones\n• Obras sociales\n• Lentes de contacto\n• Horarios y ubicación`;

    case 'despedida':
      return `👋 ¡Fue un gusto ayudarte! No dudes en escribirme si tenés más preguntas.\n\n${config.optica.nombre} - Tu visión, nuestra pasión.`;

    case 'obra_social':
      const obraSocial = intentRecognizer.extractObraSocial(mensaje);
      const obrasLista = config.obrasSociales.aceptadas.map(os => `• ${os}`).join('\n');
      
      let respuestaOS = `🏥 ${obraSocial ? `Sí, trabajamos con ${obraSocial}.` : 'Obras sociales que aceptamos:'}\n\n${obrasLista}\n\n`;
      respuestaOS += `📋 *Requisitos:*\n`;
      respuestaOS += `• Receta: ${config.obrasSociales.requisitos.receta}\n`;
      respuestaOS += `• Documentación: ${config.obrasSociales.requisitos.documentacion}\n`;
      respuestaOS += `• Vigencia: ${config.obrasSociales.requisitos.vigencia}\n`;
      respuestaOS += `• ${config.obrasSociales.requisitos.restricciones}\n\n`;
      respuestaOS += `💡 *¿Necesitás agendar una consulta?*`;
      
      return respuestaOS;

    case 'stock_codigo':
      const codigo = intentRecognizer.extractCodigo(mensaje);
      if (!codigo) {
        return "❌ Por favor, indicá el código del producto. Ejemplo: \"#stock AC-274\"";
      }
      
      const producto = await sheetsService.buscarArmazon(codigo);
      if (producto) {
        const stockMsg = producto.disponible ? `✅ Stock: ${producto.cantidad} unidades` : '❌ Sin stock';
        return `📦 *${producto.marca} - ${producto.modelo}*\n\n🆔 Código: ${producto.codigo}\n👓 Tipo: ${producto.tipo}\n📝 ${producto.descripcion}\n${stockMsg}\n💲 Precio: $${producto.precio}`;
      } else {
        return "❌ No encontré ningún producto con ese código. ¿Podrías verificarlo?";
      }

    case 'busqueda_producto':
      const productos = await sheetsService.buscarPorDescripcion(mensaje);
      if (productos.length > 0) {
        let respuesta = `🔍 *Encontré estas opciones para vos:*\n\n`;
        productos.forEach((p, index) => {
          const stock = p.disponible ? `(Stock disponible)` : '(Sin stock)';
          respuesta += `${index + 1}. *${p.codigo}* - ${p.marca} ${p.modelo} - $${p.precio} ${stock}\n`;
        });
        respuesta += `\n*Escribí #stock [código] para más detalles.*`;
        return respuesta;
      } else {
        return "❌ No encontré productos con esa descripción. ¿Podrías ser más específico?";
      }

    case 'precios':
      let respuestaPrecios = `💲 *Precios y Promociones*\n\n`;
      respuestaPrecios += `📦 *Armazones:* ${config.precios.rango}\n\n`;
      respuestaPrecios += `🎁 *Promociones vigentes:*\n`;
      Object.entries(config.precios.promociones).forEach(([promo, detalle]) => {
        respuestaPrecios += `• ${promo}: ${detalle}\n`;
      });
      respuestaPrecios += `\n💳 *Medios de pago:* ${config.precios.mediosPago.join(', ')}`;
      return respuestaPrecios;

    case 'horarios':
      return `⏰ *Horarios de atención:*\n${config.optica.horarios}\n\n📍 ${config.optica.direccion}`;

    case 'ubicacion':
      return `📍 *Nuestra dirección:*\n${config.optica.direccion}\n\n⏰ *Horarios:* ${config.optica.horarios}\n\n📱 *Seguinos:* ${config.optica.redes.instagram}`;

    case 'lentes_contacto':
      const marcasLC = await sheetsService.obtenerMarcasLC();
      let respuestaLC = `👁️ *¡Sí! Trabajamos con lentes de contacto* ✅\n\n`;
      respuestaLC += `🏷️ *Marcas disponibles:*\n${marcasLC.map(m => `• ${m}`).join('\n')}\n\n`;
      respuestaLC += `📋 *Tipos:* ${config.productos.lentesContacto.tipos.join(', ')}\n`;
      respuestaLC += `💡 *Nota:* ${config.productos.lentesContacto.nota}\n\n`;
      respuestaLC += `❓ *Preguntas frecuentes:*\n`;
      respuestaLC += `• ¿Necesito receta? → No es obligatoria, pero se recomienda\n`;
      respuestaLC += `• ¿Cómo se colocan? → Te enseñamos todo el proceso\n`;
      respuestaLC += `• ¿Son cómodos? → Sí, tras breve adaptación\n\n`;
      respuestaLC += `⏰ *Horario de adaptación:* hasta las 18:30`;
      return respuestaLC;

    case 'liquidos':
      const liquidos = await sheetsService.obtenerLiquidos();
      let respuestaLiquidos = `🧴 *Líquidos para lentes de contacto:*\n\n`;
      if (liquidos.length > 0) {
        respuestaLiquidos += `📦 *Productos disponibles:*\n`;
        liquidos.forEach(l => {
          respuestaLiquidos += `• ${l.marca} - ${l.tamaño}\n`;
        });
      } else {
        respuestaLiquidos += `💧 Contamos con líquidos de las principales marcas\n`;
      }
      respuestaLiquidos += `\n💲 *Precios promocionales* todos los meses\n🎁 *Descuentos* por cantidad`;
      return respuestaLiquidos;

    case 'marcas':
      const todosProductos = await sheetsService.leerHoja('STOCK ARMAZONES 1');
      const marcas = [...new Set(todosProductos.map(p => p['Marca']).filter(m => m))].sort();
      const marcasMostrar = marcas.slice(0, 10);
      
      let respuestaMarcas = `👓 *Algunas de las marcas que trabajamos:*\n\n${marcasMostrar.map(m => `• ${m}`).join('\n')}`;
      if (marcas.length > 10) respuestaMarcas += `\n\n...y ${marcas.length - 10} marcas más.`;
      respuestaMarcas += `\n\n¿Te interesa alguna marca en particular?`;
      return respuestaMarcas;

    default:
      return `🤔 No estoy segura de entenderte. ¿Podrías decirlo de otra forma?\n\nPodés preguntarme por:\n• Stock de productos\n• Precios y promociones\n• Obras sociales\n• Horarios y ubicación\n• Lentes de contacto\n\nO escribí *"hola"* para ver todas las opciones.`;
  }
}

// 🟢 RUTAS EXISTENTES (las mantienes)
app.get('/debug-sheets', async (req, res) => {
  try {
    const diagnostico = await sheetsService.diagnostico();
    res.json(diagnostico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/probar-bot', async (req, res) => {
  try {
    const { mensaje } = req.body;
    const respuesta = await procesarMensaje(mensaje);
    res.json({ mensaje_original: mensaje, respuesta });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ... (mantener tus otras rutas existentes)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 ${config.bot.nombre} funcionando en puerto ${PORT}`);
});
