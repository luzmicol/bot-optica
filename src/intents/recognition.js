class IntentRecognizer {
  constructor() {
    this.saludos = [
      'hola', 'buenas', 'holis', 'hey', 'qué tal', 'cómo andás', 'cómo andan', 
      'buen día', 'buenas tardes', 'buenas noches', 'qué hacés', 'cómo va', 
      'saludos', 'ey', 'buenas', 'todo bien', 'holaaa'
    ];
    
    this.despedidas = [
      'chau', 'gracias', 'nos vemos', 'adiós', 'hasta luego', 'hasta pronto',
      'hasta mañana', 'hasta la próxima', 'cuidate', 'cuídense', 'un saludo',
      'suerte', 'que estés bien', 'que les vaya bien', 'abrazo', 'besos',
      'hablamos', 'chaooo'
    ];
    
    this.obrasSociales = ['medicus', 'osetya', 'construir salud', 'swiss medical', 'obra social', 'prepaga'];
    
    this.productos = [
      'lentes', 'anteojos', 'gafas', 'espejuelos', 'gafas de sol', 'lentes de sol',
      'lentes recetados', 'anteojos recetados', 'lentes de aumento', 'lentes graduados',
      'monturas', 'armazones', 'cristales', 'lentillas', 'lentes de contacto',
      'pupilentes', 'gafas ópticas', 'gafas de lectura', 'multifocales', 'bifocales',
      'progresivos', 'lentes para computadora', 'filtro azul', 'lentes de cerca', 'lentes de lejos'
    ];
  }

  detectIntent(mensaje) {
    const mensajeLower = mensaje.toLowerCase();
    
    // 1. Saludos
    if (this.saludos.some(s => mensajeLower.includes(s))) {
      return 'saludo';
    }
    
    // 2. Despedidas
    if (this.despedidas.some(d => mensajeLower.includes(d))) {
      return 'despedida';
    }
    
    // 3. Obras Sociales
    if (this.obrasSociales.some(os => mensajeLower.includes(os))) {
      return 'obra_social';
    }
    
    // 4. Consultas de stock por código
    if (mensajeLower.includes('#stock') || mensajeLower.startsWith('stock ')) {
      return 'stock_codigo';
    }
    
    // 5. Búsqueda de productos
    if (this.productos.some(p => mensajeLower.includes(p)) || 
        mensajeLower.includes('busco') || 
        mensajeLower.includes('quiero') || 
        mensajeLower.includes('tene')) {
      return 'busqueda_producto';
    }
    
    // 6. Precios
    if (mensajeLower.includes('precio') || mensajeLower.includes('cuesta') || mensajeLower.includes('cuanto sale')) {
      return 'precios';
    }
    
    // 7. Horarios
    if (mensajeLower.includes('horario') || mensajeLower.includes('hora') || mensajeLower.includes('cuando abren')) {
      return 'horarios';
    }
    
    // 8. Ubicación
    if (mensajeLower.includes('direccion') || mensajeLower.includes('ubicacion') || mensajeLower.includes('donde estan')) {
      return 'ubicacion';
    }
    
    // 9. Lentes de contacto
    if (mensajeLower.includes('lente de contacto') || mensajeLower.includes('lentes de contacto') || 
        mensajeLower.includes('lentilla') || mensajeLower.includes('contacto')) {
      return 'lentes_contacto';
    }
    
    // 10. Líquidos
    if (mensajeLower.includes('líquido') || mensajeLower.includes('liquido') || 
        mensajeLower.includes('solución') || mensajeLower.includes('solucion')) {
      return 'liquidos';
    }
    
    // 11. Marcas
    if (mensajeLower.includes('marca')) {
      return 'marcas';
    }
    
    return 'desconocido';
  }

  extractCodigo(mensaje) {
    const match = mensaje.match(/#stock\s+(\S+)/i) || mensaje.match(/stock\s+(\S+)/i);
    return match ? match[1] : null;
  }

  extractObraSocial(mensaje) {
    for (const os of this.obrasSociales) {
      if (mensaje.toLowerCase().includes(os)) {
        return os;
      }
    }
    return null;
  }
}

module.exports = IntentRecognizer;
