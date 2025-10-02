const DataManager = require('./DataManager');
const ContextManager = require('./ContextManager');

class BaseBot {
  constructor(businessConfig) {
    this.config = businessConfig;
    this.dataManager = new DataManager();
    this.contextManager = new ContextManager();
    this.initialized = false;
    
    console.log(`🤖 Inicializando bot para: ${businessConfig.name}`);
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.dataManager.initialize();
      this.initialized = true;
      console.log(`✅ Bot ${this.config.name} inicializado correctamente`);
    } catch (error) {
      console.error(`❌ Error inicializando bot ${this.config.name}:`, error);
      throw error;
    }
  }

  async processMessage(userId, message) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`💬 Procesando mensaje de ${userId}: "${message}"`);
    
    const context = this.contextManager.getContext(userId);
    
    try {
      // 1. Detectar intención (por ahora con lógica simple)
      const intent = this.detectIntent(message, context);
      
      // 2. Procesar según la intención
      const response = await this.handleIntent(intent, message, context);
      
      // 3. Actualizar contexto e historial
      this.contextManager.addToHistory(userId, message, response);
      this.contextManager.updateContext(userId, {
        currentIntent: intent,
        lastMessage: message,
        lastResponse: response
      });

      console.log(`✅ Respuesta generada: ${response.substring(0, 100)}...`);
      
      return response;
      
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      return this.getFallbackResponse(message, context);
    }
  }

  detectIntent(message, context) {
    const msg = message.toLowerCase().trim();
    
    // Detección básica de intenciones (en Fase 2 será con IA)
    if (this.isGreeting(msg)) return 'greeting';
    if (this.isAboutProducts(msg)) return 'product_inquiry';
    if (this.isAboutPrices(msg)) return 'price_inquiry';
    if (this.isAboutStock(msg)) return 'stock_inquiry';
    if (this.isAboutLocation(msg)) return 'location_inquiry';
    if (this.isAboutHours(msg)) return 'hours_inquiry';
    if (this.isAboutInsurance(msg)) return 'insurance_inquiry';
    if (this.isEmergency(msg)) return 'emergency';
    if (this.isFarewell(msg)) return 'farewell';
    
    return 'unknown';
  }

  async handleIntent(intent, message, context) {
    console.log(`🎯 Intención detectada: ${intent}`);
    
    switch (intent) {
      case 'greeting':
        return this.handleGreeting(context);
      
      case 'product_inquiry':
        return await this.handleProductInquiry(message, context);
      
      case 'price_inquiry':
        return await this.handlePriceInquiry(message, context);
      
      case 'stock_inquiry':
        return await this.handleStockInquiry(message, context);
      
      case 'location_inquiry':
        return this.handleLocationInquiry(context);
      
      case 'hours_inquiry':
        return this.handleHoursInquiry(context);
      
      case 'insurance_inquiry':
        return this.handleInsuranceInquiry(context);
      
      case 'emergency':
        return this.handleEmergency(context);
      
      case 'farewell':
        return this.handleFarewell(context);
      
      default:
        return this.handleUnknown(message, context);
    }
  }

  // ===== MANEJADORES DE INTENCIONES =====
  
  async handleProductInquiry(message, context) {
    const products = await this.dataManager.searchProducts(message);
    
    if (products.length === 0) {
      return `🔍 No encontré productos que coincidan con "${message}". ¿Podés ser más específico? Por ejemplo: "lentes de contacto", "armazones Ray-Ban", etc.`;
    }
    
    const limitedProducts = products.slice(0, 5); // Mostrar máximo 5
    
    let response = `🔍 Encontré ${products.length} productos relacionados:\n\n`;
    
    limitedProducts.forEach((product, index) => {
      response += `${index + 1}. ${product.brand ? product.brand + ' - ' : ''}${product.name}\n`;
      response += `   💰 $${product.price} | 📦 Stock: ${product.stock}\n`;
      if (product.tipo) response += `   📝 Tipo: ${product.tipo}\n`;
      response += `\n`;
    });
    
    if (products.length > 5) {
      response += `\n... y ${products.length - 5} productos más. ¿Buscás algo específico?`;
    } else {
      response += `¿Te interesa alguno de estos productos?`;
    }
    
    return response;
  }

  async handlePriceInquiry(message, context) {
    // Obtener productos y mostrar rangos de precios
    const armazones = await this.dataManager.getProducts('armazones', { inStock: true });
    const lentesContacto = await this.dataManager.getProducts('lentes_contacto', { inStock: true });
    
    const precioMinArmazones = Math.min(...armazones.map(p => p.price).filter(p => p > 0));
    const precioMaxArmazones = Math.max(...armazones.map(p => p.price));
    
    const precioMinLC = Math.min(...lentesContacto.map(p => p.price).filter(p => p > 0));
    const precioMaxLC = Math.max(...lentesContacto.map(p => p.price));
    
    return `💰 **Rangos de precios:**\n\n` +
           `👓 **Armazones:** $${precioMinArmazones} - $${precioMaxArmazones}\n` +
           `👁️ **Lentes de contacto:** $${precioMinLC} - $${precioMaxLC}\n\n` +
           `💡 *Los precios varían según marca, modelo y características.*\n` +
           `¿Te interesa algún producto en particular?`;
  }

  async handleStockInquiry(message, context) {
    const products = await this.dataManager.searchProducts(message);
    const inStockProducts = products.filter(p => p.stock > 0);
    const outOfStockProducts = products.filter(p => p.stock === 0);
    
    if (inStockProducts.length === 0) {
      return `❌ No tenemos stock de productos que coincidan con "${message}".\n\n` +
             `¿Querés que te avise cuando llegue stock o preferís ver otras opciones?`;
    }
    
    let response = `✅ **Productos disponibles:**\n\n`;
    
    inStockProducts.slice(0, 3).forEach((product, index) => {
      response += `${index + 1}. ${product.brand ? product.brand + ' - ' : ''}${product.name}\n`;
      response += `   📦 Stock: ${product.stock} | 💰 $${product.price}\n\n`;
    });
    
    if (outOfStockProducts.length > 0) {
      response += `⚠️ *${outOfStockProducts.length} productos relacionados están sin stock temporalmente.*\n\n`;
    }
    
    response += `¿Te interesa alguno de estos productos?`;
    
    return response;
  }

  handleGreeting(context) {
    const templates = [
      `¡Hola! Soy ${this.config.personality.name}, ${this.config.personality.expertise}. ¿En qué puedo ayudarte hoy?`,
      `¡Hola! Soy ${this.config.personality.name}. ¿Necesitás información sobre armazones, lentes de contacto o querés conocer nuestros horarios?`,
      `¡Bienvenido! Soy ${this.config.personality.name}. Contame, ¿qué te gustaría saber? Podés preguntarme por precios, stock, horarios o dirección.`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  handleLocationInquiry(context) {
    return `📍 **Estamos en:**\n\n` +
           `Serrano 684, Villa Crespo, CABA\n` +
           `🚇 A 4 cuadras del subte Ángel Gallardo (Línea B)\n\n` +
           `¿Querés que te comparta la ubicación en Google Maps?`;
  }

  handleHoursInquiry(context) {
    return `⏰ **Nuestros horarios:**\n\n` +
           `Lunes a Sábado: 10:30 - 19:30\n` +
           `Domingos: Cerrado\n\n` +
           `¿Te sirve algún día en particular?`;
  }

  handleInsuranceInquiry(context) {
    return `🏥 **Obras sociales que aceptamos:**\n\n` +
           `• Medicus\n` +
           `• Osetya\n` +
           `• Construir Salud\n` +
           `• Swiss Medical\n\n` +
           `¿Tenés alguna obra social en particular?`;
  }

  handleEmergency(context) {
    return `🩺 **Por tu seguridad:**\n\n` +
           `Recomiendo que contactes urgentemente con un especialista.\n\n` +
           `¿Necesitás que te derive con nuestro profesional o preferís que te pasemos los contactos de emergencia?`;
  }

  handleFarewell(context) {
    const farewells = [
      "¡Gracias por contactarte! Cualquier cosa, estoy acá para ayudarte. 👋",
      "¡Nos vemos! Recordá que estamos en Serrano 684 para lo que necesites. 😊",
      "¡Que tengas un excelente día! Cualquier consulta, volvé a escribirme. 👍"
    ];
    
    return farewells[Math.floor(Math.random() * farewells.length)];
  }

  handleUnknown(message, context) {
    return `🤔 No estoy segura de entender "${message}".\n\n` +
           `Podés preguntarme por:\n` +
           `• 👓 Armazones y modelos\n` +
           `• 👁️ Lentes de contacto\n` +
           `• 💰 Precios y promociones\n` +
           `• 📦 Stock disponible\n` +
           `• 🏥 Obras sociales\n` +
           `• ⏰ Horarios de atención\n` +
           `• 📍 Dirección y cómo llegar`;
  }

  getFallbackResponse(message, context) {
    return `⚠️ Estoy teniendo dificultades técnicas. Por favor, intentá nuevamente en unos momentos.\n\n` +
           `Mientras tanto, podés contactarnos al 1132774631 o visitarnos en Serrano 684.`;
  }

  // ===== DETECTORES DE INTENCIÓN =====
  
  isGreeting(message) {
    const greetings = ['hola', 'buenas', 'buen día', 'buenas tardes', 'hello', 'hi', 'qué tal', 'cómo andás'];
    return greetings.some(greet => message.includes(greet));
  }

  isAboutProducts(message) {
    const keywords = ['lente', 'armazon', 'contacto', 'lentilla', 'modelo', 'marca', 'producto', 'anteojo', 'gafa'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isAboutPrices(message) {
    const keywords = ['precio', 'cuesta', 'valor', 'cuanto', 'cuánto', '$', 'pesos'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isAboutStock(message) {
    const keywords = ['stock', 'disponible', 'queda', 'tienen'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isAboutLocation(message) {
    const keywords = ['direccion', 'ubicacion', 'dónde', 'donde', 'local', 'mapa', 'google maps'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isAboutHours(message) {
    const keywords = ['horario', 'hora', 'abren', 'cierran', 'atención', 'cuando'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isAboutInsurance(message) {
    const keywords = ['obra social', 'prepaga', 'cobertura', 'medicus', 'osetya', 'swiss', 'construir'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isEmergency(message) {
    const keywords = ['dolor', 'duele', 'molestia', 'urgencia', 'emergencia', 'no veo', 'veo mal'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isFarewell(message) {
    const keywords = ['chau', 'gracias', 'adiós', 'bye', 'nos vemos', 'hasta luego'];
    return keywords.some(keyword => message.includes(keyword));
  }
}

module.exports = BaseBot;
