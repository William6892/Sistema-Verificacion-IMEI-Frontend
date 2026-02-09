// src/services/dispositivosService.ts - VERSIÓN CORREGIDA
import api from './api';

export interface Dispositivo {
  id: number;
  imei: string;
  personaId: number;
  personaNombre?: string;
  empresaId?: number;
  empresaNombre?: string;
  activo: boolean;
  fechaRegistro: string;
}

class DispositivosService {
  async getDispositivos(params?: any): Promise<{ 
    dispositivos: Dispositivo[]; 
    total: number; 
    page: number; 
    limit: number; 
    totalPages: number 
  }> {
    console.log('🔍 Buscando dispositivos con params:', params);
    
    // Probar diferentes rutas
    const possibleRoutes = [
      '/Admin/dispositivos',    // Tu ruta actual
      '/dispositivos',          // Ruta simple
      '/api/dispositivos',      // Con /api/
      '/api/Admin/dispositivos' // Con ambos
    ];
    
    for (const route of possibleRoutes) {
      try {
        console.log(`🔄 Probando ruta: ${route}`);
        const response = await api.get(route, { params });
        console.log(`✅ Éxito con ruta: ${route}`, response.data.dispositivos?.length);
        return response.data;
      } catch (error) {
        console.log(`❌ Falló ruta: ${route}`);
        continue;
      }
    }
    
    throw new Error('No se pudo encontrar la ruta para dispositivos');
  }

  // ... otros métodos manteniendo la lógica de prueba de rutas
  async getDispositivo(id: number): Promise<Dispositivo> {
    const response = await api.get(`/Admin/dispositivos/${id}`);
    return response.data;
  }

  async createDispositivo(data: any): Promise<any> {
    const response = await api.post('/Admin/registrar-dispositivo', data);
    return response.data;
  }

  async updateDispositivo(id: number, data: any): Promise<any> {
    const response = await api.put(`/Admin/dispositivos/${id}`, data);
    return response.data;
  }

  async deleteDispositivo(id: number): Promise<void> {
    await api.delete(`/Admin/dispositivos/${id}`);
  }

  async toggleActivo(id: number, activo: boolean): Promise<void> {
    await api.patch(`/Admin/dispositivos/${id}/activo`, { activo });
  }

  async verificarIMEI(imei: string): Promise<{ existe: boolean; dispositivo?: Dispositivo }> {
    const response = await api.get(`/Admin/verificar-imei/${imei}`);
    return response.data;
  }

  async getDispositivosPorPersona(personaId: number): Promise<Dispositivo[]> {
    const response = await api.get(`/Admin/dispositivos/persona/${personaId}`);
    return response.data;
  }

  async exportarDispositivos(params?: any): Promise<Blob> {
    const response = await api.get(`/Admin/dispositivos/exportar`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
}

export const dispositivosService = new DispositivosService();