// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const isTokenExpired = (token: string): boolean => {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decoded = JSON.parse(decodedJson);
    const exp = decoded.exp;
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now >= exp;
  } catch {
    return true; // Si hay error al decodificar, asumimos expirado
  }
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    const expired = isTokenExpired(token);
    if (expired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
  }, []);

  // Mientras verifica, muestra "Cargando..."
  if (isAuthenticated === null) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Verificando sesión...</div>;
  }

  // Si NO está autenticado, va al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, muestra la página
  return <>{children}</>;
};

export default ProtectedRoute;