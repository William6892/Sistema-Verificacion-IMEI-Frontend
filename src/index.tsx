import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// interceptor global para redirigir al login en caso de 401 (Token Expirado)
const { fetch: originalFetch } = window;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
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