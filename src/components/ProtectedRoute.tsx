// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Solo verifica si existe el token
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token); // true si hay token, false si no
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