import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// interceptor global para redirigir al login en caso de 401 (Token Expirado) y forzar credenciales en fetch
const { fetch: originalFetch } = window;
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : (input as any).url || '';
  const isApiCall = typeof url === 'string' && url.includes('/api/');
  
  const newInit = isApiCall 
    ? { ...init, credentials: 'include' as const } 
    : init;

  const response = await originalFetch(input, newInit);
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/#/login';
  }
  return response;
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);