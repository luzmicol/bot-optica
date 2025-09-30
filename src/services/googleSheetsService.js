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
      return [];
    }
    
    console.log(`📥 Cargando datos de: ${sheet.title}`);
    
    // CONFIGURACIÓN ESPECÍFICA POR HOJA
    const configHojas = {
      'STOCK ARMAZONES 1': { headerRow: 3, columnas: {
        codigo: 'COD. HYPNO',
        marca: 'Marca', 
        modelo: 'Modelo',
        color: 'Color',
        cantidad: 'Cantidad',
        precio: 'PRECIO',
        descripcion: 'Descripciones',
        sol_receta: 'Sol/Receta'
      }},
      'Stock LC': { headerRow: 2, columnas: {
        codigo: 'COD. HYPNO',
        marca: 'Marca',
        modelo: 'Modelo', 
        cantidad: 'Cantidad',
        precio: 'PRECIO'
      }},
      'Stock Accesorios': { headerRow: 2, columnas: {
        codigo: 'COD. HYPNO',
        marca: 'Marca',
        modelo: 'Modelo',
        cantidad: 'Cantidad', 
        precio: 'PRECIO'
      }},
      'Stock Liquidos': { headerRow: 2, columnas: {
        marca: 'Marca',
        descripcion: 'Descripciones',
        cantidad: 'Cantidad',
        precio: 'PRECIO'
      }}
    };
    
    // Usar configuración específica o valores por defecto
    const config = configHojas[sheetTitle] || { 
      headerRow: 1, 
      columnas: {
        codigo: 'COD. HYPNO',
        marca: 'Marca',
        modelo: 'Modelo',
        color: 'Color',
        cantidad: 'Cantidad',
        precio: 'PRECIO',
        descripcion: 'Descripciones'
      }
    };
    
    console.log(`⚙️  Configuración para ${sheetTitle}: fila ${config.headerRow}`);
    
    try {
      await sheet.loadHeaderRow(config.headerRow);
    } catch (error) {
      console.error(`❌ No se pueden leer encabezados en fila ${config.headerRow} de ${sheetTitle}`);
      return [];
    }
    
    const rows = await sheet.getRows();
    console.log(`📊 ${rows.length} filas encontradas en ${sheetTitle}`);
    
    const productos = rows.map((row, index) => {
      try {
        // Usar las columnas configuradas para esta hoja
        const codigo = row[config.columnas.codigo] || '';
        const marca = row[config.columnas.marca] || '';
        const modelo = row[config.columnas.modelo] || '';
        const color = row[config.columnas.color] || '';
        const cantidad = row[config.columnas.cantidad] || '0';
        const precio = row[config.columnas.precio] || '';
        const descripcion = row[config.columnas.descripcion] || '';
        const sol_receta = row[config.columnas.sol_receta] || '';
        
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
            sol_receta: sol_receta.trim(),
            categoria: sheetTitle,
            fila: index + config.headerRow + 1
          };
        }
        return null;
      } catch (rowError) {
        console.error(`Error procesando fila ${index + 1}:`, rowError);
        return null;
      }
    }).filter(producto => producto !== null);
    
    console.log(`✅ ${productos.length} productos válidos de ${sheetTitle}`);
    
    // DEBUG: Mostrar algunos productos encontrados
    if (productos.length > 0) {
      console.log('🔍 Primeros productos:', productos.slice(0, 3).map(p => ({
        codigo: p.codigo,
        marca: p.marca,
        modelo: p.modelo,
        stock: p.cantidad
      })));
    }
    
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

  async obtenerMarcasLC() {
    try {
      const productos = await this.obtenerProductosDeSheet(config.google.sheets.lentesContacto);
      const marcas = [...new Set(productos.map(p => p.marca).filter(m => m))].sort();
      
      console.log(`👁️ Marcas de LC detectadas: ${marcas.join(', ')}`);
      return marcas.length > 0 ? marcas : ['Acuvue', 'Air Optix', 'Biofinity', 'FreshLook'];
    } catch (error) {
      console.error('Error obteniendo marcas de LC:', error);
      return ['Acuvue', 'Air Optix', 'Biofinity', 'FreshLook'];
    }
  }

  async obtenerLiquidos() {
    try {
      const productos = await this.obtenerProductosDeSheet(config.google.sheets.liquidos);
      const liquidos = productos.map(p => ({
        marca: p.marca,
        tamano: p.descripcion || 'Consultar',
        precio: p.precio
      }));
      
      console.log(`🧴 Líquidos detectados: ${liquidos.length} productos`);
      return liquidos.length > 0 ? liquidos : [
        { marca: 'Renu', tamano: '300ml' },
        { marca: 'Opti-Free', tamano: '300ml' }
      ];
    } catch (error) {
      console.error('Error obteniendo líquidos:', error);
      return [
        { marca: 'Renu', tamano: '300ml' },
        { marca: 'Opti-Free', tamano: '300ml' }
      ];
    }
  }

  async obtenerTodosProductos() {
    try {
      const sheets = [
        config.google.sheets.armazones,
        config.google.sheets.accesorios,
        config.google.sheets.lentesContacto,
        config.google.sheets.liquidos
      ].filter(Boolean);

      let todosProductos = [];
      for (const sheet of sheets) {
        const productos = await this.obtenerProductosDeSheet(sheet);
        todosProductos = todosProductos.concat(productos);
      }
      
      console.log(`📊 Total de productos en stock: ${todosProductos.length}`);
      return todosProductos;
    } catch (error) {
      console.error('Error obteniendo todos los productos:', error);
      return [];
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
        try {
          // Intentar diferentes filas de encabezado
          let headerRow = 0;
          let headerValues = [];
          
          try {
            await sheet.loadHeaderRow(1); // Fila 1
            headerValues = sheet.headerValues || [];
            headerRow = 1;
          } catch (e1) {
            try {
              await sheet.loadHeaderRow(2); // Fila 2
              headerValues = sheet.headerValues || [];
              headerRow = 2;
            } catch (e2) {
              try {
                await sheet.loadHeaderRow(3); // Fila 3
                headerValues = sheet.headerValues || [];
                headerRow = 3;
              } catch (e3) {
                headerValues = ['No se pudo cargar encabezados'];
              }
            }
          }
          
          const rows = await sheet.getRows();
          sheetsInfo[title] = {
            filas: rows.length,
            encabezados: headerValues,
            fila_encabezado: headerRow,
            ejemplo_fila: rows[0] ? Object.keys(rows[0]).slice(0, 5) : []
          };
          
        } catch (sheetError) {
          sheetsInfo[title] = {
            error: sheetError.message,
            filas: 'No disponible'
          };
        }
      }
      
      return sheetsInfo;
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error.message);
      return { error: error.message };
    }
  }
}

module.exports = new GoogleSheetsService();
