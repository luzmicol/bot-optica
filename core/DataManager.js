const { google } = require('googleapis');

class DataManager {
  constructor() {
    this.sheets = null;
    this.initialized = false;
    this.sheetsCache = new Map();
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('📊 Inicializando DataManager con Google Sheets API...');
    
    try {
      // Autenticación con Service Account
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.initialized = true;
      
      console.log('✅ DataManager inicializado correctamente con Google Sheets API');
      
    } catch (error) {
      console.error('❌ Error inicializando DataManager:', error);
      throw error;
    }
  }

  async getProducts(sheetType, filters = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const sheetId = this.getSheetId(sheetType);
      if (!sheetId) {
        throw new Error(`No sheet ID configurado para: ${sheetType}`);
      }

      // Leer datos del sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:Z', // Leer todas las columnas
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        console.log(`📭 Sheet ${sheetType} está vacío`);
        return [];
      }

      console.log(`📈 Obtenidos ${rows.length - 1} registros de ${sheetType}`);
      
      // Convertir filas a productos
      const headers = rows[0];
      const products = rows.slice(1).map((row, index) => 
        this.parseRowToProduct(row, headers, sheetType, index)
      );
      
      return this.applyFilters(products, filters);
      
    } catch (error) {
      console.error(`Error obteniendo productos de ${sheetType}:`, error.message);
      return [];
    }
  }

  getSheetId(sheetType) {
    const sheetIds = {
      armazones: process.env.SHEETS_ARMAZONES,
      lentes_contacto: process.env.SHEETS_LC,
      liquidos: process.env.SHEETS_LIQUIDOS
    };
    
    return sheetIds[sheetType];
  }

  parseRowToProduct(row, headers, sheetType, rowIndex) {
    const product = {
      id: this.getCellValue(row, headers, 'Codigo') || this.getCellValue(row, headers, 'ID') || `row-${rowIndex + 2}`,
      name: this.getCellValue(row, headers, 'Producto') || this.getCellValue(row, headers, 'Nombre') || this.getCellValue(row, headers, 'Modelo') || 'Sin nombre',
      price: this.parsePrice(this.getCellValue(row, headers, 'Precio') || this.getCellValue(row, headers, 'Valor')),
      stock: parseInt(this.getCellValue(row, headers, 'Stock') || this.getCellValue(row, headers, 'Cantidad') || 0),
      brand: this.getCellValue(row, headers, 'Marca') || this.getCellValue(row, headers, 'Fabricante'),
      category: sheetType,
      rowData: row
    };

    // Campos específicos por tipo
    if (sheetType === 'armazones') {
      product.material = this.getCellValue(row, headers, 'Material');
      product.color = this.getCellValue(row, headers, 'Color');
      product.model = this.getCellValue(row, headers, 'Modelo');
    } else if (sheetType === 'lentes_contacto') {
      product.tipo = this.getCellValue(row, headers, 'Tipo');
      product.graduacion = this.getCellValue(row, headers, 'Graduacion') || this.getCellValue(row, headers, 'Graduación');
      product.duracion = this.getCellValue(row, headers, 'Duracion') || this.getCellValue(row, headers, 'Duración');
    } else if (sheetType === 'liquidos') {
      product.tamano = this.getCellValue(row, headers, 'Tamaño') || this.getCellValue(row, headers, 'Tamano') || this.getCellValue(row, headers, 'Tamaño');
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
      if (filters.category && product.category !== filters.category) return false;
      
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
