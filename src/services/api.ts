import axios from 'axios';

// Obtener URL base desde variable de entorno
const BASE_URL = process.env.REACT_APP_API_URL 
  || 'http://localhost:5000';  // Fallback para desarrollo local


// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 120000, // 🔥 CAMBIADO: 2 minutos en lugar de 15 segundos
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
    console.error('❌ Error en API:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    const status = error.response?.status;
    
    // 🔥 NUEVO: Manejar timeout
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      alert('⏱️ El servidor está tardando mucho en responder. Puede estar despertando (servicios gratuitos se duermen). Por favor, intenta de nuevo en unos segundos.');
      return Promise.reject(error);
    }
    
    // Si el error es 401 (no autorizado), redirigir al login
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Si es error 403 (prohibido)
    if (status === 403) {
      alert('Acceso denegado. No tienes permisos suficientes.');
    }
    
    // Si es error 500 (error interno del servidor)
    if (status === 500) {
      alert('Error interno del servidor. Por favor, contacta al administrador.');
    }
    
    // Si es error de red
    if (error.code === 'ERR_NETWORK') {
      alert('Error de conexión. Verifica que el servidor esté funcionando.');
    }
    
    return Promise.reject(error);
  }
);

export default api;