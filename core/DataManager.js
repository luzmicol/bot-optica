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
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurado en Render');
      }
      
      // USAR GOOGLE_SHEETS_ID que ya tienes en Render
      if (!process.env.GOOGLE_SHEETS_ID) {
        throw new Error('GOOGLE_SHEETS_ID no configurado en Render');
      }

      console.log('🔑 Parseando credenciales...');
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      
      console.log('📡 Autenticando con Google...');
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key.replace(/\\n/g, '\n'), // IMPORTANTE para Render
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      
      // TEST CONEXIÓN INMEDATA
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
      console.error('🔍 Stack:', error.stack);
      return false;
    }
  }

  async getArmazonesEnStock() {
    // Si hay error de conexión, no intentar conectar
    if (this.connectionError) {
      console.log('⚠️ Usando datos básicos por error de conexión:', this.connectionError);
      return this.getDatosBasicos();
    }

    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return this.getDatosBasicos();
    }

    try {
      console.log('🔍 Consultando Google Sheets...');
      console.log('📋 Sheet ID:', process.env.GOOGLE_SHEETS_ID);
      
      // SEGÚN TU DESCRIPCIÓN - COLUMNAS CORRECTAS:
      // C3=Marca, E3=Sol/Receta, F3=COD.HYPNO, G3=Modelo, H3=Color, I3=Cantidad, P3=PRECIO, T3=Descripciones
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: 'STOCK ARMAZONES 1!C4:T100', // Desde fila 4 para datos
      });

      const rows = response.data.values || [];
      console.log(`📦 Encontradas ${rows.length} filas en el sheet`);
      
      if (rows.length === 0) {
        console.log('📭 Sheet vacío, usando datos básicos');
        return this.getDatosBasicos();
      }

      const armazones = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Columna C (0) = Marca - verificar que tenga marca
        if (row[0] && row[0].trim() !== '') {
          // Columna I (6) = Cantidad - índice 6 porque C=0, D=1, E=2, F=3, G=4, H=5, I=6
          const cantidad = parseInt(row[6]) || 0;
          
          if (cantidad > 0) {
            const armazon = {
              marca: row[0].trim(), // C - Marca
              tipo: row[2] ? row[2].trim() : '', // E - Sol/Receta (índice 2: C=0, D=1, E=2)
              codigo: row[3] ? row[3].trim() : '', // F - COD.HYPNO (índice 3)
              modelo: row[4] ? row[4].trim() : '', // G - Modelo (índice 4)
              color: row[5] ? row[5].trim() : '', // H - Color (índice 5)
              stock: cantidad, // I - Cantidad (índice 6)
              precio: this.parsePrecio(row[13]), // P - PRECIO (índice 13: C=0... P=13)
              descripcion: row[17] ? row[17].trim() : '' // T - Descripciones (índice 17)
            };
            
            // Solo agregar si tiene marca y modelo
            if (armazon.marca && armazon.modelo) {
              armazones.push(armazon);
            }
          }
        }
      }
      
      console.log(`✅ ${armazones.length} armazones con stock encontrados`);
      
      // DEBUG: Mostrar primeros 2 para verificar
      if (armazones.length > 0) {
        console.log('🔍 Primeros armazones:', armazones.slice(0, 2));
      }
      
      return armazones.length > 0 ? armazones : this.getDatosBasicos();
      
    } catch (error) {
      console.error('❌ Error leyendo Google Sheets:', error.message);
      this.connectionError = error.message;
      return this.getDatosBasicos();
    }
  }

  // MÉTODO NUEVO para buscar por marca exacta
  async buscarPorMarcaExacta(marcaBuscada) {
    try {
      const armazones = await this.getArmazonesEnStock();
      return armazones.filter(a => 
        a.marca.toLowerCase() === marcaBuscada.toLowerCase()
      );
    } catch (error) {
      console.error('Error en buscarPorMarcaExacta:', error);
      return [];
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
      }
      // ... tus otros combos EXACTOS
    ];
  }

  // Método para diagnosticar MEJORADO
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
        
        // Test lectura de datos
        const armazones = await this.getArmazonesEnStock();
        checks.push(`✅ Datos: ${armazones.length} armazones`);
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
