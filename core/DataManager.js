// core/DataManager.js - VERSIÓN CORREGIDA
const { google } = require('googleapis');

class DataManager {
  constructor() {
    this.sheets = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('📊 Inicializando DataManager...');
    
    try {
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
      
      console.log('✅ DataManager conectado a Google Sheets');
      return true;
      
    } catch (error) {
      console.error('❌ Error conectando a Google Sheets:', error.message);
      return false;
    }
  }

  // SOLO DATOS REALES DE ARMAZONES
  async getArmazonesEnStock() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEETS_ARMAZONES,
        range: 'STOCK ARMAZONES 1!C4:T500',
      });

      const rows = response.data.values || [];
      console.log(`📦 Procesando ${rows.length} filas de armazones`);
      
      const armazones = [];
      const marcasEncontradas = new Set();
      
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
              marcasEncontradas.add(armazon.marca);
            }
          }
        }
      }
      
      console.log(`✅ ${armazones.length} armazones - Marcas: ${Array.from(marcasEncontradas).join(', ')}`);
      return armazones;
      
    } catch (error) {
      console.error('❌ Error obteniendo armazones:', error.message);
      return [];
    }
  }

  // MARCAS REALES DEL STOCK (NO INVENTADAS)
  async getMarcasReales() {
    const armazones = await this.getArmazonesEnStock();
    const marcas = [...new Set(armazones.map(a => a.marca))].filter(m => m);
    return marcas.sort();
  }

  // BUSCAR ARMAZONES POR MARCA ESPECÍFICA
  async buscarPorMarca(marcaBuscada) {
    const armazones = await this.getArmazonesEnStock();
    return armazones.filter(a => 
      a.marca.toLowerCase().includes(marcaBuscada.toLowerCase())
    );
  }

  // RANGO DE PRECIOS REAL (NO INVENTADO)
  async getRangoPreciosReal() {
    const armazones = await this.getArmazonesEnStock();
    const precios = armazones.map(a => a.precio).filter(p => p > 0);
    
    if (precios.length === 0) {
      return null; // No inventar precios
    }
    
    return {
      min: Math.min(...precios),
      max: Math.max(...precios)
    };
  }

  parsePrecio(precio) {
    if (!precio) return 0;
    const precioStr = precio.toString().replace(/[^\d.,]/g, '');
    const precioNum = parseFloat(precioStr.replace(',', '.'));
    return isNaN(precioNum) ? 0 : precioNum;
  }

  // LENTES DE CONTACTO - SOLO MARCAS, SIN ESPECIFICACIONES
  getMarcasLentesContacto() {
    return ['Acuvue', 'Biofinity', 'Air Optix'];
  }

  // COMBOS REALES
  getCombos() {
    return [
      {
        nombre: 'Kit Limpieza Básico',
        productos: ['Líquido limpieza 60ml', 'Paño microfibra premium'],
        precio: 9500
      },
      {
        nombre: 'Kit Estuche + Limpieza', 
        productos: ['Estuche plástico Hypnottica Folia negro', 'Líquido limpieza', 'Paño microfibra premium'],
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
}

module.exports = DataManager;
