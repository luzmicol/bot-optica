// src/services/googleSheetsService.js

const { GoogleSpreadsheet } = require('google-spreadsheet');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const sheetId = process.env.GOOGLE_SHEETS_ID;
      const apiKey = process.env.GOOGLE_API_KEY;

      if (!sheetId || !apiKey) {
        throw new Error('Faltan credenciales de Google Sheets');
      }

      this.doc = new GoogleSpreadsheet(sheetId);
      this.doc.useApiKey(apiKey);

      await this.doc.loadInfo();
      this.initialized = true;
      console.log('✅ Google Sheets inicializado');
    } catch (error) {
      console.error('❌ Error inicializando Google Sheets:', error.message);
      throw error;
    }
  }

  async obtenerProductosDeSheet(hojaNombre) {
    try {
      if (!this.initialized) await this.initialize();

      const sheet = this.doc.sheetsByTitle[hojaNombre];
      if (!sheet) {
        console.log(`No se encontró la hoja: ${hojaNombre}`);
        return [];
      }

      const rows = await sheet.getRows();
      return rows;
    } catch (error) {
      console.error(`Error obteniendo productos de ${hojaNombre}:`, error.message);
      return [];
    }
  }

  async buscarPorCodigo(codigo) {
    try {
      const productos = await this.obtenerProductosDeSheet('STOCK ARMAZONES 1');
      
      const producto = productos.find(row => row['COD.HYPNO'] === codigo);
      if (producto) {
        return {
          codigo: producto['COD.HYPNO'] || 'N/A',
          marca: producto['Marca'] || 'N/A',
          modelo: producto['Modelo'] || 'N/A',
          tipo_lente: producto['Sol/Receta'] || 'N/A',
          descripcion: producto['Descripciones'] || 'N/A',
          cantidad: parseInt(producto['Cantidad']) || 0,
          precio: parseFloat(producto['PRECIO']) || 0,
          disponible: (parseInt(producto['Cantidad']) || 0) > 0
        };
      }
      return null;
    } catch (error) {
      console.error('Error en buscarPorCodigo:', error.message);
      return null;
    }
  }

  async obtenerMarcasLC() {
    try {
      const productos = await this.obtenerProductosDeSheet('Stock LC');
      const marcas = new Set();

      productos.forEach(row => {
        // Las marcas están en las columnas B, C, D (__EMPTY_1, __EMPTY_2, __EMPTY_3)
        if (row['__EMPTY_1']) marcas.add(row['__EMPTY_1']);
        if (row['__EMPTY_2']) marcas.add(row['__EMPTY_2']);
        if (row['__EMPTY_3']) marcas.add(row['__EMPTY_3']);
      });

      return Array.from(marcas).filter(marca => marca && marca.trim() !== '');
    } catch (error) {
      console.error('Error obteniendo marcas LC:', error.message);
      return [];
    }
  }

  async obtenerLiquidos() {
    try {
      const productos = await this.obtenerProductosDeSheet('Stock Liquidos');
      const liquidos = [];

      productos.forEach(row => {
        if (row['Marca'] && row['Tamaño en ml']) {
          liquidos.push({
            marca: row['Marca'],
            tamaño: row['Tamaño en ml'],
            disponible: true
          });
        }
      });

      return liquidos;
    } catch (error) {
      console.error('Error obteniendo líquidos:', error.message);
      return [];
    }
  }

  async obtenerTodosProductos() {
    try {
      const productos = await this.obtenerProductosDeSheet('STOCK ARMAZONES 1');
      return productos.map(row => ({
        codigo: row['COD.HYPNO'] || 'N/A',
        marca: row['Marca'] || 'N/A',
        modelo: row['Modelo'] || 'N/A',
        tipo_lente: row['Sol/Receta'] || 'N/A',
        descripcion: row['Descripciones'] || 'N/A',
        cantidad: parseInt(row['Cantidad']) || 0,
        precio: parseFloat(row['PRECIO']) || 0,
        disponible: (parseInt(row['Cantidad']) || 0) > 0
      }));
    } catch (error) {
      console.error('Error obteniendo todos los productos:', error.message);
      return [];
    }
  }
}

module.exports = GoogleSheetsService;
