// src/services/api.ts - VERSIÓN CORREGIDA
import axios from 'axios';

// CORREGIR: Usar el backend correcto
const BASE_URL = process.env.REACT_APP_API_URL 
  || 'https://imei-api-p18o.onrender.com'; 

console.log('🔍 Configuración API cargada:', {
  baseURL: BASE_URL,
  fromEnv: process.env.REACT_APP_API_URL || 'Usando valor por defecto',
  frontendURL: window.location.origin
});

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000,
});

// Interceptor para token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log de depuración MEJORADO
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.params || '');
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para respuestas
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`, response.data?.length || response.data);
    return response;
  },
  (error) => {
    const errorDetails = {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data
    };
    console.error('❌ API Error:', errorDetails);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/#/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;