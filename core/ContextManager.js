class ContextManager {
  constructor() {
    // Por ahora en memoria (en Fase 2 será Redis)
    this.userContexts = new Map();
  }

  getContext(userId) {
    if (!this.userContexts.has(userId)) {
      this.userContexts.set(userId, {
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        conversationHistory: [],
        currentIntent: null,
        slots: {},
        businessContext: {}
      });
    }

    const context = this.userContexts.get(userId);
    context.updatedAt = Date.now();
    
    return context;
  }

  updateContext(userId, updates) {
    const context = this.getContext(userId);
    
    // Merge de las actualizaciones
    Object.assign(context, updates, {
      updatedAt: Date.now()
    });
    
    this.userContexts.set(userId, context);
    
    // Limpieza automática de contextos viejos (24 horas)
    this.cleanOldContexts();
    
    return context;
  }

  addToHistory(userId, userMessage, botResponse) {
    const context = this.getContext(userId);
    
    context.conversationHistory.push({
      user: userMessage,
      bot: botResponse,
      timestamp: Date.now()
    });

    // Mantener solo últimos 50 mensajes
    if (context.conversationHistory.length > 50) {
      context.conversationHistory = context.conversationHistory.slice(-50);
    }

    this.userContexts.set(userId, context);
  }

  cleanOldContexts() {
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    for (const [userId, context] of this.userContexts.entries()) {
      if (now - context.updatedAt > TWENTY_FOUR_HOURS) {
        this.userContexts.delete(userId);
      }
    }
  }

  // Para futura integración con Redis
  async saveToRedis(userId, context) {
    // En Fase 2 implementaremos Redis
    return Promise.resolve();
  }

  async loadFromRedis(userId) {
    // En Fase 2 implementaremos Redis
    return null;
  }
}

module.exports = ContextManager;
