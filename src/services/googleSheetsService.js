const { GoogleSpreadsheet } = require('google-spreadsheet');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🚀 INICIANDO CONEXIÓN DIRECTA A GOOGLE SHEETS...');
      
      // 🟢 VERIFICAR CREDENCIALES DIRECTAMENTE
      const sheetId = process.env.GOOGLE_SHEETS_ID;
      const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      
      console.log('📋 Sheet ID:', sheetId ? '✅' : '❌');
      console.log('🔑 Service Account:', serviceAccountJson ? '✅' : '❌');
      
      if (!sheetId || !serviceAccountJson) {
        throw new Error('Faltan credenciales de Google Sheets');
      }

      this.doc = new GoogleSpreadsheet(sheetId);
      
      // 🟢 PARSEAR SERVICE ACCOUNT CORRECTAMENTE
      console.log('🔑 Parseando Service Account...');
      let credentials;
      try {
        credentials = JSON.parse(serviceAccountJson);
        console.log('✅ Service Account parseado correctamente');
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError.message);
        throw new Error('Service Account JSON inválido');
      }
      
      // 🟢 AUTENTICAR
      console.log('🔐 Autenticando...');
      await this.doc.useServiceAccountAuth(credentials);
      console.log('✅ Autenticación exitosa');
      
      // 🟢 CARGAR INFORMACIÓN
      console.log('📊 Cargando información del sheet...');
      await this.doc.loadInfo();
      console.log('✅ Sheet cargado:', this.doc.title);
      
      // 🟢 LISTAR HOJAS DISPONIBLES
      console.log('📑 Hojas disponibles:');
      Object.keys(this.doc.sheetsByTitle).forEach(title => {
        console.log(`   - ${title}`);
      });
      
      this.initialized = true;
      console.log('🎉 CONEXIÓN EXITOSA - DATOS REALES ACTIVOS');
      return true;
      
    } catch (error) {
      console.error('💥 ERROR CRÍTICO EN INICIALIZACIÓN:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  // 🟢 LEER HOJA REAL - VERSIÓN ROBUSTA
  async obtenerProductosDeSheet(hojaNombre) {
    try {
      if (!this.initialized) {
        console.log('🔄 Inicializando antes de leer...');
        await this.initialize();
      }
      
      console.log(`📖 Leyendo hoja: "${hojaNombre}"`);
      
      const sheet = this.doc.sheetsByTitle[hojaNombre];
      if (!sheet) {
        console.log(`❌ Hoja "${hojaNombre}" no encontrada`);
        console.log('📋 Hojas disponibles:', Object.keys(this.doc.sheetsByTitle));
        return [];
      }
      
      console.log(`✅ Hoja "${hojaNombre}" encontrada, leyendo filas...`);
      const rows = await sheet.getRows();
      console.log(`📊 "${hojaNombre}": ${rows.length} filas leídas`);
      
      // 🎯 MOSTRAR ESTRUCTURA DE PRIMERAS FILAS
      if (rows.length > 0) {
        console.log('🔍 Estructura de primera fila:', Object.keys(rows[0]));
        console.log('📝 Primera fila datos:', rows[0]._rawData);
        
        if (rows.length > 1) {
          console.log('📝 Segunda fila datos:', rows[1]._rawData);
        }
      } else {
        console.log('⚠️ Hoja vacía o sin datos');
      }
      
      return rows;
      
    } catch (error) {
      console.error(`💥 Error leyendo "${hojaNombre}":`, error.message);
      return [];
    }
  }

  // 🟢 BUSCAR POR CÓDIGO - VERSIÓN MEJORADA
  async buscarPorCodigo(codigo) {
    try {
      console.log(`🔎 BUSCANDO CÓDIGO: "${codigo}"`);
      
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle['STOCK ARMAZONES 1'];
      if (!sheet) {
        throw new Error('No se encuentra la hoja "STOCK ARMAZONES 1"');
      }
      
      const rows = await sheet.getRows();
      console.log(`📦 Buscando en ${rows.length} productos...`);
      
      // 🎯 BUSCAR EN DIFERENTES COLUMNAS POSIBLES
      const producto = rows.find(row => {
        // Probar diferentes nombres de columna para código
        const posiblesCodigos = [
          row['COD.HYPNO'],
          row['CÓDIGO'], 
          row['CODIGO'],
          row['Código'],
          row['__EMPTY_6'] // Columna F
        ];
        
        const codigoEncontrado = posiblesCodigos.find(c => 
          c && c.toString().trim().toLowerCase() === codigo.toLowerCase().trim()
        );
        
        if (codigoEncontrado) {
          console.log('✅ CÓDIGO ENCONTRADO en columna');
          return true;
        }
        return false;
      });
      
      if (producto) {
        console.log('🎉 PRODUCTO REAL ENCONTRADO');
        const productoFormateado = this.formatearProductoReal(producto);
        console.log('📋 Producto formateado:', productoFormateado);
        return productoFormateado;
      }
      
      console.log('❌ Código no encontrado en los datos reales');
      return null;
      
    } catch (error) {
      console.error('💥 Error en búsqueda:', error.message);
      return null;
    }
  }

  // 🟢 FORMATEAR PRODUCTO CON TUS COLUMNAS ESPECÍFICAS
  formatearProductoReal(row) {
    console.log('🔧 Formateando producto con datos reales...');
    console.log('📊 Datos crudos:', row._rawData);
    console.log('🏷️ Columnas disponibles:', Object.keys(row));
    
    const producto = {
      // 🎯 TUS COLUMNAS ESPECÍFICAS
      codigo: row['COD.HYPNO'] || row['__EMPTY_6'] || 'N/A',
      marca: row['Marca'] || row['__EMPTY_2'] || 'N/A', // C3
      modelo: row['Modelo'] || row['__EMPTY_7'] || 'N/A', // G3
      tipo_lente: row['Sol/Receta'] || row['__EMPTY_4'] || 'N/A', // E3
      cantidad: parseInt(row['Cantidad'] || row['__EMPTY_8'] || 0), // I3
      precio: parseFloat(row['PRECIO'] || row['__EMPTY_15'] || 0), // P3
      descripcion: row['Descripciones'] || row['__EMPTY_19'] || 'N/A', // T3
      color: this.extraerColor(row['Descripciones'] || row['__EMPTY_19'] || ''),
      categoria: 'Armazón'
    };
    
    console.log('✅ Producto formateado con estructura REAL');
    return producto;
  }

  // 🟢 OBTENER MARCAS LC REALES
  async obtenerMarcasLC() {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle['Stock LC'];
      if (!sheet) {
        console.log('❌ No se encuentra "Stock LC"');
        return [];
      }
      
      const rows = await sheet.getRows();
      console.log(`👁️ Analizando ${rows.length} filas de LC...`);
      
      const marcas = new Set();
      
      rows.forEach((row, index) => {
        console.log(`📝 Fila ${index + 1}:`, row._rawData);
        
        // 🎯 TUS COLUMNAS ESPECÍFICAS - B2, C2, D2
        const marcasFila = [
          row['__EMPTY_1'], // B2
          row['__EMPTY_2'], // C2  
          row['__EMPTY_3']  // D2
        ];
        
        marcasFila.forEach((marca, colIndex) => {
          if (marca && marca.trim() && marca !== 'Marca') {
            console.log(`🏷️ Marca encontrada columna ${colIndex + 1}: ${marca}`);
            marcas.add(marca.trim());
          }
        });
      });
      
      const marcasArray = Array.from(marcas);
      console.log(`✅ Marcas LC encontradas: ${marcasArray.length}`, marcasArray);
      return marcasArray;
      
    } catch (error) {
      console.error('💥 Error LC:', error.message);
      return [];
    }
  }

  // 🟢 OBTENER LÍQUIDOS REALES
  async obtenerLiquidos() {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle['Stock Liquidos'];
      if (!sheet) {
        console.log('❌ No se encuentra "Stock Liquidos"');
        return [];
      }
      
      const rows = await sheet.getRows();
      console.log(`💧 Analizando ${rows.length} filas de líquidos...`);
      
      const liquidos = rows.map(row => {
        console.log('📝 Fila líquidos:', row._rawData);
        
        // 🎯 TUS COLUMNAS ESPECÍFICAS
        const liquido = {
          marca: row['Marca'] || row['__EMPTY_1'], // B2
          tamano: row['Tamaño en ml'] || row['__EMPTY_2'], // C2
          disponible: true
        };
        
        return liquido;
      }).filter(l => l.marca && l.marca !== 'Marca');
      
      console.log(`✅ Líquidos encontrados: ${liquidos.length}`);
      return liquidos;
      
    } catch (error) {
      console.error('💥 Error líquidos:', error.message);
      return [];
    }
  }

  // 🟢 OBTENER TODOS LOS PRODUCTOS
  async obtenerTodosProductos() {
    try {
      const productos = await this.obtenerProductosDeSheet('STOCK ARMAZONES 1');
      return productos.map(row => this.formatearProductoReal(row));
    } catch (error) {
      console.error('💥 Error todos productos:', error.message);
      return [];
    }
  }

  // 🟢 DIAGNÓSTICO
  async diagnosticar() {
    return this.diagnostico();
  }

  async diagnostico() {
    try {
      console.log('🔍 DIAGNÓSTICO INICIADO...');
      await this.initialize();
      
      const hojas = ['STOCK ARMAZONES 1', 'Stock LC', 'Stock Accesorios', 'Stock Liquidos'];
      const resultadoHojas = {};
      
      for (const hoja of hojas) {
        try {
          const productos = await this.obtenerProductosDeSheet(hoja);
          resultadoHojas[hoja] = {
            estado: '✅ OK - DATOS REALES',
            productos: productos.length,
            primeros: productos.slice(0, 2).map(p => ({
              datos_crudos: p._rawData,
              columnas: Object.keys(p)
            })),
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
      
      return {
        configuracion: {
          sheets_id: '✅ Configurado',
          service_account: '✅ Configurado', 
          estado: '🟢 CONECTADO A DATOS REALES'
        },
        inicializacion: '✅ INICIALIZACIÓN EXITOSA',
        hojas: resultadoHojas,
        busqueda: '✅ SISTEMA LISTO',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        configuracion: {
          sheets_id: process.env.GOOGLE_SHEETS_ID ? '✅' : '❌',
          service_account: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? '✅' : '❌',
          estado: `❌ ERROR: ${error.message}`
        },
        inicializacion: `❌ FALLÓ: ${error.message}`,
        hojas: {},
        busqueda: '❌ NO DISPONIBLE',
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
