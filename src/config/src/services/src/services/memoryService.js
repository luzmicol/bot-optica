class MemoryService {
  constructor() {
    this.memoriaUsuarios = new Map();
  }

  async obtenerContextoUsuario(senderId) {
    return this.memoriaUsuarios.get(senderId) || { 
      paso: 0, 
      datos: {}, 
      ultimaInteraccion: Date.now(),
      historial: [] 
    };
  }

  async guardarContextoUsuario(senderId, contexto) {
    contexto.ultimaInteraccion = Date.now();
    this.memoriaUsuarios.set(senderId, contexto);
  }
}

module.exports = new MemoryService();
