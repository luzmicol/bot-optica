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
      // Verificar que existan las variables de entorno
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurado');
      }
      
      if (!process.env.SHEETS_ARMAZONES) {
        throw new Error('SHEETS_ARMAZONES no configurado');
      }

      // Parseo seguro y normalizo saltos de línea en private_key
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      let credentials;
      try {
        credentials = JSON.parse(raw);
      } catch (e) {
        throw new Error('No se pudo parsear GOOGLE_SERVICE_ACCOUNT_JSON: ' + e.message);
      }

      if (credentials.private_key && typeof credentials.private_key === 'string') {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      }

      // Instancio GoogleAuth y obtengo cliente
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const client = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: client });
      this.initialized = true;
      this.connectionError = null;
      
      console.log('✅ DataManager conectado a Google Sheets');
      return true;
      
    } catch (error) {
      this.initialized = false;
      this.connectionError = error.message || String(error);
      console.error('❌ Error conectando a Google Sheets:', this.connectionError);
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
        
        // row[0] -> columna C (Marca)
        if (row[0] && row[0].toString().trim() !== '') {
          // row[6] -> columna I (Cantidad)
          const cantidad = parseInt(row[6]) || 0;
          
          if (cantidad > 0) {
            const armazon = {
              marca: row[0] ? row[0].toString().trim() : '',
              codigo: row[3] ? row[3].toString().trim() : '', // F -> COD. HYPNO
              modelo: row[4] ? row[4].toString().trim() : '', // G -> Modelo
              color: row[5] ? row[5].toString().trim() : '',  // H -> Color
              stock: cantidad,
              precio: this.parsePrecio(row[13]),             // P -> Precio
              descripcion: row[17] ? row[17].toString().trim() : '' // T -> Descripcion
            };
            
            if (armazon.marca && armazon.modelo) {
              armazones.push(armazon);
            } else {
              // si falta modelo o marca, lo registro para debug pero no lo devuelvo
              console.log(`⚠️ Fila ${i + 4}: datos incompletos (marca/modelo) — se ignora`);
            }
          }
        }
      }
      
      console.log(`✅ ${armazones.length} armazones con stock`);
      return armazones.length > 0 ? armazones : this.getDatosBasicos();
      
    } catch (error) {
      console.error('❌ Error leyendo Google Sheets:', error.message || error);
      this.connectionError = error.message || String(error);
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
        a.marca && a.marca.toLowerCase().includes(marcaBuscada.toLowerCase())
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

  // Nuevo: Método que usa el stock real para devolver rango de precios
  async getRangoPreciosReal() {
    try {
      const armazones = await this.getArmazonesEnStock();
      const precios = armazones.map(a => Number(a.precio)).filter(p => !isNaN(p) && p > 0);
      if (precios.length === 0) return null;
      return { min: Math.min(...precios), max: Math.max(...precios) };
    } catch (error) {
      return null;
    }
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
