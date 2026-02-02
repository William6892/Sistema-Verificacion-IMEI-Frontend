import axios from 'axios';

// URL base de tu backend .NET - PRODUCCIÓN
// Usar variable de entorno o URL directa de Render
const API_URL = process.env.REACT_APP_API_URL 
  || 'https://imei-api-p18o.onrender.com/api';

console.log('🔗 Conectando a API:', API_URL);

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000,
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    
    // Si el error es 401 (no autorizado), redirigir al login
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Solo redirigir si no estamos ya en login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Si es error 403 (prohibido), mostrar mensaje específico
    if (status === 403) {
      alert('Acceso denegado. No tienes permisos suficientes.');
    }
    
    // Si es error 500 (error interno del servidor)
    if (status === 500) {
      alert('Error interno del servidor. Por favor, contacta al administrador.');
    }
    
    return Promise.reject(error);
  }
);

export default api;