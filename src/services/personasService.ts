// src/services/personasService.ts - VERSIÓN CORREGIDA
import api from './api';

export interface Persona {
  id: number;
  nombre: string;
  identificacion: string;
  telefono?: string;
  email?: string;
  empresaId: number;
  empresaNombre?: string;
  cantidadDispositivos?: number;
  activo?: boolean;
  fechaCreacion?: string;
}

export interface RegistrarPersonaDTO {
  nombre: string;
  identificacion: string;
  telefono?: string;
  email?: string;
  empresaId: number;
}

export const personasService = {
  // Obtener todas las personas
  getPersonas: async (): Promise<Persona[]> => {
    const response = await api.get('/personas');
    return response.data;
  },

  // Obtener persona por ID
  getPersona: async (id: number): Promise<Persona> => {
    const response = await api.get(`/personas/${id}`);
    return response.data;
  },

  // Obtener personas por empresa (¡AGREGA ESTE MÉTODO!)
  getPersonasPorEmpresa: async (empresaId: number): Promise<Persona[]> => {
    const response = await api.get(`/empresas/${empresaId}/personas`);
    return response.data;
  },

  // Crear nueva persona
  createPersona: async (data: RegistrarPersonaDTO): Promise<Persona> => {
    const response = await api.post('/personas', data);
    return response.data;
  },

  // Actualizar persona
  updatePersona: async (id: number, data: RegistrarPersonaDTO): Promise<Persona> => {
    const response = await api.put(`/personas/${id}`, data);
    return response.data;
  },

  // Eliminar persona (soft delete)
  deletePersona: async (id: number): Promise<void> => {
    const response = await api.delete(`/personas/${id}`);
    return response.data;
  },

  // Buscar personas por término
  buscarPersonas: async (searchTerm: string): Promise<Persona[]> => {
    const response = await api.get('/personas/buscar', {
      params: { q: searchTerm }
    });
    return response.data;
  }
};

// También puedes crear un servicio combinado para verificación si prefieres
export const verificacionService = {
  // Obtener personas por empresa (para el formulario de dispositivos)
  getPersonasPorEmpresa: async (empresaId: number): Promise<Persona[]> => {
    const response = await api.get(`/verificacion/personas/${empresaId}`);
    return response.data;
  },

  // Registrar dispositivo
  registrarDispositivo: async (data: any) => {
    const response = await api.post('/verificacion/registrar-dispositivo', data);
    return response.data;
  },

  // Verificar IMEI
  verificarIMEI: async (imei: string): Promise<any> => {
    const response = await api.post('/verificacion/verificar', { IMEI: imei });
    return response.data;
  }
};