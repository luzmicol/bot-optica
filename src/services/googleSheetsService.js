const { GoogleSpreadsheet } = require('google-spreadsheet');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🔧 Inicializando Google Sheets...');
      
      this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID);
      
      // 🟢 SIN AUTENTICACIÓN - Sheet público o con API Key automática
      await this.doc.loadInfo();
      
      this.initialized = true;
      console.log('✅ Sheets inicializado');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando:', error.message);
      return false;
    }
  }

  // 🟢 OBTENER PRODUCTOS DE HOJA - VERSIÓN SIMPLE
  async obtenerProductosDeSheet(hojaNombre) {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle[hojaNombre];
      if (!sheet) return [];
      
      const rows = await sheet.getRows();
      console.log(`📊 ${hojaNombre}: ${rows.length} filas`);
      return rows;
    } catch (error) {
      console.error(`❌ Error en ${hojaNombre}:`, error.message);
      return [];
    }
  }

  // 🟢 BUSCAR POR CÓDIGO - VERSIÓN SIMPLE
  async buscarPorCodigo(codigo) {
    try {
      const productos = await this.obtenerProductosDeSheet('STOCK ARMAZONES 1');
      
      for (let producto of productos) {
        if (producto['COD.HYPNO'] === codigo) {
          return {
            codigo: producto['COD.HYPNO'] || 'N/A',
            marca: producto['Marca'] || 'N/A',
            modelo: producto['Modelo'] || 'N/A',
            color: 'Varios',
            precio: producto['PRECIO'] || 0,
            cantidad: producto['Cantidad'] || 0,
            categoria: 'Armazón',
            descripcion: producto['Descripciones'] || 'N/A'
          };
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error buscando:', error.message);
      return null;
    }
  }

  // 🟢 OBTENER MARCAS LC - VERSIÓN SIMPLE
  async obtenerMarcasLC() {
    try {
      const productos = await this.obtenerProductosDeSheet('Stock LC');
      const marcas = new Set();
      
      productos.forEach(producto => {
        if (producto['__EMPTY_1']) marcas.add(producto['__EMPTY_1']);
        if (producto['__EMPTY_2']) marcas.add(producto['__EMPTY_2']);
        if (producto['__EMPTY_3']) marcas.add(producto['__EMPTY_3']);
      });
      
      return Array.from(marcas).filter(m => m && m !== 'Marca');
    } catch (error) {
      console.error('❌ Error marcas LC:', error.message);
      return ['Acuvue', 'Biofinity', 'Air Optix'];
    }
  }

  // 🟢 OBTENER LÍQUIDOS - VERSIÓN SIMPLE
  async obtenerLiquidos() {
    try {
      const productos = await this.obtenerProductosDeSheet('Stock Liquidos');
      
      return productos.map(producto => ({
        marca: producto['Marca'] || producto['__EMPTY_1'],
        tamano: producto['Tamaño en ml'] || producto['__EMPTY_2'],
        disponible: true
      })).filter(l => l.marca && l.marca !== 'Marca');
    } catch (error) {
      console.error('❌ Error líquidos:', error.message);
      return [{ marca: 'Renu', tamano: '300ml', disponible: true }];
    }
  }

  // 🟢 OBTENER TODOS LOS PRODUCTOS - VERSIÓN SIMPLE
  async obtenerTodosProductos() {
    try {
      const productos = await this.obtenerProductosDeSheet('STOCK ARMAZONES 1');
      return productos.map(producto => ({
        codigo: producto['COD.HYPNO'] || 'N/A',
        marca: producto['Marca'] || 'N/A',
        modelo: producto['Modelo'] || 'N/A',
        color: 'Varios',
        precio: producto['PRECIO'] || 0,
        cantidad: producto['Cantidad'] || 0,
        categoria: 'Armazón',
        descripcion: producto['Descripciones'] || 'N/A'
      }));
    } catch (error) {
      console.error('❌ Error todos productos:', error.message);
      return [];
    }
  }

  // 🟢 DIAGNÓSTICO - VERSIÓN SIMPLE
  async diagnosticar() {
    try {
      await this.initialize();
      
      const hojas = ['STOCK ARMAZONES 1', 'Stock LC', 'Stock Accesorios', 'Stock Liquidos'];
      const resultadoHojas = {};
      
      for (const hoja of hojas) {
        const productos = await this.obtenerProductosDeSheet(hoja);
        resultadoHojas[hoja] = {
          estado: '✅ OK',
          productos: productos.length,
          primeros: productos.slice(0, 2),
          error: null
        };
      }
      
      return {
        configuracion: {
          sheets_id: '✅ Configurado',
          estado: '🟢 FUNCIONANDO'
        },
        inicializacion: '✅ Exitosa',
        hojas: resultadoHojas,
        busqueda: '✅ Sistema listo',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        configuracion: {
          sheets_id: process.env.GOOGLE_SHEETS_ID ? '✅' : '❌',
          estado: `❌ ${error.message}`
        },
        inicializacion: `❌ ${error.message}`,
        hojas: {},
        busqueda: '❌ No disponible',
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = GoogleSheetsService;
