const { GoogleSpreadsheet } = require('google-spreadsheet');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🔧 Inicializando Google Sheets con API Key...');
      
      const sheetId = process.env.GOOGLE_SHEETS_ID;
      const apiKey = process.env.GOOGLE_API_KEY;

      if (!sheetId) {
        throw new Error('GOOGLE_SHEETS_ID no configurado');
      }
      if (!apiKey) {
        throw new Error('GOOGLE_API_KEY no configurado');
      }

      this.doc = new GoogleSpreadsheet(sheetId);
      this.doc.useApiKey(apiKey);
      
      await this.doc.loadInfo();
      this.initialized = true;
      console.log('✅ Google Sheets inicializado con API Key');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Google Sheets:', error.message);
      throw error;
    }
  }

  // ... el resto de los métodos (obtenerProductosDeSheet, buscarPorCodigo, etc.) ...
}

module.exports = GoogleSheetsService;
