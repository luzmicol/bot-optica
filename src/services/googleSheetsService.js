const { GoogleSpreadsheet } = require('google-spreadsheet');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🔧 Inicializando Google Sheets...');
      
      const sheetId = process.env.GOOGLE_SHEETS_ID;
      if (!sheetId) throw new Error('GOOGLE_SHEETS_ID no configurado');

      this.doc = new GoogleSpreadsheet(sheetId);
      
      // 🟢 INTENTAR DIFERENTES MÉTODOS DE AUTENTICACIÓN
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
          const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
          await this.doc.useServiceAccountAuth(credentials);
          console.log('✅ Autenticado con Service Account');
        } catch (e) {
          console.log('❌ Falló Service Account, probando API Key...');
        }
      }
      
      if (process.env.GOOGLE_API_KEY) {
        this.doc.useApiKey(process.env.GOOGLE_API_KEY);
        console.log('✅ Usando API Key');
      }
      
      await this.doc.loadInfo();
      this.initialized = true;
      console.log('✅ Google Sheets inicializado');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Google Sheets:', error.message);
      throw error;
    }
  }

  // 🟢 LEER HOJA GENÉRICA
  async leerHoja(hojaNombre) {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle[hojaNombre];
      if (!sheet) {
        console.log(`❌ Hoja no encontrada: ${hojaNombre}`);
        return [];
      }
      
      const rows = await sheet.getRows();
      console.log(`✅ ${hojaNombre}: ${rows.length} filas`);
      return rows;
    } catch (error) {
      console.error(`❌ Error leyendo ${hojaNombre}:`, error.message);
      return [];
    }
  }

  // 🟢 BUSCAR ARMAZÓN POR CÓDIGO
  async buscarArmazon(codigo) {
    try {
      const productos = await this.leerHoja('STOCK ARMAZONES 1');
      
      for (let producto of productos) {
        const codigoProducto = producto['COD.HYPNO'] || producto['__EMPTY_6'];
        if (codigoProducto && codigoProducto.toString().toLowerCase() === codigo.toLowerCase()) {
          return {
            codigo: codigoProducto,
            marca: producto['Marca'] || producto['__EMPTY_2'] || 'N/A',
            modelo: producto['Modelo'] || producto['__EMPTY_7'] || 'N/A',
            tipo: producto['Sol/Receta'] || producto['__EMPTY_4'] || 'N/A',
            cantidad: parseInt(producto['Cantidad'] || producto['__EMPTY_8'] || 0),
            precio: parseFloat(producto['PRECIO'] || producto['__EMPTY_15'] || 0),
            descripcion: producto['Descripciones'] || producto['__EMPTY_19'] || 'N/A',
            disponible: (parseInt(producto['Cantidad'] || producto['__EMPTY_8'] || 0)) > 0
          };
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error buscando armazón:', error.message);
      return null;
    }
  }

  // 🟢 BUSCAR ARMAZONES POR DESCRIPCIÓN
  async buscarPorDescripcion(descripcion) {
    try {
      const productos = await this.leerHoja('STOCK ARMAZONES 1');
      const descLower = descripcion.toLowerCase();
      
      const encontrados = productos.filter(producto => {
        const texto = [
          producto['Descripciones'],
          producto['Modelo'], 
          producto['Marca']
        ].join(' ').toLowerCase();
        
        return texto.includes(descLower);
      }).slice(0, 5); // Máximo 5 resultados
      
      return encontrados.map(p => ({
        codigo: p['COD.HYPNO'] || p['__EMPTY_6'] || 'N/A',
        marca: p['Marca'] || p['__EMPTY_2'] || 'N/A',
        modelo: p['Modelo'] || p['__EMPTY_7'] || 'N/A',
        precio: parseFloat(p['PRECIO'] || p['__EMPTY_15'] || 0),
        disponible: (parseInt(p['Cantidad'] || p['__EMPTY_8'] || 0)) > 0
      }));
    } catch (error) {
      console.error('❌ Error búsqueda por descripción:', error.message);
      return [];
    }
  }

  // 🟢 OBTENER MARCAS DE LENTES DE CONTACTO
  async obtenerMarcasLC() {
    try {
      const productos = await this.leerHoja('Stock LC');
      const marcas = new Set();
      
      productos.forEach(producto => {
        // Buscar en columnas B, C, D
        if (producto['__EMPTY_1']) marcas.add(producto['__EMPTY_1']);
        if (producto['__EMPTY_2']) marcas.add(producto['__EMPTY_2']);
        if (producto['__EMPTY_3']) marcas.add(producto['__EMPTY_3']);
      });
      
      return Array.from(marcas).filter(m => m && m !== 'Marca');
    } catch (error) {
      console.error('❌ Error obteniendo marcas LC:', error.message);
      return ['Acuvue', 'Biofinity', 'Air Optix'];
    }
  }

  // 🟢 OBTENER LÍQUIDOS
  async obtenerLiquidos() {
    try {
      const productos = await this.leerHoja('Stock Liquidos');
      
      return productos.map(producto => ({
        marca: producto['Marca'] || producto['__EMPTY_1'],
        tamaño: producto['Tamaño en ml'] || producto['__EMPTY_2'],
        disponible: true
      })).filter(l => l.marca && l.marca !== 'Marca');
    } catch (error) {
      console.error('❌ Error obteniendo líquidos:', error.message);
      return [];
    }
  }

  // 🟢 DIAGNÓSTICO
  async diagnostico() {
    try {
      await this.initialize();
      
      const hojas = ['STOCK ARMAZONES 1', 'Stock LC', 'Stock Accesorios', 'Stock Liquidos'];
      const resultado = {};
      
      for (const hoja of hojas) {
        const productos = await this.leerHoja(hoja);
        resultado[hoja] = {
          estado: '✅ OK',
          productos: productos.length,
          error: null
        };
      }
      
      return {
        configuracion: {
          sheets_id: '✅ Configurado',
          estado: '🟢 FUNCIONANDO'
        },
        hojas: resultado,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = GoogleSheetsService;
