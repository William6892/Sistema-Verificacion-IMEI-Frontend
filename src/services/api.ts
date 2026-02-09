import axios from 'axios';

// ✅ CORRECTO PARA CREATE REACT APP
const BASE_URL = process.env.REACT_APP_API_URL 
  || 'https://barcodeverify-backend.onrender.com';

console.log('🔍 Configuración API cargada:', {
  baseURL: BASE_URL,
  fromEnv: process.env.REACT_APP_API_URL || 'Usando valor por defecto',
  frontendURL: window.location.origin
});

const api = axios.create({
  baseURL: BASE_URL, // URL base SIN /api
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 segundos
});

// Interceptor para token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log de depuración
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para respuestas
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;