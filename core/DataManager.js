// core/DataManager.js - VERSIÓN MEJORADA
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
      // VERIFICACIÓN MEJORADA - USAR SHEETS_ARMAZONES
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurado');
      }
      
      if (!process.env.SHEETS_ARMAZONES) {
        throw new Error('SHEETS_ARMAZONES no configurado - usa el ID específico del sheet de armazones');
      }

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
      
      // TEST CONEXIÓN CON SHEET CORRECTO
      console.log('🧪 Probando conexión con sheet de armazones...');
      await this.sheets.spreadsheets.get({
        spreadsheetId: process.env.SHEETS_ARMAZONES
      });
      
      this.initialized = true;
      this.connectionError = null;
      
      console.log('✅ DataManager CONECTADO a Google Sheets (Armazones)');
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
      console.log('📋 Sheet ID Armazones:', process.env.SHEETS_ARMAZONES);
      
      // RANGO AMPLIADO para leer ~700 filas
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEETS_ARMAZONES,
        range: 'STOCK ARMAZONES 1!C4:T700', // 👈 CAMBIADO A 700 FILAS
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
      
      // DEBUG: Mostrar distribución de marcas
      const marcasCount = {};
      armazones.forEach(a => {
        marcasCount[a.marca] = (marcasCount[a.marca] || 0) + 1;
      });
      console.log('🏷️ Distribución por marcas:', marcasCount);
      
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

  // Resto de los métodos se mantienen igual...
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
    return ['Acuvue Oasis', 'Biofinity', 'Air Optix'];
  }

  // DIAGNÓSTICO ACTUALIZADO
  async diagnosticarConexion() {
    const checks = [];
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      checks.push('❌ GOOGLE_SERVICE_ACCOUNT_JSON no configurado');
    } else {
      checks.push('✅ GOOGLE_SERVICE_ACCOUNT_JSON configurado');
    }
    
    if (!process.env.SHEETS_ARMAZONES) {
      checks.push('❌ SHEETS_ARMAZONES no configurado');
    } else {
      checks.push('✅ SHEETS_ARMAZONES configurado');
    }

    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      if (!credentials.client_email) checks.push('❌ client_email faltante');
      else checks.push('✅ client_email OK');
      
      if (!credentials.private_key) checks.push('❌ private_key faltante');
      else checks.push('✅ private_key OK');
      
    } catch (error) {
      checks.push(`❌ Error parseando credenciales: ${error.message}`);
    }

    try {
      if (this.initialized) {
        const test = await this.sheets.spreadsheets.get({
          spreadsheetId: process.env.SHEETS_ARMAZONES
        });
        checks.push('✅ Conexión a Sheets Armazones OK');
        
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
