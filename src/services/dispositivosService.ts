// src/services/dispositivosService.ts - VERSIÓN FINAL
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
    console.log('🔍 Buscando dispositivos desde /api/Admin/dispositivos');
    const response = await api.get('/api/Admin/dispositivos', { params });
    return response.data;
  }

  async getDispositivo(id: number): Promise<Dispositivo> {
    const response = await api.get(`/api/Admin/dispositivos/${id}`);
    return response.data;
  }

  async createDispositivo(data: any): Promise<any> {
    const response = await api.post('/api/Admin/registrar-dispositivo', data);
    return response.data;
  }

  async updateDispositivo(id: number, data: any): Promise<any> {
    const response = await api.put(`/api/Admin/dispositivos/${id}`, data);
    return response.data;
  }

  async deleteDispositivo(id: number): Promise<void> {
    await api.delete(`/api/Admin/dispositivos/${id}`);
  }

  async toggleActivo(id: number, activo: boolean): Promise<void> {
    await api.patch(`/api/Admin/dispositivos/${id}/activo`, { activo });
  }

  async verificarIMEI(imei: string): Promise<{ existe: boolean; dispositivo?: Dispositivo }> {
    const response = await api.get(`/api/Admin/verificar-imei/${imei}`);
    return response.data;
  }

  async getDispositivosPorPersona(personaId: number): Promise<Dispositivo[]> {
    const response = await api.get(`/api/Admin/dispositivos/persona/${personaId}`);
    return response.data;
  }

  async exportarDispositivos(params?: any): Promise<Blob> {
    const response = await api.get(`/api/Admin/dispositivos/exportar`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
}

export const dispositivosService = new DispositivosService();