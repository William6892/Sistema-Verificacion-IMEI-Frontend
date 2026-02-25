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
  // Obtener todas las personas - CORREGIDO
  getPersonas: async (): Promise<Persona[]> => {
    const response = await api.get('/api/personas');  
    return response.data;
  },

  // Obtener persona por ID - CORREGIDO
  getPersona: async (id: number): Promise<Persona> => {
    const response = await api.get(`/api/personas/${id}`);  
    return response.data;
  },

  // Obtener personas por empresa - CORREGIDO
  getPersonasPorEmpresa: async (empresaId: number): Promise<Persona[]> => {
    const response = await api.get(`/api/empresas/${empresaId}/personas`);  
    return response.data;
  },

  // Crear nueva persona - CORREGIDO
  createPersona: async (data: RegistrarPersonaDTO): Promise<Persona> => {
    const response = await api.post('/api/personas', data);  
    return response.data;
  },

  // Actualizar persona - CORREGIDO
  updatePersona: async (id: number, data: RegistrarPersonaDTO): Promise<Persona> => {
    const response = await api.put(`/api/personas/${id}`, data);  
    return response.data;
  },

  // Eliminar persona (soft delete) - CORREGIDO
  deletePersona: async (id: number): Promise<void> => {
    const response = await api.delete(`/api/personas/${id}`); 
    return response.data;
  },

  // Buscar personas por término - CORREGIDO
  buscarPersonas: async (searchTerm: string): Promise<Persona[]> => {
    const response = await api.get('/api/personas/buscar', { 
      params: { q: searchTerm }
    });
    return response.data;
  }
};

// También el servicio de verificación necesita corrección
export const verificacionService = {
  // Obtener personas por empresa - CORREGIDO
  getPersonasPorEmpresa: async (empresaId: number): Promise<Persona[]> => {
    const response = await api.get(`/api/verificacion/personas/${empresaId}`);  
    return response.data;
  },

  // Registrar dispositivo - CORREGIDO
  registrarDispositivo: async (data: any) => {
    const response = await api.post('/api/verificacion/registrar-dispositivo', data);  
    return response.data;
  },

  // Verificar IMEI - CORREGIDO
  verificarIMEI: async (imei: string): Promise<any> => {
    const response = await api.post('/api/verificacion/verificar', { IMEI: imei });  
    return response.data;
  }
};