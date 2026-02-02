// src/services/verificacionService.ts
import api from './api';

export interface VerificacionRequest {
  IMEI: string;
}

export interface VerificacionResult {
  valido: boolean;
  mensaje: string;
  dispositivoId?: number;
  personaId?: number;
  personaNombre?: string;
  empresaId?: number;
  empresaNombre?: string;
  fechaRegistro?: string;
}

export interface RegistrarDispositivoDTO {
  IMEI: string;
  personaId: number;
}

export interface Dispositivo {
  id: number;
  imei: string;
  fechaRegistro: string;
  activo: boolean;
  personaId: number;
}

export interface Persona {
  id: number;
  nombre: string;
  identificacion: string;
  telefono?: string;
  empresaId: number;
  empresaNombre?: string;
  cantidadDispositivos: number;
}

export const verificacionService = {
  // Verificar IMEI
  verificarIMEI: async (imei: string): Promise<VerificacionResult> => {
    const response = await api.post('/verificacion/verificar', { IMEI: imei });
    return response.data;
  },

  // Registrar dispositivo
  registrarDispositivo: async (data: RegistrarDispositivoDTO): Promise<Dispositivo> => {
    const response = await api.post('/verificacion/registrar-dispositivo', data);
    return response.data;
  },

  // Obtener dispositivos por persona
  getDispositivosPorPersona: async (personaId: number): Promise<Dispositivo[]> => {
    const response = await api.get(`/verificacion/dispositivos/${personaId}`);
    return response.data;
  },

  // Obtener personas por empresa
  getPersonasPorEmpresa: async (empresaId: number): Promise<Persona[]> => {
    const response = await api.get(`/verificacion/personas/${empresaId}`);
    return response.data;
  }
};

// También crea un servicio para personas
export const personasService = {
  // Registrar persona
  registrarPersona: async (data: any) => {
    const response = await api.post('/verificacion/registrar-persona', data);
    return response.data;
  },

  // Obtener todas las personas (para select)
  getPersonas: async () => {
    const response = await api.get('/verificacion/personas');
    return response.data;
  }
};