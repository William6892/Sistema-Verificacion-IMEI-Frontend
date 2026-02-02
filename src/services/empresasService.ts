// src/services/empresasService.ts - VERSIÓN SIMPLE
import api from './api';

export interface Empresa {
  id: number;
  nombre: string;
  fechaCreacion: string;
}

export interface PersonaEmpresa {
  id: number;
  nombre: string;
  identificacion: string;
  email?: string;
  telefono?: string;
  cantidadDispositivos: number;
}

export const empresasService = {
  // Obtener todas las empresas
  getEmpresas: async (): Promise<Empresa[]> => {
    const response = await api.get('/empresas');
    return response.data;
  },

  // Obtener empresa por ID
  getEmpresa: async (id: number): Promise<Empresa> => {
    const response = await api.get(`/empresas/${id}`);
    return response.data;
  },

  // Crear nueva empresa - acepta string directamente
  createEmpresa: async (nombre: string): Promise<any> => {
    const response = await api.post('/empresas', { nombre });
    return response.data;
  },

  // Actualizar empresa - acepta string directamente
  updateEmpresa: async (id: number, nombre: string): Promise<any> => {
    const response = await api.put(`/empresas/${id}`, { nombre });
    return response.data;
  },

  // Eliminar empresa
  deleteEmpresa: async (id: number): Promise<any> => {
    const response = await api.delete(`/empresas/${id}`);
    return response.data;
  },

  // Obtener personas de una empresa
  getPersonasEmpresa: async (empresaId: number): Promise<PersonaEmpresa[]> => {
    const response = await api.get(`/empresas/${empresaId}/personas`);
    return response.data;
  }
};