const { google } = require('googleapis');

class DataManager {
  constructor() {
    this.sheets = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('📊 Inicializando DataManager con Google Sheets...');
    
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
      
      console.log('✅ DataManager conectado a Google Sheets API');
      
    } catch (error) {
      console.error('❌ Error conectando a Google Sheets:', error.message);
      throw error;
    }
  }

  // OBTENER TODOS LOS ARMAZONES EN STOCK
  async getArmazonesEnStock() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEETS_ARMAZONES,
        range: 'STOCK ARMAZONES 1!C4:T500', // Desde fila 4 hasta 500
      });

      const rows = response.data.values || [];
      console.log(`📦 Encontrados ${rows.length} armazones en el sheet`);
      
      const armazones = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // C=0(Marca), E=2(Sol/Receta), F=3(Codigo), G=4(Modelo), H=5(Color), I=6(Cantidad), P=13(Precio), T=17(Descripcion)
        if (row[0] && row[0].trim() !== '') { // Si tiene marca
          const cantidad = parseInt(row[6]) || 0;
          
          if (cantidad > 0) { // Solo los que tienen stock
            const armazon = {
              marca: row[0].trim(),
              tipo: row[2] ? row[2].trim() : '',
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
      return armazones;
      
    } catch (error) {
      console.error('❌ Error obteniendo armazones:', error.message);
      return [];
    }
  }

  // OBTENER MARCAS DISPONIBLES
  async getMarcasDisponibles() {
    const armazones = await this.getArmazonesEnStock();
    const marcas = [...new Set(armazones.map(a => a.marca))].filter(m => m);
    return marcas.sort();
  }

  // BUSCAR ARMAZONES POR MARCA
  async buscarArmazonesPorMarca(marca) {
    const armazones = await this.getArmazonesEnStock();
    return armazones.filter(a => 
      a.marca.toLowerCase().includes(marca.toLowerCase())
    );
  }

  // BUSCAR ARMAZONES POR TEXTO
  async buscarArmazones(query) {
    const armazones = await this.getArmazonesEnStock();
    const queryLower = query.toLowerCase();
    
    return armazones.filter(a => 
      a.marca.toLowerCase().includes(queryLower) ||
      a.modelo.toLowerCase().includes(queryLower) ||
      a.color.toLowerCase().includes(queryLower) ||
      (a.descripcion && a.descripcion.toLowerCase().includes(queryLower))
    );
  }

  parsePrecio(precio) {
    if (!precio) return 0;
    const precioStr = precio.toString().replace(/[^\d.,]/g, '');
    const precioNum = parseFloat(precioStr.replace(',', '.'));
    return isNaN(precioNum) ? 0 : precioNum;
  }

  // DATOS FIJOS DE LENTES DE CONTACTO
  getLentesContacto() {
    return [
      { marca: 'Acuvue Oasis', tipos: ['Mensuales', 'Diarios'], precio: 15000 },
      { marca: 'Biofinity', tipos: ['Mensuales'], precio: 18000 },
      { marca: 'Air Optix', tipos: ['Mensuales'], precio: 20000 }
    ];
  }

  // DATOS FIJOS DE LÍQUIDOS
  getLiquidos() {
    return [
      { producto: 'Solución Multiuso', marcas: ['Renu', 'Opti-Free'], precio: 5000 },
      { producto: 'Gotas Humectantes', marcas: ['Systane', 'Blink'], precio: 3500 },
      { producto: 'Peróxido', marcas: ['Ao Sept', 'Clear Care'], precio: 7000 }
    ];
  }

  // COMBOS PREDEFINIDOS (para después)
  getCombos() {
    return [
      {
        nombre: 'Kit Inicio Lentes Contacto',
        productos: ['Lentes mensuales', 'Solución multiuso', 'Estuche', 'Gotas humectantes'],
        precio: 25000,
        imagen: 'https://ejemplo.com/kit-inicio.jpg' // URL de imagen
      },
      {
        nombre: 'Combo Mantenimiento', 
        productos: ['2 soluciones multiuso', 'Gotas humectantes'],
        precio: 12000,
        imagen: 'https://ejemplo.com/combo-mantenimiento.jpg'
      }
    ];
  }
}

module.exports = DataManager;
