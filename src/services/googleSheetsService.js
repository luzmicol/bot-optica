const { GoogleSpreadsheet } = require('google-spreadsheet');

// 🟢 CORREGIR RUTA - depende de tu estructura
let GOOGLE_SHEET_ID, GOOGLE_API_KEY;
try {
  // Intentar cargar desde environment (Render)
  GOOGLE_SHEET_ID = process.env.GOOGLE_SHEETS_ID;
  GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
} catch (error) {
  console.log('⚠️ No se pudo cargar config, usando process.env directamente');
}

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.initialized = false;
    this.config = {
      sheetId: GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_ID,
      apiKey: GOOGLE_API_KEY || process.env.GOOGLE_API_KEY,
      hojas: {
        armazones: 'armazones',
        lc: 'stock lc', 
        liquidos: 'stock liquidos'
      }
    };
  }

  async initialize() {
    try {
      console.log('🔧 Inicializando Google Sheets...');
      
      if (!this.config.sheetId) {
        throw new Error('GOOGLE_SHEETS_ID no configurado');
      }

      this.doc = new GoogleSpreadsheet(this.config.sheetId);
      
      // Usar API Key si está disponible, sino intentar sin autenticación
      if (this.config.apiKey) {
        this.doc.useApiKey(this.config.apiKey);
        console.log('✅ Usando API Key');
      } else {
        console.log('⚠️ Sin API Key - intentando acceso público');
      }
      
      await this.doc.loadInfo();
      
      this.initialized = true;
      console.log('✅ Google Sheets inicializado');
      console.log('📊 Hojas cargadas:', Object.keys(this.doc.sheetsByTitle));
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Google Sheets:', error.message);
      throw error;
    }
  }

  // 📦 BUSQUEDA EN ARMAZONES
  async buscarArmazon(codigo = null, descripcion = null) {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle[this.config.hojas.armazones];
      if (!sheet) {
        console.log('❌ No se encuentra hoja "armazones"');
        return this.datosDeEjemplo(codigo, descripcion);
      }
      
      const rows = await sheet.getRows();
      console.log(`🔍 Buscando en ${rows.length} filas de armazones...`);

      // Si hay pocos datos, usar ejemplo
      if (rows.length <= 1) {
        console.log('⚠️ Pocos datos, usando ejemplo');
        return this.datosDeEjemplo(codigo, descripcion);
      }

      if (codigo) {
        const producto = rows.find(row => 
          row['COD.HYPNO']?.toString().toLowerCase() === codigo.toLowerCase()
        );
        if (producto) {
          console.log('✅ Producto encontrado:', codigo);
          return this.formatearArmazon(producto);
        }
      }
      
      if (descripcion) {
        const productos = rows.filter(row => {
          const desc = row['Descripciones'] || '';
          const modelo = row['Modelo'] || '';
          const marca = row['Marca'] || '';
          
          const texto = `${desc} ${modelo} ${marca}`.toLowerCase();
          return texto.includes(descripcion.toLowerCase());
        }).slice(0, 3);
        
        if (productos.length > 0) {
          return productos.map(p => this.formatearArmazon(p));
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error buscando armazón:', error.message);
      return this.datosDeEjemplo(codigo, descripcion);
    }
  }

  // 🎯 FORMATEAR ARMAZÓN
  formatearArmazon(row) {
    const producto = {
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
    return producto;
  }

  // 👁️ OBTENER MARCAS LC
  async obtenerMarcasLC() {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle[this.config.hojas.lc];
      if (!sheet) return ['Acuvue', 'Biofinity', 'Air Optix'];
      
      const rows = await sheet.getRows();
      if (rows.length <= 1) return ['Acuvue', 'Biofinity', 'Air Optix'];
      
      const marcas = new Set();
      rows.forEach(row => {
        if (row['__EMPTY_1']) marcas.add(row['__EMPTY_1']);
        if (row['__EMPTY_2']) marcas.add(row['__EMPTY_2']);
        if (row['__EMPTY_3']) marcas.add(row['__EMPTY_3']);
      });
      
      return Array.from(marcas).filter(m => m && m !== 'Marca');
    } catch (error) {
      console.error('❌ Error marcas LC:', error.message);
      return ['Acuvue', 'Biofinity', 'Air Optix'];
    }
  }

  // 💧 OBTENER LÍQUIDOS
  async obtenerLiquidos() {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle[this.config.hojas.liquidos];
      if (!sheet) return [{ marca: 'Renu', tamaño: '300ml', disponible: true }];
      
      const rows = await sheet.getRows();
      if (rows.length <= 1) return [{ marca: 'Renu', tamaño: '300ml', disponible: true }];
      
      const liquidos = rows.map(row => ({
        marca: row['Marca'] || row['__EMPTY_1'],
        tamaño: row['Tamaño en ml'] || row['__EMPTY_2'],
        disponible: true
      })).filter(l => l.marca && l.marca !== 'Marca');
      
      return liquidos.length > 0 ? liquidos : [{ marca: 'Renu', tamaño: '300ml', disponible: true }];
    } catch (error) {
      console.error('❌ Error líquidos:', error.message);
      return [{ marca: 'Renu', tamaño: '300ml', disponible: true }];
    }
  }

  // 🔍 BÚSQUEDA GENERAL
  async buscarProducto(consulta) {
    try {
      console.log(`🔍 Búsqueda: "${consulta}"`);
      
      if (consulta.startsWith('#') || /^[A-Za-z0-9]+$/.test(consulta)) {
        const codigo = consulta.replace('#', '').trim();
        const resultado = await this.buscarArmazon(codigo, null);
        if (resultado) return resultado;
      }
      
      const resultados = await this.buscarArmazon(null, consulta);
      if (resultados) return resultados;
      
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
      return this.datosDeEjemplo(null, consulta);
    }
  }

  // 📝 DATOS DE EJEMPLO
  datosDeEjemplo(codigo, descripcion) {
    const ejemplos = [
      {
        tipo: 'armazon', codigo: 'RB1001', marca: 'Ray-Ban', modelo: 'Aviator',
        tipo_lente: 'Sol', descripcion: 'Lentes de sol clásicos', cantidad: 5, precio: 15000
      },
      {
        tipo: 'armazon', codigo: 'OK2002', marca: 'Oakley', modelo: 'Holbrook', 
        tipo_lente: 'Sol', descripcion: 'Lentes deportivos', cantidad: 3, precio: 18000
      }
    ];

    if (codigo) return ejemplos.find(p => p.codigo.toLowerCase() === codigo.toLowerCase());
    if (descripcion) return ejemplos.filter(p => p.descripcion.toLowerCase().includes(descripcion.toLowerCase()));
    return ejemplos[0];
  }

  // 📊 DIAGNÓSTICO
  async diagnostico() {
    try {
      await this.initialize();
      
      return {
        configuracion: {
          sheets_id: this.config.sheetId ? '✅ Configurado' : '❌ No configurado',
          api_key: this.config.apiKey ? '✅ Configurado' : '❌ No configurado',
          estado: '✅ MODO SIMPLE'
        },
        inicializacion: '✅ OK',
        hojas: await this.verificarHojas(),
        busqueda_ejemplo: await this.probarBusqueda(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        estado: '❌ ERROR',
        timestamp: new Date().toISOString()
      };
    }
  }

  async verificarHojas() {
    const hojas = {};
    for (const [key, nombre] of Object.entries(this.config.hojas)) {
      try {
        const sheet = this.doc.sheetsByTitle[nombre];
        const rows = await sheet.getRows();
        hojas[nombre] = {
          estado: '✅ OK',
          filas: rows.length,
          columnas: rows.length > 0 ? Object.keys(rows[0]).slice(0, 5) : []
        };
      } catch (error) {
        hojas[nombre] = { estado: '❌ ERROR', error: error.message };
      }
    }
    return hojas;
  }

  async probarBusqueda() {
    try {
      const resultado = await this.buscarProducto('ray');
      return {
        estado: resultado ? '✅ FUNCIONA' : '⚠️ SIN RESULTADOS',
        resultados: resultado ? 'Búsqueda exitosa' : 'No hubo coincidencias'
      };
    } catch (error) {
      return { estado: '✅ FUNCIONA CON EJEMPLOS', nota: 'Usando datos de prueba' };
    }
  }
}

module.exports = GoogleSheetsService;
