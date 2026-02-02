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
  // IMPORTANTE: Ya que api.ts tiene baseURL con /api, aquí solo ponemos /Admin
  private baseUrl = '/Admin';

  async getDispositivos(params?: any): Promise<{ dispositivos: Dispositivo[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      
      const response = await api.get(`${this.baseUrl}/dispositivos`, { params });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en getDispositivos:', {
        url: error.config?.url,
        status: error.response?.status,
        mensaje: error.response?.data?.mensaje || error.message
      });
      throw error;
    }
  }

  async getDispositivo(id: number): Promise<Dispositivo> {
    const response = await api.get(`${this.baseUrl}/dispositivos/${id}`);
    return response.data;
  }

  async createDispositivo(data: any): Promise<any> {
    const response = await api.post(`${this.baseUrl}/registrar-dispositivo`, data);
    return response.data;
  }

  async updateDispositivo(id: number, data: any): Promise<any> {
    const response = await api.put(`${this.baseUrl}/dispositivos/${id}`, data);
    return response.data;
  }

  async deleteDispositivo(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/dispositivos/${id}`);
  }

  async toggleActivo(id: number, activo: boolean): Promise<void> {
    await api.patch(`${this.baseUrl}/dispositivos/${id}/activo`, { activo });
  }

  async verificarIMEI(imei: string): Promise<{ existe: boolean; dispositivo?: Dispositivo }> {
    const response = await api.get(`${this.baseUrl}/verificar-imei/${imei}`);
    return response.data;
  }

  async getDispositivosPorPersona(personaId: number): Promise<Dispositivo[]> {
    const response = await api.get(`${this.baseUrl}/dispositivos/persona/${personaId}`);
    return response.data;
  }

  async exportarDispositivos(params?: any): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/dispositivos/exportar`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
}

export const dispositivosService = new DispositivosService();