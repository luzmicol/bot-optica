const { GoogleSpreadsheet } = require('google-spreadsheet');

class DataManager {
  constructor() {
    this.sheetsCache = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('📊 Inicializando DataManager...');
    
    try {
      // Inicializar todas las sheets configuradas
      const sheetsConfig = {
        armazones: process.env.SHEETS_ARMAZONES,
        lentes_contacto: process.env.SHEETS_LC,
        liquidos: process.env.SHEETS_LIQUIDOS
      };

      for (const [sheetType, sheetId] of Object.entries(sheetsConfig)) {
        if (sheetId) {
          await this.initSheet(sheetType, sheetId);
        }
      }
      
      this.initialized = true;
      console.log('✅ DataManager inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando DataManager:', error);
      throw error;
    }
  }

  async initSheet(sheetType, sheetId) {
    try {
      const doc = new GoogleSpreadsheet(sheetId);
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      
      await doc.useServiceAccountAuth(credentials);
      await doc.loadInfo();
      
      this.sheetsCache.set(sheetType, doc);
      console.log(`✅ Sheet "${sheetType}" cargado: ${doc.title}`);
      
    } catch (error) {
      console.error(`❌ Error cargando sheet ${sheetType}:`, error.message);
      throw error;
    }
  }

  async getProducts(sheetType, filters = {}) {
    try {
      const doc = this.sheetsCache.get(sheetType);
      if (!doc) {
        throw new Error(`Sheet no encontrado: ${sheetType}`);
      }

      const sheet = doc.sheetsByIndex[0];
      const rows = await sheet.getRows();
      
      console.log(`📈 Obtenidos ${rows.length} registros de ${sheetType}`);
      
      const products = rows.map(row => this.parseRowToProduct(row, sheetType));
      
      // Aplicar filtros si existen
      return this.applyFilters(products, filters);
      
    } catch (error) {
      console.error(`Error obteniendo productos de ${sheetType}:`, error);
      return [];
    }
  }

  parseRowToProduct(row, sheetType) {
    // Mapeo flexible para diferentes estructuras de sheets
    const baseProduct = {
      id: row.Codigo || row.ID || row.codigo || row.Id,
      name: row.Producto || row.Modelo || row.Nombre || row.producto,
      price: this.parsePrice(row.Precio || row.Valor || row.precio),
      stock: parseInt(row.Stock || row.Cantidad || row.stock || 0),
      brand: row.Marca || row.Fabricante || row.marca,
      category: sheetType,
      rawData: row._rawData // Mantener datos originales
    };

    // Campos específicos por tipo de producto
    if (sheetType === 'armazones') {
      baseProduct.material = row.Material || row.material;
      baseProduct.color = row.Color || row.color;
      baseProduct.model = row.Modelo || row.modelo;
    } else if (sheetType === 'lentes_contacto') {
      baseProduct.tipo = row.Tipo || row.tipo; // diario, mensual
      baseProduct.graduacion = row.Graduacion || row.graduacion;
      baseProduct.duracion = row.Duracion || row.duracion;
    } else if (sheetType === 'liquidos') {
      baseProduct.tamano = row.Tamaño || row.Tamano || row.tamaño;
      baseProduct.composicion = row.Composicion || row.composicion;
    }

    return baseProduct;
  }

  parsePrice(price) {
    if (!price) return 0;
    
    // Convertir string de precio a número
    const priceStr = price.toString().replace(/[^\d.,]/g, '');
    const priceNum = parseFloat(priceStr.replace(',', '.'));
    
    return isNaN(priceNum) ? 0 : priceNum;
  }

  applyFilters(products, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return products;
    }

    return products.filter(product => {
      if (filters.inStock && product.stock < 1) return false;
      if (filters.maxPrice && product.price > filters.maxPrice) return false;
      if (filters.brand && !product.brand?.toLowerCase().includes(filters.brand.toLowerCase())) return false;
      if (filters.category && product.category !== filters.category) return false;
      
      return true;
    });
  }

  async getStock(sheetType, productId) {
    const products = await this.getProducts(sheetType);
    const product = products.find(p => p.id === productId);
    return product ? product.stock : 0;
  }

  // Método para búsqueda semántica futura
  async searchProducts(query, sheetType = null) {
    const sheetTypes = sheetType ? [sheetType] : ['armazones', 'lentes_contacto', 'liquidos'];
    let allProducts = [];

    for (const type of sheetTypes) {
      const products = await this.getProducts(type);
      allProducts = allProducts.concat(products);
    }

    // Búsqueda básica por ahora (en Fase 2 será con embeddings)
    return allProducts.filter(product => 
      product.name?.toLowerCase().includes(query.toLowerCase()) ||
      product.brand?.toLowerCase().includes(query.toLowerCase()) ||
      product.category?.toLowerCase().includes(query.toLowerCase())
    );
  }
}

module.exports = DataManager;
