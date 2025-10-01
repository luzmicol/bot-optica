// src/services/memoryService.js

class MemoryService {
  constructor() {
    this.memoria = new Map();
  }

  async obtenerContextoUsuario(userId) {
    return this.memoria.get(userId) || { paso: 0, historial: [] };
  }

  async guardarContextoUsuario(userId, contexto) {
    this.memoria.set(userId, contexto);
  }
}

module.exports = MemoryService;
