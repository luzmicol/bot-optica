const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { config } = require('../config/environment');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized && this.doc) return;
    
    try {
      console.log('🔄 Inicializando Google Sheets...');
      
      // VERIFICAR CREDENCIALES
      if (!config.google.serviceAccount.client_email || !config.google.serviceAccount.private_key) {
        throw new Error('Credenciales de Google Sheets incompletas');
      }
      
      if (!config.google.sheets.principal) {
        throw new Error('ID de Google Sheet no configurado');
      }

      // INICIALIZAR CON JWT (método moderno)
      const serviceAccountAuth = new JWT({
        email: config.google.serviceAccount.client_email,
        key: config.google.serviceAccount.private_key.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.doc = new GoogleSpreadsheet(config.google.sheets.principal, serviceAccountAuth);
      
      console.log('📊 Cargando información del documento...');
      await this.doc.loadInfo();
      
      console.log(`✅ Google Sheets conectado: ${this.doc.title}`);
      this.initialized = true;
      
    } catch (error) {
      console.error('❌ ERROR CRÍTICO conectando Google Sheets:', error.message);
      throw error;
    }
  }

  async obtenerProductosDeSheet(sheetTitle) {
    try {
      await this.initialize();
      
      console.log(`📋 Buscando hoja: "${sheetTitle}"`);
      const sheet = this.doc.sheetsByTitle[sheetTitle];
      
      if (!sheet) {
        console.error(`❌ No se encontró la hoja: "${sheetTitle}"`);
        console.log(`📊 Hojas disponibles: ${Object.keys(this.doc.sheetsByTitle).join(', ')}`);
        return [];
      }
      
      console.log(`📥 Cargando datos de: ${sheet.title}`);
      await sheet.loadHeaderRow(3); // Cargar fila de encabezados
      const rows = await sheet.getRows();
      
      console.log(`📊 ${rows.length} filas encontradas en ${sheetTitle}`);
      
      const productos = rows.map((row, index) => {
        try {
          const codigo = row['COD. HYPNO'] || row['Código'] || row['CODIGO'] || '';
          const marca = row['Marca'] || row['MARCA'] || '';
          const modelo = row['Modelo'] || row['MODELO'] || '';
          const color = row['Color'] || row['COLOR'] || '';
          const cantidad = row['Cantidad'] || row['CANTIDAD'] || row['Stock'] || '0';
          const precio = row['PRECIO'] || row['Precio'] || row['$'] || '';
          const descripcion = row['Descripciones'] || row['Descripción'] || row['DESCRIPCION'] || '';
          
          // Convertir cantidad a número
          let stock = 0;
          if (cantidad && cantidad !== '0') {
            const numero = parseInt(cantidad.toString().replace(/[^\d]/g, ''));
            stock = isNaN(numero) ? 0 : numero;
          }
          
          // Solo incluir productos con datos válidos
          if (marca.trim() || modelo.trim() || codigo.trim()) {
            return {
              codigo: codigo.trim(),
              marca: marca.trim(),
              modelo: modelo.trim(),
              color: color.trim(),
              cantidad: stock,
              precio: precio.toString().trim(),
              descripcion: descripcion.trim(),
              categoria: sheetTitle,
              fila: index + 4 // +2 por header row +2 por index base
            };
          }
          return null;
        } catch (rowError) {
          console.error(`Error procesando fila ${index + 4}:`, rowError);
          return null;
        }
      }).filter(producto => producto !== null);
      
      console.log(`✅ ${productos.length} productos válidos de ${sheetTitle}`);
      return productos;
      
    } catch (error) {
      console.error(`❌ Error obteniendo productos de ${sheetTitle}:`, error.message);
      return [];
    }
  }

  async buscarPorCodigo(codigo) {
    if (!codigo || codigo.trim() === '') {
      console.log('❌ Código vacío recibido');
      return null;
    }
    
    try {
      console.log(`🔍 Buscando código: "${codigo}"`);
      
      const sheets = [
        config.google.sheets.armazones,
        config.google.sheets.accesorios, 
        config.google.sheets.lentesContacto,
        config.google.sheets.liquidos
      ].filter(Boolean);

      console.log(`📚 Buscando en hojas: ${sheets.join(', ')}`);
      
      for (const sheetTitle of sheets) {
        try {
          console.log(`🔎 Buscando en: ${sheetTitle}`);
          const productos = await this.obtenerProductosDeSheet(sheetTitle);
          const producto = productos.find(p => 
            p.codigo && p.codigo.toLowerCase() === codigo.toLowerCase().trim()
          );
          
          if (producto) {
            console.log(`✅ Producto encontrado: ${producto.codigo} en ${sheetTitle}`);
            return producto;
          }
        } catch (sheetError) {
          console.error(`Error buscando en ${sheetTitle}:`, sheetError.message);
          continue;
        }
      }
      
      console.log(`❌ Código no encontrado en ninguna hoja: ${codigo}`);
      return null;
      
    } catch (error) {
      console.error('❌ Error en búsqueda por código:', error.message);
      return null;
    }
  }

  // Método para diagnóstico
  async diagnosticar() {
    try {
      await this.initialize();
      console.log('🔍 DIAGNÓSTICO GOOGLE SHEETS:');
      console.log(`📄 Documento: ${this.doc.title}`);
      console.log(`📊 Hojas disponibles: ${Object.keys(this.doc.sheetsByTitle).join(', ')}`);
      
      const sheetsInfo = {};
      for (const [title, sheet] of Object.entries(this.doc.sheetsByTitle)) {
        await sheet.loadHeaderRow(3);
        const rows = await sheet.getRows();
        sheetsInfo[title] = {
          filas: rows.length,
          encabezados: sheet.headerValues || []
        };
      }
      
      return sheetsInfo;
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error.message);
      return { error: error.message };
    }
  }
}

module.exports = new GoogleSheetsService();
