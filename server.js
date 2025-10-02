require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const BaseBot = require('./core/BaseBot');
const HYPNOTTICA_CONFIG = require('./businesses/hypnottica/config');

class HypnotticaFramework {
  constructor() {
    this.app = express();
    this.bot = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'Hypnottica AI Framework',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        business: 'hypnottica',
        features: [
          'google-sheets-integration',
          'context-management', 
          'product-catalog',
          'multi-intent-handling'
        ]
      });
    });

    // Business info
    this.app.get('/api/business', (req, res) => {
      res.json({
        business: HYPNOTTICA_CONFIG,
        endpoints: {
          chat: 'POST /api/chat',
          health: 'GET /health',
          business: 'GET /api/business'
        }
      });
    });

    // Main chat endpoint
    this.app.post('/api/chat', async (req, res) => {
      try {
        const { userId, message, channel = 'web' } = req.body;

        if (!userId || !message) {
          return res.status(400).json({
            success: false,
            error: 'Se requieren userId y message'
          });
        }

        console.log(`💬 Chat request - User: ${userId}, Channel: ${channel}`);

        // Asegurar que el bot esté inicializado
        if (!this.bot) {
          this.bot = new BaseBot(HYPNOTTICA_CONFIG);
          await this.bot.initialize();
        }

        const response = await this.bot.processMessage(userId, message);

        // Analytics básico
        this.trackInteraction(userId, message, response, channel);

        res.json({
          success: true,
          response,
          business: 'hypnottica',
          timestamp: new Date().toISOString(),
          context: {
            userId,
            channel,
            messageLength: message.length
          }
        });

      } catch (error) {
        console.error('❌ Error en endpoint /api/chat:', error);
        
        res.status(500).json({
          success: false,
          response: "⚠️ Estoy teniendo dificultades técnicas. Por favor, intentá nuevamente en unos momentos.",
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Endpoint para probar conexión con Google Sheets
    this.app.get('/api/test-sheets', async (req, res) => {
      try {
        if (!this.bot) {
          this.bot = new BaseBot(HYPNOTTICA_CONFIG);
          await this.bot.initialize();
        }

        const armazones = await this.bot.dataManager.getProducts('armazones');
        const lentesContacto = await this.bot.dataManager.getProducts('lentes_contacto');
        const liquidos = await this.bot.dataManager.getProducts('liquidos');

        res.json({
          success: true,
          sheets: {
            armazones: {
              count: armazones.length,
              sample: armazones.slice(0, 3)
            },
            lentes_contacto: {
              count: lentesContacto.length,
              sample: lentesContacto.slice(0, 3)
            },
            liquidos: {
              count: liquidos.length,
              sample: liquidos.slice(0, 3)
            }
          }
        });

      } catch (error) {
        console.error('Error testing sheets:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        availableEndpoints: {
          'GET /health': 'Health check del sistema',
          'GET /api/business': 'Información del negocio',
          'POST /api/chat': 'Endpoint principal de chat',
          'GET /api/test-sheets': 'Probar conexión con Google Sheets'
        }
      });
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      console.error('🚨 Error no manejado:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      });
    });
  }

  trackInteraction(userId, message, response, channel) {
    // Analytics básico - en Fase 2 será más avanzado
    console.log(`📊 Analytics - User: ${userId}, Channel: ${channel}, Message: ${message.substring(0, 50)}...`);
  }

  async start() {
    try {
      // Inicializar el bot
      this.bot = new BaseBot(HYPNOTTICA_CONFIG);
      await this.bot.initialize();

      const PORT = process.env.PORT || 3000;
      
      this.app.listen(PORT, () => {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 HYPNOTTICA AI FRAMEWORK INICIADO CORRECTAMENTE');
        console.log('='.repeat(60));
        console.log(`📍 Puerto: ${PORT}`);
        console.log(`🏢 Negocio: ${HYPNOTTICA_CONFIG.name}`);
        console.log(`🤖 Bot: ${HYPNOTTICA_CONFIG.personality.name}`);
        console.log(`📊 Fuentes de datos: Google Sheets (${Object.keys(HYPNOTTICA_CONFIG.dataSources).length} sheets)`);
        console.log(`🌐 Entornos: ${process.env.NODE_ENV || 'development'}`);
        console.log('='.repeat(60));
        console.log('\n📋 Endpoints disponibles:');
        console.log(`   GET  /health          - Health check`);
        console.log(`   GET  /api/business    - Información del negocio`);
        console.log(`   POST /api/chat        - Chat principal`);
        console.log(`   GET  /api/test-sheets - Probar conexión Sheets`);
        console.log('\n💡 Ejemplo de uso:');
        console.log(`   curl -X POST http://localhost:${PORT}/api/chat \\`);
        console.log(`        -H "Content-Type: application/json" \\`);
        console.log(`        -d '{"userId": "test-user", "message": "Hola"}'`);
        console.log('\n');
      });

    } catch (error) {
      console.error('❌ Error iniciando el framework:', error);
      process.exit(1);
    }
  }
}

// Iniciar la aplicación
const framework = new HypnotticaFramework();
framework.start();

module.exports = framework.app;
