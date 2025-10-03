const DataManager = require('./DataManager');
const ContextManager = require('./ContextManager');

class BaseBot {
  constructor(businessConfig) {
    this.config = businessConfig;
    this.dataManager = new DataManager();
    this.contextManager = new ContextManager();
    this.initialized = false;
    
    console.log('Inicializando bot para: ' + businessConfig.name);
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.dataManager.initialize();
      this.initialized = true;
      console.log('Bot ' + this.config.name + ' inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando bot ' + this.config.name + ':', error);
      throw error;
    }
  }

  async processMessage(userId, message) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('Procesando mensaje de ' + userId + ': "' + message + '"');
    
    const context = this.contextManager.getContext(userId);
    
    try {
      const intent = this.detectIntent(message, context);
      console.log('Intencion detectada: ' + intent);
      
      const response = await this.handleIntent(intent, message, context);
      
      this.contextManager.addToHistory(userId, message, response);
      this.contextManager.updateContext(userId, {
        currentIntent: intent,
        lastMessage: message,
        lastResponse: response
      });

      console.log('Respuesta generada: ' + response.substring(0, 100) + '...');
      
      return response;
      
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      return this.getFallbackResponse();
    }
  }

  detectIntent(message, context) {
    const msg = message.toLowerCase().trim();
    
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

  async handleProductInquiry(message, context) {
    const products = await this.dataManager.searchProducts(message);
    
    if (products.length === 0) {
      return 'No encontre productos que coincidan con "' + message + '". ¿Podes ser mas especifico?';
    }
    
    let response = 'Encontre ' + products.length + ' productos relacionados:\n\n';
    
    products.slice(0, 3).forEach((product, index) => {
      response += (index + 1) + '. ' + (product.brand ? product.brand + ' - ' : '') + product.name + '\n';
      response += '   Precio: $' + product.price + ' | Stock: ' + product.stock + '\n\n';
    });
    
    response += '¿Te interesa alguno de estos productos?';
    
    return response;
  }

  async handlePriceInquiry(message, context) {
    const armazones = await this.dataManager.getProducts('armazones', { inStock: true });
    const preciosArmazones = armazones.map(p => p.price).filter(p => p > 0);
    const minArmazones = preciosArmazones.length > 0 ? Math.min(...preciosArmazones) : 0;
    const maxArmazones = preciosArmazones.length > 0 ? Math.max(...preciosArmazones) : 0;
    
    return 'Rangos de precios:\n\n' +
           'Armazones: $' + minArmazones + ' - $' + maxArmazones + '\n\n' +
           'Los precios varian segun marca y modelo. ¿Te interesa algun producto en particular?';
  }

  async handleStockInquiry(message, context) {
    const products = await this.dataManager.searchProducts(message);
    const inStockProducts = products.filter(p => p.stock > 0);
    
    if (inStockProducts.length === 0) {
      return 'No tenemos stock de productos que coincidan con "' + message + '"';
    }
    
    let response = 'Productos disponibles:\n\n';
    
    inStockProducts.slice(0, 3).forEach((product, index) => {
      response += (index + 1) + '. ' + product.name + '\n';
      response += '   Stock: ' + product.stock + ' | Precio: $' + product.price + '\n\n';
    });
    
    response += '¿Te interesa alguno de estos productos?';
    
    return response;
  }

  handleGreeting(context) {
    const templates = [
      '¡Hola! Soy ' + this.config.personality.name + ', ' + this.config.personality.expertise + '. ¿En qué puedo ayudarte?',
      '¡Hola! Soy ' + this.config.personality.name + '. ¿Necesitas informacion sobre armazones, lentes de contacto o horarios?',
      '¡Bienvenido! Soy ' + this.config.personality.name + '. ¿Que te gustaria saber?'
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  handleLocationInquiry(context) {
    return 'Estamos en Serrano 684, Villa Crespo, CABA\n' +
           'A 4 cuadras del subte Angel Gallardo (Linea B)\n\n' +
           '¿Queres que te comparta la ubicacion en Google Maps?';
  }

  handleHoursInquiry(context) {
    return 'Nuestros horarios:\n\n' +
           'Lunes a Sabado: 10:30 - 19:30\n' +
           'Domingos: Cerrado\n\n' +
           '¿Te sirve algun dia en particular?';
  }

  handleInsuranceInquiry(context) {
    return 'Obras sociales que aceptamos:\n\n' +
           '• Medicus\n' +
           '• Osetya\n' +
           '• Construir Salud\n' +
           '• Swiss Medical\n\n' +
           '¿Tenes alguna obra social en particular?';
  }

  handleEmergency(context) {
    return 'Por tu seguridad, recomiendo que contactes urgentemente con un especialista.\n\n' +
           '¿Necesitas que te derive con nuestro profesional?';
  }

  handleFarewell(context) {
    const farewells = [
      '¡Gracias por contactarte! Cualquier cosa, estoy aca para ayudarte.',
      '¡Nos vemos! Recorda que estamos en Serrano 684 para lo que necesites.',
      '¡Que tengas un excelente dia! Cualquier consulta, volve a escribirme.'
    ];
    
    return farewells[Math.floor(Math.random() * farewells.length)];
  }

  handleUnknown(message, context) {
    return 'No estoy segura de entender "' + message + '".\n\n' +
           'Podes preguntarme por:\n' +
           '• Armazones y modelos\n' +
           '• Lentes de contacto\n' +
           '• Precios y promociones\n' +
           '• Stock disponible\n' +
           '• Obras sociales\n' +
           '• Horarios de atencion\n' +
           '• Direccion y ubicacion';
  }

  getFallbackResponse() {
    return 'Estoy teniendo dificultades tecnicas. Por favor, intenta nuevamente en unos momentos.\n\n' +
           'Mientras tanto, podes contactarnos al 1132774631.';
  }

  isGreeting(message) {
    const greetings = ['hola', 'buenas', 'buen dia', 'hello', 'hi', 'que tal'];
    return greetings.some(greet => message.includes(greet));
  }

  isAboutProducts(message) {
    const keywords = ['lente', 'armazon', 'contacto', 'modelo', 'marca', 'producto'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isAboutPrices(message) {
    const keywords = ['precio', 'cuesta', 'valor', 'cuanto', 'cuánto', '$'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isAboutStock(message) {
    const keywords = ['stock', 'disponible', 'queda', 'tienen'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isAboutLocation(message) {
    const keywords = ['direccion', 'ubicacion', 'donde', 'local', 'mapa'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isAboutHours(message) {
    const keywords = ['horario', 'hora', 'abren', 'cierran', 'atencion'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isAboutInsurance(message) {
    const keywords = ['obra social', 'prepaga', 'cobertura', 'medicus', 'osetya'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isEmergency(message) {
    const keywords = ['dolor', 'duele', 'molestia', 'urgencia', 'no veo'];
    return keywords.some(keyword => message.includes(keyword));
  }

  isFarewell(message) {
    const keywords = ['chau', 'gracias', 'adios', 'bye', 'nos vemos'];
    return keywords.some(keyword => message.includes(keyword));
  }
}

module.exports = BaseBot;
