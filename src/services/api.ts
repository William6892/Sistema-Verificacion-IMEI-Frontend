// src/services/api.ts - VERSIÓN PRODUCCIÓN (SIN NINGÚN LOG)
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL 
  || 'https://imei-api-p18o.onrender.com'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000,
  withCredentials: true // Habilitar el envío de cookies HttpOnly en peticiones cross-domain
});

// Interceptor para token (restaurado para compatibilidad con cabeceras de token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

export default api;