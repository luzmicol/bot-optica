// ==================== RUTA PRINCIPAL WHATSAPP ====================
app.post('/webhook', async (req, res) => {
  // --- MANEJO DE ERRORES GLOBAL ---
  try {
    const incomingMessage = req.body.Body.trim();
    const senderId = req.body.From;
    console.log(`Mensaje de ${senderId}: ${incomingMessage}`);

    let responseMessage = '';
    const messageLower = incomingMessage.toLowerCase();

    // --- DETECCIÓN DE INTENCIONES NATURALES ---
    
    // Saludo inicial
    if (messageLower.includes('hola') || messageLower === 'hi' || messageLower === '👋') {
      responseMessage = `¡Hola! 👋 Soy tu asistente de *Hypnottica*. ¿En qué puedo ayudarte hoy? Puedes preguntarme por stock, precios o agendar una cita.`;

    // Buscar stock por código (con o sin #)
    } else if (messageLower.startsWith('#stock ') || messageLower.startsWith('stock ') || /\b(stock|tenen|tienen|busco)\b.*\b([A-Za-z0-9\-]+)\b/.test(messageLower)) {
      // [Código de búsqueda por código...]

    // BÚSQUEDA INTELIGENTE POR DESCRIPCIÓN
    } else if (messageLower.includes('busco') || messageLower.includes('quiero') || messageLower.includes('tene') || 
               messageLower.includes('aviador') || messageLower.includes('wayfarer') || messageLower.includes('redondo') ||
               messageLower.includes('rectangular') || messageLower.includes('cuadrado') || messageLower.includes('angular') ||
               messageLower.includes('ray-ban') || messageLower.includes('oakley') || messageLower.includes('carter') ||
               messageLower.includes('vulk')) {
      // [Código de búsqueda inteligente...]

    // ==================== RESPUESTAS AUTOMÁTICAS NUEVAS ====================
    
    // MARCAS DISPONIBLES
    } else if (messageLower.includes('marca') || messageLower.includes('marcas') || messageLower.includes('que marca')) {
      const marcas = await obtenerMarcasUnicas();
      responseMessage = `🏷️  *Marcas que Trabajamos:*\n\n${marcas.join('\n')}\n\n_Escribí el nombre de una marca para ver modelos disponibles._`;

    // MEDIOS DE PAGO
    } else if (messageLower.includes('pago') || messageLower.includes('pagó') || messageLower.includes('pago') || 
               messageLower.includes('mercado pago') || messageLower.includes('transferencia') || 
               messageLower.includes('débito') || messageLower.includes('debito') || 
               messageLower.includes('credito') || messageLower.includes('crédito') || 
               messageLower.includes('efectivo') || messageLower.includes('descuento')) {
      responseMessage = `💳  *Medios de Pago Aceptados:*\n\n• 💵 *Efectivo*: 10% de descuento\n• 💳 *Tarjetas*: Débito y Crédito\n• 📱 *Transferencia*: Bancaria\n• 🔵 *Mercado Pago*\n\n_El descuento aplica sólo en pago en efectivo._`;

    // OBRAS SOCIALES
    } else if (messageLower.includes('obra social') || messageLower.includes('obras sociales') || 
               messageLower.includes('swiss') || messageLower.includes('medicus') || 
               messageLower.includes('construir') || messageLower.includes('osetya') ||
               messageLower.includes('beneficio') || messageLower.includes('cobertura')) {
      responseMessage = `🏥  *Obras Sociales que Trabajamos:*\n\n• Swiss Medical\n• Medicus\n• Construir Salud\n• Osetya\n\n📋  *Requisitos:*\n• Receta médica actualizada (válida 60 días)\n• Datos de la obra social y paciente\n• Tipo de lente especificado en receta\n\n_Presentá tu receta en el local para gestionar tu beneficio._`;

    // GARANTÍAS
    } else if (messageLower.includes('garantía') || messageLower.includes('garantia') || messageLower.includes('cambio')) {
      responseMessage = `🔧  *Garantía:*\n\n• Armazones: 6 meses por defectos de fabricación\n• Lentes y adaptaciones: Sin garantía\n\n_Conservá tu ticket de compra para hacer válida la garantía._`;

    // Agendar o turno
    } else if (messageLower.includes('agendar') || messageLower.includes('turno') || messageLower.includes('hora') || messageLower.includes('cita')) {
      responseMessage = `⏳  *Sistema de Agendamiento en Construcción*\n\nPróximamente podrás agendar tu turno directamente por aquí. Por ahora, te invitamos a llamarnos por teléfono para coordinar. ¡Gracias!`;

    // Precios
    } else if (messageLower.includes('precio') || messageLower.includes('cuesta') || messageLower.includes('sale')) {
      responseMessage = "💎  *Tenemos precios para todos los presupuestos*\n\nDesde armazones económicos hasta de primeras marcas. Contacta con un asesor para recibir una cotización personalizada sin compromiso.";

    // Dirección u horarios
    } else if (messageLower.includes('dirección') || messageLower.includes('donde') || messageLower.includes('ubic') || messageLower.includes('horario')) {
      responseMessage = "📍  *Nuestra Dirección:*\n\n*HYPNOTTICA*\nSerrano 684, Villa Crespo. CABA.\n\n🕙  *Horarios:*\nLunes a Sábados: 10:30 - 19:30";

    // Hablar con humano
    } else if (messageLower.includes('humano') || messageLower.includes('persona') || messageLower.includes('asesor') || messageLower.includes('telefono')) {
      responseMessage = "🔊  Te derivo con un asesor. Por favor, espera un momento...";

    } else {
      // --- CONSULTA A IA PARA PREGUNTAS ABIERTAS ---
      const marcasReales = await obtenerMarcasUnicas();
      const marcasTexto = marcasReales.join(', ');

      const promptIA = `Eres un asistente de la óptica Hypnottica. 
      INFORMACIÓN REAL ACTUALIZADA:
      - Marcas disponibles: ${marcasTexto}
      - Dirección: Serrano 684, Villa Crespo, CABA
      - Horarios: Lunes a Sábados 10:30-19:30
      - Medios de pago: Efectivo (10% descuento), tarjetas, transferencia, Mercado Pago
      - Obras sociales: Swiss Medical, Medicus, Construir Salud, Osetya
      
      Cliente pregunta: "${incomingMessage}". 
      Responde SOLO con información verificada. Si no sabés algo, decí la verdad.`;

      responseMessage = await consultarIA(promptIA);
    }

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(responseMessage);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
    
  } catch (error) {
    console.error('Error grave en el servidor:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('⚠️  Estoy teniendo problemas técnicos momentáneos. Por favor, intentá de nuevo en un minuto.');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});
