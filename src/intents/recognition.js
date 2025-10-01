// src/intents/recognition.js

const optica = require('../config/optica');

class IntentRecognizer {
  static detectIntent(message) {
    const messageLower = message.toLowerCase();

    // Saludos
    if (this.isGreeting(messageLower)) return 'greeting';

    // Despedidas
    if (this.isFarewell(messageLower)) return 'farewell';

    // Obras sociales
    if (this.isHealthInsurance(messageLower)) return 'health_insurance';

    // Precios
    if (this.isPriceQuery(messageLower)) return 'price_query';

    // Marcas
    if (this.isBrandQuery(messageLower)) return 'brand_query';

    // Stock por código
    if (this.isStockCodeQuery(messageLower)) return 'stock_code_query';

    // Búsqueda por descripción
    if (this.isStockSearchQuery(messageLower)) return 'stock_search_query';

    // Lentes de contacto
    if (this.isContactLensQuery(messageLower)) return 'contact_lens_query';

    // Líquidos
    if (this.isLiquidQuery(messageLower)) return 'liquid_query';

    // Horarios
    if (this.isScheduleQuery(messageLower)) return 'schedule_query';

    // Ubicación
    if (this.isLocationQuery(messageLower)) return 'location_query';

    // Envíos
    if (this.isShippingQuery(messageLower)) return 'shipping_query';

    // Financiación
    if (this.isFinancingQuery(messageLower)) return 'financing_query';

    // Consultas frecuentes
    if (this.isFrequentQuestion(messageLower)) return 'frequent_question';

    // Si no se reconoce, se considera una consulta general
    return 'general_query';
  }

  static isGreeting(message) {
    return optica.saludos.comunes.some(saludo => message.includes(saludo));
  }

  static isFarewell(message) {
    return optica.saludos.despedidas.some(despedida => message.includes(despedida));
  }

  static isHealthInsurance(message) {
    return optica.obrasSociales.aceptadas.some(os => message.includes(os.toLowerCase())) || 
           message.includes('obra social') || 
           message.includes('prepaga');
  }

  static isPriceQuery(message) {
    const priceWords = ['precio', 'cuesta', 'cuánto sale', 'valor', 'costo'];
    return priceWords.some(word => message.includes(word));
  }

  static isBrandQuery(message) {
    const brandWords = ['marca', 'marcas', 'trabajan con', 'qué marcas'];
    return brandWords.some(word => message.includes(word));
  }

  static isStockCodeQuery(message) {
    return message.startsWith('#stock') || message.startsWith('stock');
  }

  static isStockSearchQuery(message) {
    const searchWords = ['busco', 'quiero', 'tienen', 'disponible', 'modelo', 'armazón', 'anteojo'];
    return searchWords.some(word => message.includes(word)) && 
           (message.includes('lente') || message.includes('anteojo') || message.includes('armazón'));
  }

  static isContactLensQuery(message) {
    const contactWords = ['lente de contacto', 'lentes de contacto', 'lentilla', 'pupilente'];
    return contactWords.some(word => message.includes(word));
  }

  static isLiquidQuery(message) {
    const liquidWords = ['líquido', 'liquido', 'solución', 'solucion'];
    return liquidWords.some(word => message.includes(word));
  }

  static isScheduleQuery(message) {
    const scheduleWords = ['horario', 'hora', 'cuándo abren', 'cuándo cierran'];
    return scheduleWords.some(word => message.includes(word));
  }

  static isLocationQuery(message) {
    const locationWords = ['dirección', 'direccion', 'ubicación', 'ubicacion', 'dónde están', 'donde estan'];
    return locationWords.some(word => message.includes(word));
  }

  static isShippingQuery(message) {
    const shippingWords = ['envío', 'envio', 'domicilio', 'enviar', 'mandar'];
    return shippingWords.some(word => message.includes(word));
  }

  static isFinancingQuery(message) {
    const financingWords = ['cuota', 'financiación', 'financiacion', 'tarjeta', 'crédito', 'credito'];
    return financingWords.some(word => message.includes(word));
  }

  static isFrequentQuestion(message) {
    const frequentWords = ['qué', 'que', 'cómo', 'como', 'cuándo', 'cuando', 'dónde', 'donde', 'por qué', 'porque'];
    return frequentWords.some(word => message.includes(word)) && 
           (message.includes('?') || message.includes('¿'));
  }
}

module.exports = IntentRecognizer;
