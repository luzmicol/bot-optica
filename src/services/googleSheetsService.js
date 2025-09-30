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
    
    // CONFIGURACIÓN ESPECÍFICA PARA CADA HOJA
    if (sheetTitle === 'STOCK ARMAZONES 1') {
      return await this._procesarArmazones(sheet);
    } else if (sheetTitle === 'Stock LC') {
      return await this._procesarLC(sheet);
    } else if (sheetTitle === 'Stock Accesorios') {
      return await this._procesarAccesorios(sheet);
    } else if (sheetTitle === 'Stock Liquidos') {
      return await this._procesarLiquidos(sheet);
    } else {
      console.log(`ℹ️  Hoja no configurada: ${sheetTitle}`);
      return [];
    }
    
  } catch (error) {
    console.error(`❌ Error obteniendo productos de ${sheetTitle}:`, error.message);
    return [];
  }
}

// Método específico para Armazones
async _procesarArmazones(sheet) {
  try {
    await sheet.loadHeaderRow(3);
    const rows = await sheet.getRows();
    console.log(`📊 ${rows.length} filas encontradas en Armazones`);
    
    const productos = rows.map((row, index) => {
      try {
        const codigo = row['COD. HYPNO'] || '';
        const marca = row['Marca'] || '';
        const modelo = row['Modelo'] || '';
        const color = row['Color'] || '';
        const cantidad = row['Cantidad'] || '0';
        const precio = row['PRECIO'] || '';
        const descripcion = row['Descripciones'] || '';
        const sol_receta = row['Sol/Receta'] || '';
        
        let stock = 0;
        if (cantidad && cantidad !== '0') {
          const numero = parseInt(cantidad.toString().replace(/[^\d]/g, ''));
          stock = isNaN(numero) ? 0 : numero;
        }
        
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
            categoria: 'Armazones',
            fila: index + 4
          };
        }
        return null;
      } catch (rowError) {
        console.error(`Error procesando fila ${index + 4}:`, rowError);
        return null;
      }
    }).filter(producto => producto !== null);
    
    console.log(`✅ ${productos.length} productos válidos de Armazones`);
    return productos;
    
  } catch (error) {
    console.error('❌ Error procesando Armazones:', error.message);
    return [];
  }
}

// Método específico para Lentes de Contacto (solo marcas)
async _procesarLC(sheet) {
  try {
    const rows = await sheet.getRows();
    console.log(`📊 ${rows.length} filas encontradas en LC`);
    
    const marcas = new Set();
    
    // Leer marcas de columnas B, C, D a partir de fila 2
    rows.forEach((row, index) => {
      if (index >= 1) { // A partir de fila 2 (index 1)
        const marcaB = row['B'] || '';
        const marcaC = row['C'] || '';
        const marcaD = row['D'] || '';
        
        [marcaB, marcaC, marcaD].forEach(marca => {
          if (marca.trim() && !marca.toLowerCase().includes('lentes') && !marca.toLowerCase().includes('contacto')) {
            marcas.add(marca.trim());
          }
        });
      }
    });
    
    const marcasArray = Array.from(marcas).sort();
    console.log(`👁️  Marcas de LC detectadas: ${marcasArray.join(', ')}`);
    
    // Convertir marcas a formato de productos para consistencia
    const productos = marcasArray.map((marca, index) => ({
      codigo: `LC-${index + 1}`,
      marca: marca,
      modelo: 'Lentes de Contacto',
      color: 'Consultar',
      cantidad: 1, // Asumir que hay stock
      precio: 'Consultar',
      descripcion: `Lentes de contacto ${marca}`,
      categoria: 'Lentes de Contacto',
      fila: index + 2
    }));
    
    console.log(`✅ ${productos.length} marcas de LC procesadas`);
    return productos;
    
  } catch (error) {
    console.error('❌ Error procesando LC:', error.message);
    return [];
  }
}

// Método específico para Accesorios
async _procesarAccesorios(sheet) {
  try {
    const rows = await sheet.getRows();
    console.log(`📊 ${rows.length} filas encontradas en Accesorios`);
    
    const productos = [];
    
    // Leer marcas desde A2 para abajo y precios desde I2 para abajo
    rows.forEach((row, index) => {
      if (index >= 1) { // A partir de fila 2 (index 1)
        const marca = row['A'] || '';
        const precio = row['I'] || '';
        
        if (marca.trim()) {
          productos.push({
            codigo: `ACC-${index + 1}`,
            marca: marca.trim(),
            modelo: 'Accesorio',
            color: 'Consultar',
            cantidad: 1, // Asumir stock
            precio: precio.toString().trim() || 'Consultar',
            descripcion: `Accesorio ${marca.trim()}`,
            categoria: 'Accesorios',
            fila: index + 2
          });
        }
      }
    });
    
    console.log(`✅ ${productos.length} accesorios procesados`);
    return productos;
    
  } catch (error) {
    console.error('❌ Error procesando Accesorios:', error.message);
    return [];
  }
}

// Método específico para Líquidos
async _procesarLiquidos(sheet) {
  try {
    const rows = await sheet.getRows();
    console.log(`📊 ${rows.length} filas encontradas en Líquidos`);
    
    const productos = [];
    
    // Leer marcas desde B2 para abajo y tamaños desde C2 para abajo
    rows.forEach((row, index) => {
      if (index >= 1) { // A partir de fila 2 (index 1)
        const marca = row['B'] || '';
        const tamano = row['C'] || '';
        
        if (marca.trim()) {
          productos.push({
            codigo: `LIQ-${index + 1}`,
            marca: marca.trim(),
            modelo: 'Líquido para lentes',
            color: 'Consultar',
            cantidad: 1, // Asumir stock
            precio: 'Consultar',
            descripcion: `Líquido ${marca.trim()} ${tamano.trim()}`,
            tamano: tamano.trim(),
            categoria: 'Líquidos',
            fila: index + 2
          });
        }
      }
    });
    
    console.log(`🧴 ${productos.length} líquidos procesados`);
    return productos;
    
  } catch (error) {
    console.error('❌ Error procesando Líquidos:', error.message);
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
    const productos = await this.obtenerProductosDeSheet('Stock LC');
    const marcas = [...new Set(productos.map(p => p.marca).filter(m => m))].sort();
    console.log(`👁️  Marcas de LC: ${marcas.join(', ')}`);
    return marcas;
  } catch (error) {
    console.error('Error obteniendo marcas de LC:', error);
    return ['Acuvue', 'Air Optix', 'Biofinity', 'FreshLook'];
  }
}

async obtenerLiquidos() {
  try {
    const productos = await this.obtenerProductosDeSheet('Stock Liquidos');
    const liquidos = productos.map(p => ({
      marca: p.marca,
      tamano: p.tamano || p.descripcion || 'Consultar',
      precio: p.precio
    }));
    console.log(`🧴 Líquidos: ${liquidos.length} productos`);
    return liquidos;
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
