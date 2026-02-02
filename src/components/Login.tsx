// Login.tsx - VERSIÓN CORREGIDA CON SERVICIOS
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Usar el servicio de autenticación
      await authService.login(username, password);
      
      // Si llega aquí, el login fue exitoso
      console.log('✅ Login exitoso');
      navigate('/');
      
    } catch (err: any) {
      console.error('❌ Error en login:', err);
      
      // Manejo de errores específicos
      if (err.response) {
        // El backend respondió con un error
        switch (err.response.status) {
          case 401:
            setError('Usuario o contraseña incorrectos');
            break;
          case 404:
            setError('Endpoint de login no encontrado. Verifica la URL del backend.');
            break;
          case 500:
            setError('Error interno del servidor. Contacta al administrador.');
            break;
          default:
            setError(`Error ${err.response.status}: ${err.response.data?.message || 'Error desconocido'}`);
        }
      } else if (err.request) {
        // No hubo respuesta del backend
        setError('No se puede conectar al servidor. Verifica que:');
        setError(prev => prev + '\n2. El puerto  esté disponible');
      } else {
        // Error en la configuración de la petición
        setError('Error en la petición: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '420px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            background: '#1890ff',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '15px'
          }}>
            <span style={{ fontSize: '28px', color: 'white' }}>🔐</span>
          </div>
          <h2 style={{ margin: 0, color: '#333' }}>Iniciar Sesión</h2>
          <p style={{ color: '#666', marginTop: '8px' }}>Sistema de Verificación IMEI</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #e8e8e8',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'all 0.3s',
                outline: 'none',
                backgroundColor: loading ? '#f5f5f5' : 'white'
              }}
              onFocus={(e) => {
                if (!loading) {
                  e.target.style.borderColor = '#1890ff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(24, 144, 255, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e8e8e8';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #e8e8e8',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'all 0.3s',
                outline: 'none',
                backgroundColor: loading ? '#f5f5f5' : 'white'
              }}
              onFocus={(e) => {
                if (!loading) {
                  e.target.style.borderColor = '#1890ff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(24, 144, 255, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e8e8e8';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          {error && (
            <div style={{
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              color: '#ff4d4f',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ marginRight: '8px' }}>⚠️</span>
                <div>
                  <strong>Error:</strong> 
                  {error.split('\n').map((line, index) => (
                    <div key={index} style={{ marginTop: index > 0 ? '4px' : '0' }}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              width: '100%',
              padding: '16px',
              background: !username || !password ? '#f5f5f5' : loading ? '#95d475' : '#1890ff',
              color: !username || !password ? '#bfbfbf' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (!username || !password || loading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: (!username || !password) ? 0.6 : 1
            }}
            onMouseOver={(e) => {
              if (username && password && !loading) {
                e.currentTarget.style.background = '#40a9ff';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (username && password && !loading) {
                e.currentTarget.style.background = '#1890ff';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Conectando...
              </>
            ) : (
              'Ingresar al sistema'
            )}
          </button>
          
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </form>
      </div>
    </div>
  );
};

export default Login;