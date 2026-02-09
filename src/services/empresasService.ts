// src/services/empresasService.ts - VERSIÓN CORREGIDA
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
  // Obtener todas las empresas - CON PRUEBA DE RUTAS
  getEmpresas: async (): Promise<Empresa[]> => {
    console.log('🔍 Obteniendo empresas...');
    
    // Probar diferentes rutas comunes
    const possibleRoutes = [
      '/empresas',           // Ruta simple
      '/api/empresas',       // Con /api/
      '/Admin/empresas',     // Con /Admin/
      '/api/Admin/empresas'  // Con ambos
    ];
    
    for (const route of possibleRoutes) {
      try {
        console.log(`🔄 Probando ruta: ${route}`);
        const response = await api.get(route);
        console.log(`✅ Éxito con ruta: ${route}`, response.data);
        return response.data;
      } catch (error) {
        console.log(`❌ Falló ruta: ${route}`);
        continue;
      }
    }
    
    throw new Error('No se pudo encontrar la ruta para empresas');
  },

  // Obtener empresa por ID
  getEmpresa: async (id: number): Promise<Empresa> => {
    const response = await api.get(`/empresas/${id}`);
    return response.data;
  },

  // Crear nueva empresa
  createEmpresa: async (nombre: string): Promise<any> => {
    const response = await api.post('/empresas', { nombre });
    return response.data;
  },

  // Actualizar empresa
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