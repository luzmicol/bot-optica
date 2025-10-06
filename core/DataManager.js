// core/DataManager.js - ARCHIVO COMPLETO
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
      // Verificar que existan las variables de entorno
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurado');
      }
      
      if (!process.env.SHEETS_ARMAZONES) {
        throw new Error('SHEETS_ARMAZONES no configurado');
      }

      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.initialized = true;
      this.connectionError = null;
      
      console.log('✅ DataManager conectado a Google Sheets');
      return true;
      
    } catch (error) {
      this.connectionError = error.message;
      console.error('❌ Error conectando a Google Sheets:', error.message);
      return false;
    }
  }

  async getArmazonesEnStock() {
    // Si hay error de conexión, no intentar conectar
    if (this.connectionError) {
      console.log('⚠️ Usando datos básicos por error de conexión');
      return this.getDatosBasicos();
    }

    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return this.getDatosBasicos();
    }

    try {
      console.log('🔍 Consultando Google Sheets...');
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEETS_ARMAZONES,
        range: 'STOCK ARMAZONES 1!C4:T100',
      });

      const rows = response.data.values || [];
      console.log(`📦 Encontradas ${rows.length} filas`);
      
      if (rows.length === 0) {
        console.log('📭 Sheet vacío, usando datos básicos');
        return this.getDatosBasicos();
      }

      const armazones = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        if (row[0] && row[0].trim() !== '') {
          const cantidad = parseInt(row[6]) || 0;
          
          if (cantidad > 0) {
            const armazon = {
              marca: row[0].trim(),
              codigo: row[3] ? row[3].trim() : '',
              modelo: row[4] ? row[4].trim() : '',
              color: row[5] ? row[5].trim() : '',
              stock: cantidad,
              precio: this.parsePrecio(row[13]),
              descripcion: row[17] ? row[17].trim() : ''
            };
            
            if (armazon.marca && armazon.modelo) {
              armazones.push(armazon);
            }
          }
        }
      }
      
      console.log(`✅ ${armazones.length} armazones con stock`);
      return armazones.length > 0 ? armazones : this.getDatosBasicos();
      
    } catch (error) {
      console.error('❌ Error leyendo Google Sheets:', error.message);
      this.connectionError = error.message;
      return this.getDatosBasicos();
    }
  }

  // Datos básicos para cuando falle la conexión
  getDatosBasicos() {
    return [
      {
        marca: 'Vulk',
        modelo: 'Modelo Básico',
        color: 'Negro',
        stock: 1,
        precio: 55000,
        descripcion: 'Consulta stock actualizado en la óptica'
      }
    ];
  }

  async getMarcasReales() {
    try {
      const armazones = await this.getArmazonesEnStock();
      const marcas = [...new Set(armazones.map(a => a.marca))].filter(m => m);
      return marcas.length > 0 ? marcas : ['Vulk', 'Sarkany'];
    } catch (error) {
      return ['Vulk', 'Sarkany'];
    }
  }

  async buscarPorMarca(marcaBuscada) {
    try {
      const armazones = await this.getArmazonesEnStock();
      return armazones.filter(a => 
        a.marca.toLowerCase().includes(marcaBuscada.toLowerCase())
      );
    } catch (error) {
      return this.getDatosBasicos();
    }
  }

  parsePrecio(precio) {
    if (!precio) return 0;
    const precioStr = precio.toString().replace(/[^\d.,]/g, '');
    const precioNum = parseFloat(precioStr.replace(',', '.'));
    return isNaN(precioNum) ? 0 : precioNum;
  }

  getMarcasLentesContacto() {
    return ['Acuvue', 'Biofinity', 'Air Optix'];
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

  // Método para diagnosticar la conexión
  async diagnosticarConexion() {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return '❌ GOOGLE_SERVICE_ACCOUNT_JSON no configurado';
    }
    
    if (!process.env.SHEETS_ARMAZONES) {
      return '❌ SHEETS_ARMAZONES no configurado';
    }

    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      if (!credentials.client_email || !credentials.private_key) {
        return '❌ Credenciales de Google incompletas';
      }
      
      return '✅ Variables de entorno OK';
    } catch (error) {
      return `❌ Error parseando credenciales: ${error.message}`;
    }
  }
}

module.exports = DataManager;
