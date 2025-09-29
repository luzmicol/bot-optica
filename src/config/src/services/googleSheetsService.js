const { GoogleSpreadsheet } = require('google-spreadsheet');
const { config } = require('../config/environment');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
  }

  async initialize() {
    if (this.doc) return;
    
    try {
      this.doc = new GoogleSpreadsheet(config.google.sheets.principal);
      const credentials = config.google.serviceAccount;
      
      await this.doc.useServiceAccountAuth({
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      });
      
      await this.doc.loadInfo();
      console.log('✅ Google Sheets conectado correctamente');
    } catch (error) {
      console.error('❌ Error conectando con Google Sheets:', error);
      throw error;
    }
  }

  async obtenerProductosDeSheet(sheetTitle) {
    try {
      await this.initialize();
      const sheet = this.doc.sheetsByTitle[sheetTitle];
      
      if (!sheet) {
        console.error(`No se encontró la hoja: '${sheetTitle}'`);
        return [];
      }
      
      await sheet.loadHeaderRow(3);
      const rows = await sheet.getRows();
      
      const productos = rows.map((row) => {
        const codigo = row['COD. HYPNO'] || row['Código'] || '';
        const marca = row['Marca'] || '';
        const modelo = row['Modelo'] || '';
        const color = row['Color'] || '';
        const cantidad = row['Cantidad'] || '0';
        const precio = row['PRECIO'] || '';
        
        // SOLUCIÓN AL PROBLEMA DEL STOCK:
        let stock = 0;
        if (cantidad) {
          // Convierte "5 unidades", "5", "5 " a número
          const numero = parseInt(cantidad.toString().replace(/[^\d]/g, ''));
          stock = isNaN(numero) ? 0 : numero;
        }
        
        if (marca.trim() || modelo.trim()) {
          return {
            codigo: codigo.trim(),
            marca: marca.trim(),
            modelo: modelo.trim(),
            color: color.trim(),
            cantidad: stock, // ¡Ahora es un número!
            precio: precio.trim(),
            categoria: sheetTitle
          };
        }
        return null;
      }).filter(producto => producto !== null);
      
      console.log(`✅ ${productos.length} productos de ${sheetTitle} - Stock leído correctamente`);
      return productos;
    } catch (error) {
      console.error(`Error en ${sheetTitle}:`, error);
      return [];
    }
  }

  async buscarPorCodigo(codigo) {
    try {
      const sheets = [
        config.google.sheets.armazones,
        config.google.sheets.accesorios,
        config.google.sheets.lentesContacto,
        config.google.sheets.liquidos
      ].filter(Boolean);

      for (const sheetTitle of sheets) {
        const productos = await this.obtenerProductosDeSheet(sheetTitle);
        const producto = productos.find(p => 
          p.codigo && p.codigo.toLowerCase() === codigo.toLowerCase().trim()
        );
        
        if (producto) {
          console.log(`✅ Producto encontrado: ${producto.codigo} - Stock: ${producto.cantidad}`);
          return producto;
        }
      }
      
      console.log(`❌ Código no encontrado: ${codigo}`);
      return null;
    } catch (error) {
      console.error('Error buscando producto:', error);
      return null;
    }
  }
}

module.exports = new GoogleSheetsService();
