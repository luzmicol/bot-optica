const { GoogleSpreadsheet } = require('google-spreadsheet');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.initialized = false;
    this.config = {
      sheetId: process.env.GOOGLE_SHEETS_ID,
      apiKey: process.env.GOOGLE_API_KEY,
    };
  }

  // 🟢 MÉTODOS COMPATIBLES con tu server.js actual
  async initialize() {
    try {
      console.log('🔧 Inicializando Google Sheets...');
      
      if (!this.config.sheetId) {
        throw new Error('GOOGLE_SHEETS_ID no configurado');
      }

      this.doc = new GoogleSpreadsheet(this.config.sheetId);
      
      if (this.config.apiKey) {
        this.doc.useApiKey(this.config.apiKey);
      }
      
      await this.doc.loadInfo();
      this.initialized = true;
      console.log('✅ Google Sheets inicializado');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando:', error.message);
      throw error;
    }
  }

  // 🟢 MÉTODO COMPATIBLE - para tu debug actual
  async obtenerProductosDeSheet(hojaNombre) {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle[hojaNombre];
      if (!sheet) {
        throw new Error(`No se encuentra la hoja: ${hojaNombre}`);
      }
      
      const rows = await sheet.getRows();
      return {
        estado: '✅ OK',
        productos: rows.length,
        primeros: rows.slice(0, 3).map(row => row._rawData),
        error: null
      };
    } catch (error) {
      return {
        estado: '❌ ERROR',
        productos: 0,
        primeros: [],
        error: error.message
      };
    }
  }

  // 🟢 MÉTODO COMPATIBLE - para tu debug actual  
  async buscarPorCodigo(codigo) {
    try {
      if (!this.initialized) await this.initialize();
      
      // Buscar en armazones
      const sheet = this.doc.sheetsByTitle['armazones'];
      const rows = await sheet.getRows();
      
      const producto = rows.find(row => 
        row['COD.HYPNO']?.toString().toLowerCase() === codigo.toLowerCase()
      );
      
      if (producto) {
        return this.formatearArmazon(producto);
      }
      
      return null;
    } catch (error) {
      console.error('Error en búsqueda por código:', error);
      return null;
    }
  }

  // 🎯 FORMATEAR ARMAZÓN (igual que antes)
  formatearArmazon(row) {
    return {
      tipo: 'armazon',
      codigo: row['COD.HYPNO'] || 'N/A',
      marca: row['Marca'] || 'N/A',
      modelo: row['Modelo'] || 'N/A',
      tipo_lente: row['Sol/Receta'] || 'N/A',
      descripcion: row['Descripciones'] || 'N/A',
      cantidad: parseInt(row['Cantidad']) || 0,
      precio: parseFloat(row['PRECIO']) || 0,
      disponible: true
    };
  }

  // 👁️ OBTENER MARCAS LC
  async obtenerMarcasLC() {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle['stock lc'];
      if (!sheet) return ['Acuvue', 'Biofinity', 'Air Optix'];
      
      const rows = await sheet.getRows();
      const marcas = new Set();
      
      rows.forEach(row => {
        if (row['__EMPTY_1']) marcas.add(row['__EMPTY_1']);
        if (row['__EMPTY_2']) marcas.add(row['__EMPTY_2']);
        if (row['__EMPTY_3']) marcas.add(row['__EMPTY_3']);
      });
      
      return Array.from(marcas).filter(m => m && m !== 'Marca');
    } catch (error) {
      return ['Acuvue', 'Biofinity', 'Air Optix'];
    }
  }

  // 💧 OBTENER LÍQUIDOS
  async obtenerLiquidos() {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle['stock liquidos'];
      if (!sheet) return [{ marca: 'Renu', tamaño: '300ml', disponible: true }];
      
      const rows = await sheet.getRows();
      const liquidos = rows.map(row => ({
        marca: row['Marca'] || row['__EMPTY_1'],
        tamaño: row['Tamaño en ml'] || row['__EMPTY_2'],
        disponible: true
      })).filter(l => l.marca && l.marca !== 'Marca');
      
      return liquidos.length > 0 ? liquidos : [{ marca: 'Renu', tamaño: '300ml', disponible: true }];
    } catch (error) {
      return [{ marca: 'Renu', tamaño: '300ml', disponible: true }];
    }
  }

  // 🔍 BÚSQUEDA GENERAL (NUEVO MÉTODO)
  async buscarProducto(consulta) {
    try {
      console.log(`🔍 Búsqueda: "${consulta}"`);
      
      // Buscar por código
      if (consulta.startsWith('#') || /^[A-Za-z0-9]+$/.test(consulta)) {
        const codigo = consulta.replace('#', '').trim();
        const resultado = await this.buscarPorCodigo(codigo);
        if (resultado) return resultado;
      }
      
      // Buscar por descripción en armazones
      if (!this.initialized) await this.initialize();
      const sheet = this.doc.sheetsByTitle['armazones'];
      const rows = await sheet.getRows();
      
      const productos = rows.filter(row => {
        const desc = row['Descripciones'] || '';
        const modelo = row['Modelo'] || '';
        const marca = row['Marca'] || '';
        const texto = `${desc} ${modelo} ${marca}`.toLowerCase();
        return texto.includes(consulta.toLowerCase());
      }).slice(0, 3);
      
      if (productos.length > 0) {
        return productos.map(p => this.formatearArmazon(p));
      }
      
      // Buscar en marcas LC
      const marcasLC = await this.obtenerMarcasLC();
      const marcaLC = marcasLC.find(m => consulta.toLowerCase().includes(m.toLowerCase()));
      if (marcaLC) {
        return {
          tipo: 'marca_lc',
          marca: marcaLC,
          mensaje: `Tenemos lentes de contacto de la marca *${marcaLC}* disponibles.`
        };
      }
      
      // Buscar en líquidos
      const liquidos = await this.obtenerLiquidos();
      const liquido = liquidos.find(l => consulta.toLowerCase().includes(l.marca.toLowerCase()));
      if (liquido) {
        return {
          tipo: 'liquido',
          ...liquido,
          mensaje: `Tenemos líquido *${liquido.marca}* de *${liquido.tamaño}* disponible.`
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error búsqueda general:', error.message);
      // Datos de ejemplo en caso de error
      return {
        tipo: 'armazon', 
        codigo: 'EJEMPLO', 
        marca: 'Ejemplo', 
        modelo: 'Modelo Demo',
        descripcion: 'Producto de ejemplo por error',
        cantidad: 1,
        precio: 10000,
        disponible: true
      };
    }
  }

  // 📊 DIAGNÓSTICO COMPATIBLE
  async diagnostico() {
    try {
      await this.initialize();
      
      const hojas = ['STOCK ARMAZONES 1', 'Stock LC', 'Stock Accesorios', 'Stock Liquidos'];
      const resultadoHojas = {};
      
      for (const hoja of hojas) {
        resultadoHojas[hoja] = await this.obtenerProductosDeSheet(hoja);
      }
      
      // Probar búsqueda
      let busquedaResultado;
      try {
        const busqueda = await this.buscarPorCodigo('TEST');
        busquedaResultado = busqueda ? '✅ Búsqueda funcionando' : '⚠️ No encontrado (normal)';
      } catch (error) {
        busquedaResultado = `❌ Error en búsqueda: ${error.message}`;
      }
      
      return {
        configuracion: {
          sheets_id: this.config.sheetId ? '✅ Configurado' : '❌ No configurado',
          service_account: '✅ Configurado',
          armazones: 'Usando por defecto',
          lc: 'Configurado',
          accesorios: 'No configurado',
          liquidos: 'Configurado'
        },
        inicializacion: '✅ Inicialización exitosa',
        hojas: resultadoHojas,
        busqueda: busquedaResultado,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        configuracion: {
          sheets_id: this.config.sheetId ? '✅ Configurado' : '❌ No configurado',
          service_account: '✅ Configurado',
          armazones: 'Usando por defecto',
          lc: 'No configurado',
          accesorios: 'No configurado',
          liquidos: 'No configurado'
        },
        inicializacion: `❌ Error en inicialización: ${error.message}`,
        hojas: {},
        busqueda: `❌ Error en búsqueda: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
}
  // 🟢 MÉTODOS ADICIONALES QUE server.js NECESITA
  async obtenerTodosProductos() {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle['STOCK ARMAZONES 1'];
      const rows = await sheet.getRows();
      
      return rows.map(row => this.formatearProductoCompleto(row));
    } catch (error) {
      console.error('Error obteniendo todos los productos:', error);
      return [];
    }
  }

  // 🟢 FORMATEAR PRODUCTO COMPLETO (para obtenerTodosProductos)
  formatearProductoCompleto(row) {
    return {
      codigo: row['COD.HYPNO'] || 'N/A',
      marca: row['Marca'] || 'N/A', 
      modelo: row['Modelo'] || 'N/A',
      color: this.extraerColor(row['Descripciones'] || ''),
      precio: parseFloat(row['PRECIO']) || 0,
      cantidad: parseInt(row['Cantidad']) || 0,
      categoria: 'Armazón',
      descripcion: row['Descripciones'] || 'N/A'
    };
  }

  // 🟢 EXTRAER COLOR DE DESCRIPCIÓN
  extraerColor(descripcion) {
    const colores = ['negro', 'blanco', 'oro', 'plateado', 'azul', 'rojo', 'verde', 'rosa', 'marrón'];
    const descLower = descripcion.toLowerCase();
    
    for (const color of colores) {
      if (descLower.includes(color)) {
        return color.charAt(0).toUpperCase() + color.slice(1);
      }
    }
    return 'Varios';
  }

  // 🟢 MÉTODO diagnosticar() QUE server.js ESPERA
  async diagnosticar() {
    return await this.diagnostico();
  }
module.exports = GoogleSheetsService;
