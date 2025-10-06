// core/DataManager.js - VERSIÓN CORREGIDA
const { google } = require('googleapis');

class DataManager {
  constructor() {
    this.sheets = null;
    this.initialized = false;
    this.connectionError = null;
  }

  async initialize() {
    if (this.initialized) return true;
    
    console.log('📊 Inicializando DataManager...');
    
    try {
      // VERIFICACIÓN MEJORADA
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurado');
      }
      
      // USAR GOOGLE_SHEETS_ID para el ID del documento
      if (!process.env.GOOGLE_SHEETS_ID) {
        throw new Error('GOOGLE_SHEETS_ID no configurado');
      }

      // SHEETS_ARMAZONES es el nombre de la hoja (ya lo tienes como "STOCK ARMAZONES 1")
      const sheetName = process.env.SHEETS_ARMAZONES || 'STOCK ARMAZONES 1';
      console.log('📋 Nombre de hoja:', sheetName);

      console.log('🔑 Parseando credenciales...');
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      
      console.log('📡 Autenticando con Google...');
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      
      // TEST CONEXIÓN CON GOOGLE_SHEETS_ID
      console.log('🧪 Probando conexión...');
      await this.sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID
      });
      
      this.initialized = true;
      this.connectionError = null;
      
      console.log('✅ DataManager CONECTADO a Google Sheets');
      return true;
      
    } catch (error) {
      this.connectionError = error.message;
      console.error('❌ Error crítico en DataManager:', error.message);
      return false;
    }
  }

  async getArmazonesEnStock() {
    if (this.connectionError) {
      console.log('⚠️ Usando datos básicos por error de conexión');
      return this.getDatosBasicos();
    }

    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return this.getDatosBasicos();
    }

    try {
      console.log('🔍 Consultando TODOS los armazones en Google Sheets...');
      
      // USAR GOOGLE_SHEETS_ID para el documento y SHEETS_ARMAZONES para el nombre de la hoja
      const sheetName = process.env.SHEETS_ARMAZONES || 'STOCK ARMAZONES 1';
      const range = `${sheetName}!C4:T700`;
      
      console.log('📋 Documento ID:', process.env.GOOGLE_SHEETS_ID);
      console.log('📄 Rango:', range);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,  // ID del documento
        range: range,  // Hoja específica + rango
      });

      const rows = response.data.values || [];
      console.log(`📦 Encontradas ${rows.length} filas en total`);
      
      if (rows.length === 0) {
        console.log('📭 Sheet vacío, usando datos básicos');
        return this.getDatosBasicos();
      }

      const armazones = [];
      let filasConDatos = 0;
      let filasConStock = 0;
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Verificar que tenga marca (columna C)
        if (row[0] && row[0].trim() !== '') {
          filasConDatos++;
          
          // Columna I (6) = Cantidad
          const cantidad = parseInt(row[6]) || 0;
          
          if (cantidad > 0) {
            filasConStock++;
            const armazon = {
              marca: row[0].trim(), // C - Marca
              tipo: row[2] ? row[2].trim() : '', // E - Sol/Receta
              codigo: row[3] ? row[3].trim() : '', // F - COD.HYPNO
              modelo: row[4] ? row[4].trim() : '', // G - Modelo
              color: row[5] ? row[5].trim() : '', // H - Color
              stock: cantidad, // I - Cantidad
              precio: this.parsePrecio(row[13]), // P - PRECIO
              descripcion: row[17] ? row[17].trim() : '' // T - Descripciones
            };
            
            // Solo agregar si tiene marca y modelo
            if (armazon.marca && armazon.modelo) {
              armazones.push(armazon);
            }
          }
        }
      }
      
      console.log(`📊 Estadísticas:`);
      console.log(`   - Filas totales: ${rows.length}`);
      console.log(`   - Filas con datos: ${filasConDatos}`);
      console.log(`   - Filas con stock > 0: ${filasConStock}`);
      console.log(`   - Armazones válidos: ${armazones.length}`);
      
      // DEBUG: Mostrar distribución de marcas (solo si hay datos)
      if (armazones.length > 0) {
        const marcasCount = {};
        armazones.forEach(a => {
          marcasCount[a.marca] = (marcasCount[a.marca] || 0) + 1;
        });
        console.log('🏷️ Distribución por marcas:', marcasCount);
      }
      
      return armazones.length > 0 ? armazones : this.getDatosBasicos();
      
    } catch (error) {
      console.error('❌ Error leyendo Google Sheets:', error.message);
      this.connectionError = error.message;
      return this.getDatosBasicos();
    }
  }

  // MÉTODO NUEVO para ver estadísticas completas
  async getEstadisticasCompletas() {
    try {
      const armazones = await this.getArmazonesEnStock();
      const marcas = [...new Set(armazones.map(a => a.marca))].filter(m => m);
      
      const estadisticas = {
        total_armazones: armazones.length,
        total_marcas: marcas.length,
        marcas: marcas.sort(),
        stock_total: armazones.reduce((sum, a) => sum + a.stock, 0),
        precio_promedio: Math.round(armazones.reduce((sum, a) => sum + a.precio, 0) / armazones.length) || 0
      };
      
      return estadisticas;
    } catch (error) {
      console.error('Error en getEstadisticasCompletas:', error);
      return { error: error.message };
    }
  }

  // Datos básicos MEJORADOS - SOLO DATOS REALES
  getDatosBasicos() {
    return [
      {
        marca: 'Vulk',
        modelo: 'Consulta en local',
        color: 'Varios colores',
        stock: 1,
        precio: 0,
        descripcion: 'Stock actualizado en óptica'
      }
    ];
  }

  async getMarcasReales() {
    try {
      const armazones = await this.getArmazonesEnStock();
      const marcas = [...new Set(armazones.map(a => a.marca))].filter(m => m && m.trim() !== '');
      
      console.log(`🏷️ Marcas encontradas: ${marcas.length}`);
      
      return marcas.length > 0 ? marcas.sort() : ['Vulk', 'Sarkany'];
    } catch (error) {
      console.error('Error en getMarcasReales:', error);
      return ['Vulk', 'Sarkany'];
    }
  }

  async buscarPorMarca(marcaBuscada) {
    try {
      const armazones = await this.getArmazonesEnStock();
      const resultados = armazones.filter(a => 
        a.marca.toLowerCase().includes(marcaBuscada.toLowerCase())
      );
      
      console.log(`🔍 Búsqueda "${marcaBuscada}": ${resultados.length} resultados`);
      return resultados;
    } catch (error) {
      console.error('Error en buscarPorMarca:', error);
      return [];
    }
  }

  parsePrecio(precio) {
    if (!precio) return 0;
    const precioStr = precio.toString().replace(/[^\d.,]/g, '');
    const precioNum = parseFloat(precioStr.replace(',', '.'));
    return isNaN(precioNum) ? 0 : Math.round(precioNum);
  }

  getMarcasLentesContacto() {
    return ['Acuvue Oasis', 'Biofinity', 'Air Optix']; // EXACTAMENTE como dijiste
  }

  getCombos() {
    return [
      {
        nombre: 'Kit Limpieza Básico',
        productos: ['Líquido limpieza 60ml', 'Paño microfibra premium'],
        precio: 9500
      },
      {
        nombre: 'Kit Estuche + Limpieza', 
        productos: ['Estuche plástico', 'Líquido limpieza', 'Paño microfibra'],
        precio: 12500
      },
      {
        nombre: 'Kit Viaje / Bolsillo',
        productos: ['Estuche plástico pequeño', 'Paño microfibra', 'Cordón tanza elástico'],
        precio: 10500
      },
      {
        nombre: 'Kit Premium / Regalo',
        productos: ['Estuche Origami', 'Estuche LC', 'Líquido de limpieza', 'Paño microfibra', 'Cordón neoprene'],
        precio: 40000
      },
      {
        nombre: 'Combo Deportivo / Outdoor',
        productos: ['Estuche premium', 'Cordón flotador', 'Cordón ajustador', 'Líquido limpieza'],
        precio: 45000
      }
    ];
  }

  // DIAGNÓSTICO ACTUALIZADO
  async diagnosticarConexion() {
    const checks = [];
    
    // Check 1: Variables de entorno
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      checks.push('❌ GOOGLE_SERVICE_ACCOUNT_JSON no configurado');
    } else {
      checks.push('✅ GOOGLE_SERVICE_ACCOUNT_JSON configurado');
    }
    
    if (!process.env.GOOGLE_SHEETS_ID) {
      checks.push('❌ GOOGLE_SHEETS_ID no configurado');
    } else {
      checks.push('✅ GOOGLE_SHEETS_ID configurado');
    }

    if (!process.env.SHEETS_ARMAZONES) {
      checks.push('⚠️ SHEETS_ARMAZONES no configurado (usando nombre por defecto)');
    } else {
      checks.push(`✅ SHEETS_ARMAZONES configurado: "${process.env.SHEETS_ARMAZONES}"`);
    }

    // Check 2: Credenciales válidas
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      if (!credentials.client_email) checks.push('❌ client_email faltante');
      else checks.push('✅ client_email OK');
      
      if (!credentials.private_key) checks.push('❌ private_key faltante');
      else checks.push('✅ private_key OK');
      
    } catch (error) {
      checks.push(`❌ Error parseando credenciales: ${error.message}`);
    }

    // Check 3: Conexión real
    try {
      if (this.initialized) {
        const test = await this.sheets.spreadsheets.get({
          spreadsheetId: process.env.GOOGLE_SHEETS_ID
        });
        checks.push('✅ Conexión a Sheets OK');
        
        const armazones = await this.getArmazonesEnStock();
        checks.push(`✅ Datos: ${armazones.length} armazones con stock`);
        
        const estadisticas = await this.getEstadisticasCompletas();
        checks.push(`🏷️ Marcas detectadas: ${estadisticas.total_marcas}`);
        
      } else {
        checks.push('🔄 DataManager no inicializado');
      }
    } catch (error) {
      checks.push(`❌ Error conexión: ${error.message}`);
    }

    return checks.join('\n');
  }
}

module.exports = DataManager;
