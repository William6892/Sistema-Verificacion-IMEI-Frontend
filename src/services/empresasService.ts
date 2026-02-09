// src/services/empresasService.ts - VERSIÓN FINAL
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
  // Obtener todas las empresas - SOLO LA RUTA QUE FUNCIONA
  getEmpresas: async (): Promise<Empresa[]> => {
    console.log('🔍 Obteniendo empresas desde /api/empresas...');
    const response = await api.get('/api/empresas');
    return response.data;
  },

  // Obtener empresa por ID
  getEmpresa: async (id: number): Promise<Empresa> => {
    const response = await api.get(`/api/empresas/${id}`);
    return response.data;
  },

  // Crear nueva empresa
  createEmpresa: async (nombre: string): Promise<any> => {
    const response = await api.post('/api/empresas', { nombre });
    return response.data;
  },

  // Actualizar empresa
  updateEmpresa: async (id: number, nombre: string): Promise<any> => {
    const response = await api.put(`/api/empresas/${id}`, { nombre });
    return response.data;
  },

  // Eliminar empresa
  deleteEmpresa: async (id: number): Promise<any> => {
    const response = await api.delete(`/api/empresas/${id}`);
    return response.data;
  },

  // Obtener personas de una empresa
  getPersonasEmpresa: async (empresaId: number): Promise<PersonaEmpresa[]> => {
    const response = await api.get(`/api/empresas/${empresaId}/personas`);
    return response.data;
  }
};