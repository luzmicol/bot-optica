class DataManager {
  constructor() {
    this.initialized = false;
    this.useGoogleSheets = false;
    this.fallbackData = this.getFallbackData();
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('📊 Inicializando DataManager...');
    
    try {
      // Verificar si tenemos credenciales de Google Sheets
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON && 
          process.env.SHEETS_ARMAZONES) {
        
        const { google } = require('googleapis');
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: credentials.client_email,
            private_key: credentials.private_key,
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
        this.useGoogleSheets = true;
        console.log('✅ Conectado a Google Sheets API');
        
      } else {
        console.log('⚠️ Usando datos de fallback (sin Google Sheets)');
      }
      
      this.initialized = true;
      console.log('✅ DataManager inicializado correctamente');
      
    } catch (error) {
      console.log('⚠️ Error con Google Sheets, usando datos de fallback:', error.message);
      this.useGoogleSheets = false;
      this.initialized = true;
    }
  }

  async getProducts(sheetType, filters = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.useGoogleSheets) {
      try {
        return await this.getProductsFromSheets(sheetType, filters);
      } catch (error) {
        console.log(`⚠️ Fallback a datos locales para ${sheetType}:`, error.message);
        this.useGoogleSheets = false;
      }
    }

    // Datos de fallback
    return this.applyFilters(this.fallbackData[sheetType] || [], filters);
  }

  async getProductsFromSheets(sheetType, filters) {
    const sheetId = this.getSheetId(sheetType);
    if (!sheetId) {
      throw new Error(`No sheet ID para: ${sheetType}`);
    }

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:Z',
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return this.fallbackData[sheetType] || [];
    }

    const headers = rows[0];
    const products = rows.slice(1).map((row, index) => 
      this.parseRowToProduct(row, headers, sheetType, index)
    );
    
    return this.applyFilters(products, filters);
  }

  getSheetId(sheetType) {
    const sheetIds = {
      armazones: process.env.SHEETS_ARMAZONES,
      lentes_contacto: process.env.SHEETS_LC,
      liquidos: process.env.SHEETS_LIQUIDOS
    };
    
    return sheetIds[sheetType];
  }

  getFallbackData() {
    return {
      armazones: [
        { id: 'arm-001', name: 'Armazón Clásico', price: 55000, stock: 10, brand: 'Ray-Ban', category: 'armazones', material: 'Acetato', color: 'Negro' },
        { id: 'arm-002', name: 'Armazón Deportivo', price: 75000, stock: 5, brand: 'Oakley', category: 'armazones', material: 'Metal', color: 'Azul' },
        { id: 'arm-003', name: 'Armazón Elegante', price: 120000, stock: 3, brand: 'Vulk', category: 'armazones', material: 'Titanio', color: 'Plateado' }
      ],
      lentes_contacto: [
        { id: 'lc-001', name: 'Lentes Diarios', price: 15000, stock: 20, brand: 'Acuvue', category: 'lentes_contacto', tipo: 'diario', graduacion: 'Variada' },
        { id: 'lc-002', name: 'Lentes Mensuales', price: 25000, stock: 15, brand: 'Biofinity', category: 'lentes_contacto', tipo: 'mensual', graduacion: 'Variada' },
        { id: 'lc-003', name: 'Lentes Air Optix', price: 30000, stock: 8, brand: 'Air Optix', category: 'lentes_contacto', tipo: 'mensual', graduacion: 'Variada' }
      ],
      liquidos: [
        { id: 'liq-001', name: 'Solución Multiuso', price: 5000, stock: 30, brand: 'Renu', category: 'liquidos', tamano: '360ml', composicion: 'Multipropósito' },
        { id: 'liq-002', name: 'Gotas Humectantes', price: 3500, stock: 25, brand: 'Systane', category: 'liquidos', tamano: '15ml', composicion: 'Lubricante' }
      ]
    };
  }

  parseRowToProduct(row, headers, sheetType, rowIndex) {
    const product = {
      id: this.getCellValue(row, headers, 'Codigo') || this.getCellValue(row, headers, 'ID') || `row-${rowIndex + 2}`,
      name: this.getCellValue(row, headers, 'Producto') || this.getCellValue(row, headers, 'Nombre') || this.getCellValue(row, headers, 'Modelo') || 'Sin nombre',
      price: this.parsePrice(this.getCellValue(row, headers, 'Precio') || this.getCellValue(row, headers, 'Valor')),
      stock: parseInt(this.getCellValue(row, headers, 'Stock') || this.getCellValue(row, headers, 'Cantidad') || 0),
      brand: this.getCellValue(row, headers, 'Marca') || this.getCellValue(row, headers, 'Fabricante'),
      category: sheetType
    };

    if (sheetType === 'armazones') {
      product.material = this.getCellValue(row, headers, 'Material');
      product.color = this.getCellValue(row, headers, 'Color');
    } else if (sheetType === 'lentes_contacto') {
      product.tipo = this.getCellValue(row, headers, 'Tipo');
      product.graduacion = this.getCellValue(row, headers, 'Graduacion') || this.getCellValue(row, headers, 'Graduación');
    } else if (sheetType === 'liquidos') {
      product.tamano = this.getCellValue(row, headers, 'Tamaño') || this.getCellValue(row, headers, 'Tamano');
      product.composicion = this.getCellValue(row, headers, 'Composicion') || this.getCellValue(row, headers, 'Composición');
    }

    return product;
  }

  getCellValue(row, headers, columnName) {
    const index = headers.findIndex(header => 
      header && header.toString().toLowerCase().includes(columnName.toLowerCase())
    );
    
    return index >= 0 && row[index] ? row[index].toString().trim() : null;
  }

  parsePrice(price) {
    if (!price) return 0;
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
      if (filters.brand && product.brand && !product.brand.toLowerCase().includes(filters.brand.toLowerCase())) return false;
      return true;
    });
  }

  async searchProducts(query, sheetType = null) {
    const sheetTypes = sheetType ? [sheetType] : ['armazones', 'lentes_contacto', 'liquidos'];
    let allProducts = [];

    for (const type of sheetTypes) {
      const products = await this.getProducts(type);
      allProducts = allProducts.concat(products);
    }

    return allProducts.filter(product => 
      product.name && product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.brand && product.brand.toLowerCase().includes(query.toLowerCase()) ||
      product.category && product.category.toLowerCase().includes(query.toLowerCase())
    );
  }
}

module.exports = DataManager;
