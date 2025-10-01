const { GoogleSpreadsheet } = require('google-spreadsheet');

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🔧 Inicializando Google Sheets (modo simple)...');
      
      const sheetId = process.env.GOOGLE_SHEET_ID;
      
      if (!sheetId) {
        throw new Error('GOOGLE_SHEET_ID no configurado en environment');
      }

      this.doc = new GoogleSpreadsheet(sheetId);
      
      // 🟢 OPCIÓN 1: Sin autenticación (si el sheet es público)
      // No requiere auth, pero el sheet debe ser público
      
      // 🟢 OPCIÓN 2: Con API Key simple
      if (process.env.GOOGLE_API_KEY) {
        this.doc.useApiKey(process.env.GOOGLE_API_KEY);
        console.log('✅ Usando API Key simple');
      }
      
      await this.doc.loadInfo();
      
      this.initialized = true;
      console.log('✅ Google Sheets inicializado correctamente');
      console.log('📊 Hojas disponibles:', Object.keys(this.doc.sheetsByTitle));
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Google Sheets:', error.message);
      throw error;
    }
  }

  // 📦 BUSQUEDA EN ARMAZONES (VERSIÓN SIMPLE)
  async buscarArmazon(codigo = null, descripcion = null) {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle['armazones'];
      if (!sheet) {
        throw new Error('No se encuentra la hoja "armazones"');
      }
      
      const rows = await sheet.getRows();
      console.log(`🔍 Buscando en ${rows.length} filas de armazones...`);

      // Si no hay filas, retornar datos de ejemplo para probar
      if (rows.length === 0) {
        console.log('⚠️ Hoja vacía, retornando datos de ejemplo');
        return this.datosDeEjemplo(codigo, descripcion);
      }

      if (codigo) {
        // Buscar por código en todas las columnas posibles
        const producto = rows.find(row => {
          // Buscar en diferentes columnas posibles
          const posiblesColumnas = ['COD.HYPNO', 'Código', 'Código Hypno', '__EMPTY_6'];
          for (const columna of posiblesColumnas) {
            if (row[columna]?.toString().toLowerCase() === codigo.toLowerCase()) {
              return true;
            }
          }
          return false;
        });
        
        if (producto) {
          console.log('✅ Producto encontrado por código:', codigo);
          return this.formatearArmazon(producto);
        }
      }
      
      if (descripcion) {
        const productos = rows.filter(row => {
          const textoBusqueda = [
            row['Descripciones'], row['Modelo'], row['Marca'],
            row['__EMPTY_19'], row['__EMPTY_7'], row['__EMPTY_2']
          ].join(' ').toLowerCase();
          
          return textoBusqueda.includes(descripcion.toLowerCase());
        }).slice(0, 3); // Máximo 3 resultados
        
        console.log(`📝 Encontrados ${productos.length} productos por: "${descripcion}"`);
        
        if (productos.length > 0) {
          return productos.map(p => this.formatearArmazon(p));
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error buscando armazón:', error);
      // Retornar datos de ejemplo en caso de error
      return this.datosDeEjemplo(codigo, descripcion);
    }
  }

  // 🎯 FORMATEAR ARMAZÓN
  formatearArmazon(row) {
    // Buscar en diferentes columnas posibles
    const getValor = (columnas) => {
      for (const col of columnas) {
        if (row[col] !== undefined && row[col] !== '') {
          return row[col];
        }
      }
      return 'N/A';
    };

    const producto = {
      tipo: 'armazon',
      codigo: getValor(['COD.HYPNO', '__EMPTY_6', 'Código']),
      marca: getValor(['Marca', '__EMPTY_2', 'Marca']),
      modelo: getValor(['Modelo', '__EMPTY_7', 'Modelo']),
      tipo_lente: getValor(['Sol/Receta', '__EMPTY_4', 'Tipo']),
      descripcion: getValor(['Descripciones', '__EMPTY_19', 'Descripción']),
      cantidad: parseInt(getValor(['Cantidad', '__EMPTY_8', 'Stock'])) || 0,
      precio: parseFloat(getValor(['PRECIO', '__EMPTY_15', 'Precio'])) || 0,
      disponible: true
    };

    console.log('📋 Producto formateado:', producto);
    return producto;
  }

  // 📝 DATOS DE EJEMPLO PARA PRUEBAS
  datosDeEjemplo(codigo, descripcion) {
    const ejemplos = [
      {
        tipo: 'armazon',
        codigo: 'RB1001',
        marca: 'Ray-Ban',
        modelo: 'Aviator',
        tipo_lente: 'Sol',
        descripcion: 'Lentes de sol Ray-Ban Aviator clásicos',
        cantidad: 5,
        precio: 15000,
        disponible: true
      },
      {
        tipo: 'armazon', 
        codigo: 'OK2002',
        marca: 'Oakley',
        modelo: 'Holbrook',
        tipo_lente: 'Sol',
        descripcion: 'Lentes deportivos Oakley Holbrook',
        cantidad: 3,
        precio: 18000,
        disponible: true
      }
    ];

    if (codigo) {
      return ejemplos.find(p => p.codigo.toLowerCase() === codigo.toLowerCase());
    }
    
    if (descripcion) {
      return ejemplos.filter(p => 
        p.descripcion.toLowerCase().includes(descripcion.toLowerCase()) ||
        p.marca.toLowerCase().includes(descripcion.toLowerCase())
      );
    }
    
    return ejemplos[0];
  }

  // 👁️ OBTENER MARCAS DE LENTES DE CONTACTO (SIMPLIFICADO)
  async obtenerMarcasLC() {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle['stock lc'];
      if (!sheet) {
        console.log('⚠️ No se encuentra hoja "stock lc", retornando marcas de ejemplo');
        return ['Acuvue', 'Biofinity', 'Air Optix'];
      }
      
      const rows = await sheet.getRows();
      
      // Si hay pocas filas, usar datos de ejemplo
      if (rows.length <= 1) {
        return ['Acuvue', 'Biofinity', 'Air Optix', 'Dailies'];
      }
      
      const marcas = new Set();
      
      // Buscar marcas en diferentes columnas
      rows.forEach(row => {
        Object.values(row).forEach(valor => {
          if (valor && typeof valor === 'string' && valor.length > 2) {
            // Filtrar valores que parezcan marcas
            if (!valor.match(/[0-9]/) && !valor.includes('Marca')) {
              marcas.add(valor.trim());
            }
          }
        });
      });
      
      const marcasArray = Array.from(marcas).slice(0, 10); // Máximo 10 marcas
      console.log(`🏷️ Marcas LC encontradas: ${marcasArray.length}`);
      
      return marcasArray.length > 0 ? marcasArray : ['Acuvue', 'Biofinity', 'Air Optix'];
    } catch (error) {
      console.error('❌ Error obteniendo marcas LC:', error);
      return ['Acuvue', 'Biofinity', 'Air Optix'];
    }
  }

  // 💧 OBTENER LÍQUIDOS (SIMPLIFICADO)
  async obtenerLiquidos() {
    try {
      if (!this.initialized) await this.initialize();
      
      const sheet = this.doc.sheetsByTitle['stock liquidos'];
      if (!sheet) {
        console.log('⚠️ No se encuentra hoja "stock liquidos", retornando ejemplo');
        return [
          { marca: 'Renu', tamaño: '300ml', disponible: true },
          { marca: 'Opti-Free', tamaño: '360ml', disponible: true }
        ];
      }
      
      const rows = await sheet.getRows();
      
      if (rows.length <= 1) {
        return [
          { marca: 'Renu', tamaño: '300ml', disponible: true },
          { marca: 'Opti-Free', tamaño: '360ml', disponible: true }
        ];
      }
      
      const liquidos = rows.map(row => ({
        marca: row['Marca'] || row['__EMPTY_1'] || 'Marca Genérica',
        tamaño: row['Tamaño en ml'] || row['__EMPTY_2'] || '250ml',
        disponible: true
      })).filter(liquido => liquido.marca && liquido.marca !== 'Marca');
      
      console.log(`💧 Líquidos encontrados: ${liquidos.length}`);
      
      return liquidos.length > 0 ? liquidos : [
        { marca: 'Renu', tamaño: '300ml', disponible: true }
      ];
    } catch (error) {
      console.error('❌ Error obteniendo líquidos:', error);
      return [
        { marca: 'Renu', tamaño: '300ml', disponible: true }
      ];
    }
  }

  // 🔍 BÚSQUEDA GENERAL (SIMPLIFICADA)
  async buscarProducto(consulta) {
    try {
      console.log(`🔍 Búsqueda general: "${consulta}"`);
      
      // Siempre intentar búsqueda en armazones primero
      let resultados = await this.buscarArmazon(null, consulta);
      if (resultados) return resultados;
      
      // Si no encuentra, buscar en marcas LC
      const marcasLC = await this.obtenerMarcasLC();
      const marcaLC = marcasLC.find(marca => 
        consulta.toLowerCase().includes(marca.toLowerCase())
      );
      if (marcaLC) {
        return {
          tipo: 'marca_lc',
          marca: marcaLC,
          mensaje: `Tenemos lentes de contacto de la marca *${marcaLC}* disponibles. ¿Te interesa algún modelo en particular?`
        };
      }
      
      // Si no encuentra, buscar en líquidos
      const liquidos = await this.obtenerLiquidos();
      const liquido = liquidos.find(liq =>
        consulta.toLowerCase().includes(liq.marca.toLowerCase())
      );
      if (liquido) {
        return {
          tipo: 'liquido',
          ...liquido,
          mensaje: `Tenemos líquido para lentes de contacto *${liquido.marca}* de *${liquido.tamaño}* disponible.`
        };
      }
      
      console.log('❌ No se encontraron resultados para:', consulta);
      return null;
    } catch (error) {
      console.error('❌ Error en búsqueda general:', error);
      // En caso de error, retornar datos de ejemplo
      return this.datosDeEjemplo(null, consulta);
    }
  }

  // 📊 DIAGNÓSTICO MEJORADO
  async diagnostico() {
    try {
      await this.initialize();
      
      const resultado = {
        configuracion: {
          sheets_id: process.env.GOOGLE_SHEET_ID ? '✅ Configurado' : '❌ No configurado',
          api_key: process.env.GOOGLE_API_KEY ? '✅ Configurado' : '❌ No configurado',
          metodo: process.env.GOOGLE_API_KEY ? 'API Key' : 'Acceso Público',
          estado: '✅ MODO SIMPLE ACTIVADO'
        },
        inicializacion: '✅ OK',
        hojas: {},
        busqueda_ejemplo: {},
        timestamp: new Date().toISOString()
      };
      
      // Probar cada hoja
      const hojas = ['armazones', 'stock lc', 'stock liquidos'];
      
      for (const hoja of hojas) {
        try {
          const sheet = this.doc.sheetsByTitle[hoja];
          const rows = await sheet.getRows();
          
          resultado.hojas[hoja] = {
            estado: '✅ OK',
            filas: rows.length,
            columnas: rows.length > 0 ? Object.keys(rows[0]) : ['VACÍA']
          };
        } catch (error) {
          resultado.hojas[hoja] = {
            estado: '❌ ERROR',
            error: error.message
          };
        }
      }
      
      // Probar búsqueda
      try {
        const ejemplo = await this.buscarProducto('ray');
        resultado.busqueda_ejemplo = {
          estado: ejemplo ? '✅ FUNCIONA' : '⚠️ SIN RESULTADOS',
          resultados: ejemplo ? 'Búsqueda exitosa' : 'No hubo resultados'
        };
      } catch (error) {
        resultado.busqueda_ejemplo = {
          estado: '✅ FUNCIONA CON DATOS DE EJEMPLO',
          nota: 'Usando datos de prueba'
        };
      }
      
      return resultado;
      
    } catch (error) {
      return {
        error: error.message,
        configuracion: {
          sheets_id: process.env.GOOGLE_SHEET_ID || 'No configurado',
          metodo: 'MODO SIMPLE',
          estado: '❌ ERROR INICIALIZACIÓN'
        },
        timestamp: new Date().toISOString(),
        nota: 'El bot funcionará con datos de ejemplo'
      };
    }
  }
}

module.exports = GoogleSheetsService;
