// src/types/index.ts
export interface VerificacionRequest {
  IMEI: string;
}

export interface VerificacionResponse {
  valido: boolean;
  mensaje: string;
  persona?: Persona;
  empresa?: Empresa;
  dispositivo?: Dispositivo;
}

export interface Persona {
  id: number;
  nombre: string;
  identificacion: string;
  email?: string;
  telefono?: string;
}

export interface Empresa {
  id: number;
  nombre: string;
  fechaCreacion?: string;
}

export interface Dispositivo {
  imei: string;
  fechaRegistro: string;
}

// ===== NUEVOS TIPOS PARA EMPRESAS =====
export interface EmpresaDTO {
  id: number;
  nombre: string;
  fechaCreacion: string;
}

export interface RegistrarEmpresaDTO {
  nombre: string;
}

export interface PersonaDTO {
  id: number;
  nombre: string;
  identificacion: string;
  email?: string;
  telefono?: string;
  cantidadDispositivos: number;
}

// ===== TIPOS PARA AUTH =====
export interface User {
  id: number;
  email: string;
  nombre: string;
  rol: 'User' | 'Admin' | 'SuperAdmin';
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}