// src/services/authService.ts - VERSIÓN CORREGIDA
import api from './api';

// Interfaces
export interface UserInfoDTO {
  id: number;
  username: string;
  rol: string;
  empresaId: number | null;
  empresaNombre?: string | null;
}

export interface LoginResponseDTO {
  success: boolean;
  token: string;
  mensaje: string;
  usuario: UserInfoDTO;
}

// Función para migrar usuario viejo a nueva estructura
const migrateOldUser = (oldUser: any): UserInfoDTO | null => {
  if (!oldUser || typeof oldUser !== 'object') return null;
  
  // Si ya es la nueva estructura
  if (oldUser.username && oldUser.rol) {
    return oldUser as UserInfoDTO;
  }
  
  // Si es la vieja estructura (con 'nombre' en lugar de 'username')
  if (oldUser.nombre && oldUser.rol) {
    return {
      id: oldUser.id || 1,
      username: oldUser.nombre,  // Convertir 'nombre' a 'username'
      rol: oldUser.rol,
      empresaId: oldUser.empresaId || null,
      empresaNombre: oldUser.empresaNombre || null
    };
  }
  
  return null;
};

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponseDTO> => {
    try {
      // ✅ CORREGIDO: Ruta correcta /api/auth/login
      const response = await api.post<LoginResponseDTO>('/api/auth/login', { 
        username, 
        password 
      });
      
      const { success, token, mensaje, usuario } = response.data;
      
      if (!success || !token) {
        throw new Error(mensaje || 'Login fallido');
      }
      
      let userToSave = usuario;
      if (!userToSave) {
        userToSave = {
          id: 1,
          username: username,
          rol: username.toLowerCase() === 'admin' ? 'Admin' : 'Usuario',
          empresaId: null
        };
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userToSave));
      
      return response.data;
      
    } catch (error: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Obtener usuario actual - CON MIGRACIÓN AUTOMÁTICA
  getCurrentUser: (): UserInfoDTO | null => {
    try {
      const userStr = localStorage.getItem('user');
      
      // Verificar que exista y no sea inválido
      if (!userStr || userStr === 'undefined' || userStr === 'null') {
        return null;
      }
      
      const user = JSON.parse(userStr);
      
      // Validar estructura básica
      if (!user || typeof user !== 'object') {
        localStorage.removeItem('user');
        return null;
      }
      
      // Intentar migrar si es usuario viejo
      const migratedUser = migrateOldUser(user);
      if (migratedUser) {
        // Guardar la versión migrada
        localStorage.setItem('user', JSON.stringify(migratedUser));
        return migratedUser;
      }
      
      // Si no es migrable, verificar que tenga propiedades mínimas
      if (!user.username || !user.rol) {
        return null;
      }
      
      return user;
      
    } catch (error) {
      localStorage.removeItem('user');
      return null;
    }
  },

  // Verificar si está autenticado
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    const user = authService.getCurrentUser();
    return !!(token && user);
  },

  // Obtener token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Verificar rol específico
  hasRole: (role: string): boolean => {
    const user = authService.getCurrentUser();
    if (!user || !user.rol) {
      return false;
    }
    return user.rol === role;
  },

  // Verificar si es Admin
  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.rol === 'Admin';
  },

  // Verificar si tiene al menos uno de los roles
  hasAnyRole: (roles: string[]): boolean => {
    const user = authService.getCurrentUser();
    return roles.includes(user?.rol || '');
  },

  // Obtener empresaId del usuario actual
  getEmpresaId: (): number | null => {
    const user = authService.getCurrentUser();
    return user?.empresaId || null;
  },

  // Validar token con backend
  validateToken: async (): Promise<boolean> => {
    try {
      const token = authService.getToken();
      if (!token) return false;
      
      // ✅ CORREGIDO: Ruta correcta
      const response = await api.post('/api/auth/validate');
      return response.data?.valid === true;
    } catch (error) {
      return false;
    }
  },

  // FUNCIÓN EXTRA: Forzar limpieza de datos viejos
  cleanupOldData: (): void => {
    localStorage.removeItem('user');
  }
};

export default authService;