const { GoogleSpreadsheet } = require('google-spreadsheet');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.initialized = false;
    this.usingRealData = false;
  }

  async initialize() {
    try {
      console.log('🔧 INICIANDO CONEXIÓN A GOOGLE SHEETS REAL...');
      
      const sheetId = process.env.GOOGLE_SHEETS_ID;
      if (!sheetId) {
        throw new Error('GOOGLE_SHEETS_ID no configurado');
      }

      this.doc = new GoogleSpreadsheet(sheetId);
      
      // 🟢 USAR SERVICE ACCOUNT PARA DATOS REALES
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
          console.log('🔑 Autenticando con Service Account...');
          const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
          await this.doc.useServiceAccountAuth(credentials);
          console.log('✅ Service Account autenticado');
        } catch (authError) {
          console.error('❌ Error Service Account:', authError.message);
          throw new Error('No se pudo autenticar con Google Sheets');
        }
      } else {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurado');
      }
      
      await this.doc.loadInfo();
      this.initialized = true;
      this.usingRealData = true;
      console.log('✅ CONECTADO A GOOGLE SHEETS - DATOS REALES');
      console.log('📊 Hojas disponibles:', Object.keys(this.doc.sheetsByTitle));
      return true;
    } catch (error) {
      console.error('❌ ERROR CRÍTICO:', error.message);
      this.usingRealData = false;
      throw error; // 🚨 Lanzar error para saber que falló
    }
  }

  // 🟢 OBTENER PRODUCTOS DE HOJA REAL
  async obtenerProductosDeSheet(hojaNombre) {
    try {
      if (!this.initialized) await this.initialize();
      
      console.log(`📊 Leyendo hoja real: ${hojaNombre}`);
      const sheet = this.doc.sheetsByTitle[hojaNombre];
      
      if (!sheet) {
        console.log(`❌ Hoja no encontrada: ${hojaNombre}`);
        return [];
      }
      
      const rows = await sheet.getRows();
      console.log(`✅ ${hojaNombre}: ${rows.length} filas reales encontradas`);
      
      // 🎯 DEBUG: Mostrar primeras filas
      if (rows.length > 0) {
        console.log('🔍 Primeras filas:', rows.slice(0, 2).map(row => row._rawData));
      }
      
      return rows;
    } catch (error) {
      console.error(`❌ Error leyendo ${hojaNombre}:`, error.message);
      return [];
    }
  }

  // 🟢 BUSCAR POR CÓDIGO EN DATOS REALES
  async buscarPorCodigo(codigo) {
    try {
      console.log(`🔍 Buscando código REAL: ${codigo}`);
      
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle['STOCK ARMAZONES 1'];
      if (!sheet) {
        throw new Error('No se encuentra hoja de armazones');
      }
      
      const rows = await sheet.getRows();
      console.log(`📦 Buscando en ${rows.length} productos reales...`);
      
      // Buscar en diferentes columnas posibles
      const producto = rows.find(row => {
        const codigoHypno = row['COD.HYPNO'] || row['__EMPTY_6'];
        return codigoHypno?.toString().toLowerCase() === codigo.toLowerCase();
      });
      
      if (producto) {
        console.log('✅ PRODUCTO REAL ENCONTRADO:', producto._rawData);
        return this.formatearProductoReal(producto);
      }
      
      console.log('❌ Producto no encontrado en datos reales');
      return null;
      
    } catch (error) {
      console.error('❌ Error buscando código real:', error.message);
      return null;
    }
  }

  // 🟢 FORMATEAR PRODUCTO REAL
  formatearProductoReal(row) {
    const producto = {
      codigo: row['COD.HYPNO'] || row['__EMPTY_6'] || 'N/A',
      marca: row['Marca'] || row['__EMPTY_2'] || 'N/A',
      modelo: row['Modelo'] || row['__EMPTY_7'] || 'N/A',
      color: this.extraerColor(row['Descripciones'] || row['__EMPTY_19'] || ''),
      precio: parseFloat(row['PRECIO'] || row['__EMPTY_15'] || 0),
      cantidad: parseInt(row['Cantidad'] || row['__EMPTY_8'] || 0),
      categoria: 'Armazón',
      descripcion: row['Descripciones'] || row['__EMPTY_19'] || 'N/A'
    };
    
    console.log('📋 Producto real formateado:', producto);
    return producto;
  }

  // 🟢 OBTENER MARCAS LC REALES
  async obtenerMarcasLC() {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle['Stock LC'];
      if (!sheet) {
        console.log('❌ No se encuentra hoja Stock LC');
        return [];
      }
      
      const rows = await sheet.getRows();
      console.log(`👁️ Buscando marcas LC en ${rows.length} filas...`);
      
      const marcas = new Set();
      
      rows.forEach((row, index) => {
        // Buscar en diferentes columnas
        const marcaB = row['__EMPTY_1'] || row['Marca'];
        const marcaC = row['__EMPTY_2'];
        const marcaD = row['__EMPTY_3'];
        
        if (marcaB && marcaB.trim() !== '' && marcaB !== 'Marca') {
          console.log(`🏷️ Marca LC encontrada en B: ${marcaB}`);
          marcas.add(marcaB.trim());
        }
        if (marcaC && marcaC.trim() !== '' && marcaC !== 'Marca') {
          console.log(`🏷️ Marca LC encontrada en C: ${marcaC}`);
          marcas.add(marcaC.trim());
        }
        if (marcaD && marcaD.trim() !== '' && marcaD !== 'Marca') {
          console.log(`🏷️ Marca LC encontrada en D: ${marcaD}`);
          marcas.add(marcaD.trim());
        }
      });
      
      const marcasArray = Array.from(marcas);
      console.log(`✅ Marcas LC reales encontradas: ${marcasArray.length}`, marcasArray);
      
      return marcasArray;
    } catch (error) {
      console.error('❌ Error obteniendo marcas LC reales:', error.message);
      return [];
    }
  }

  // 🟢 OBTENER LÍQUIDOS REALES
  async obtenerLiquidos() {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle['Stock Liquidos'];
      if (!sheet) {
        console.log('❌ No se encuentra hoja Stock Liquidos');
        return [];
      }
      
      const rows = await sheet.getRows();
      console.log(`💧 Buscando líquidos en ${rows.length} filas...`);
      
      const liquidos = rows.map(row => {
        const liquido = {
          marca: row['Marca'] || row['__EMPTY_1'],
          tamano: row['Tamaño en ml'] || row['__EMPTY_2'],
          disponible: true
        };
        
        if (liquido.marca && liquido.marca !== 'Marca') {
          console.log(`🧴 Líquido real: ${liquido.marca} ${liquido.tamano}`);
        }
        
        return liquido;
      }).filter(l => l.marca && l.marca !== 'Marca');
      
      console.log(`✅ Líquidos reales encontrados: ${liquidos.length}`);
      return liquidos;
    } catch (error) {
      console.error('❌ Error obteniendo líquidos reales:', error.message);
      return [];
    }
  }

  // 🟢 OBTENER TODOS LOS PRODUCTOS REALES
  async obtenerTodosProductos() {
    try {
      if (!this.initialized) await this.initialize();
      
      const productos = await this.obtenerProductosDeSheet('STOCK ARMAZONES 1');
      return productos.map(row => this.formatearProductoReal(row));
    } catch (error) {
      console.error('❌ Error obteniendo todos los productos reales:', error.message);
      return [];
    }
  }

  // 🟢 DIAGNÓSTICO MEJORADO
  async diagnosticar() {
    return await this.diagnostico();
  }

  async diagnostico() {
    try {
      console.log('🔍 INICIANDO DIAGNÓSTICO CON DATOS REALES...');
      
      await this.initialize();
      
      const hojas = ['STOCK ARMAZONES 1', 'Stock LC', 'Stock Accesorios', 'Stock Liquidos'];
      const resultadoHojas = {};
      
      for (const hoja of hojas) {
        try {
          const productos = await this.obtenerProductosDeSheet(hoja);
          resultadoHojas[hoja] = {
            estado: '✅ OK - DATOS REALES',
            productos: productos.length,
            primeros: productos.slice(0, 2).map(p => p._rawData),
            error: null
          };
        } catch (error) {
          resultadoHojas[hoja] = {
            estado: '❌ ERROR',
            productos: 0,
            primeros: [],
            error: error.message
          };
        }
      }
      
      // Probar búsqueda real
      let busquedaResultado;
      try {
        const busqueda = await this.buscarPorCodigo('AC-274');
        busquedaResultado = busqueda ? '✅ PRODUCTO REAL ENCONTRADO' : '⚠️ Producto no encontrado (normal)';
      } catch (error) {
        busquedaResultado = `❌ Error en búsqueda: ${error.message}`;
      }
      
      return {
        configuracion: {
          sheets_id: process.env.GOOGLE_SHEETS_ID ? '✅ Configurado' : '❌ Faltante',
          service_account: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? '✅ Configurado' : '❌ Faltante',
          usando_datos_reales: this.usingRealData ? '✅ SÍ' : '❌ NO',
          estado: '🟢 CONECTADO A DATOS REALES'
        },
        inicializacion: '✅ INICIALIZACIÓN EXITOSA - DATOS REALES',
        hojas: resultadoHojas,
        busqueda: busquedaResultado,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ ERROR EN DIAGNÓSTICO:', error.message);
      return {
        configuracion: {
          sheets_id: process.env.GOOGLE_SHEETS_ID ? '✅ Configurado' : '❌ Faltante',
          service_account: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? '✅ Configurado' : '❌ Faltante',
          estado: '❌ ERROR DE CONEXIÓN'
        },
        inicializacion: `❌ Error en inicialización: ${error.message}`,
        hojas: {},
        busqueda: `❌ Error en búsqueda: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

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
}

module.exports = GoogleSheetsService;
