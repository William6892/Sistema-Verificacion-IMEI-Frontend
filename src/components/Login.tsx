// Login.tsx 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

// Constantes de colores Samsung mejorados
const SAMSUNG_COLORS = {
  blue: '#1428a0',
  blueLight: '#1e40ff',
  blueDark: '#0d1b66',
  gradient: 'linear-gradient(135deg, #1428a0 0%, #1e40ff 50%, #4a7dff 100%)',
  gradientLight: 'linear-gradient(135deg, rgba(20, 40, 160, 0.9) 0%, rgba(30, 64, 255, 0.9) 100%)',
  gradientVertical: 'linear-gradient(180deg, #1428a0 0%, #1e40ff 30%, #4a7dff 70%)',
  gray: '#f8fafc',
  grayDark: '#e2e8f0',
  text: '#1e293b',
  textLight: '#64748b',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  white: '#ffffff',
  black: '#0f172a'
};

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({
    username: false,
    password: false
  });
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  
  const navigate = useNavigate();

  // Detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos');
      return;
    }

    // Validación básica de seguridad
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Prevenir ataques de fuerza bruta básicos
    if (username.length > 50 || password.length > 100) {
      setError('Credenciales inválidas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Iniciando sesión...');
      await authService.login(username, password);
      
      console.log('✅ Login exitoso');
      // Limpiar campos después de login exitoso
      setUsername('');
      setPassword('');
      
      setTimeout(() => {
        navigate('/');
      }, 500);
      
    } catch (err: any) {
      console.error('❌ Error en login:', err);
      
      // NO mostrar detalles específicos de error en producción
      if (err.code === 'ECONNABORTED') {
        setError('El servidor está tardando en responder. Por favor, intenta nuevamente.');
      } else if (err.response) {
        // Mensajes genéricos de error
        switch (err.response.status) {
          case 401:
            setError('Usuario o contraseña incorrectos');
            break;
          case 403:
            setError('Acceso no autorizado');
            break;
          case 404:
            setError('Servicio no disponible');
            break;
          case 429:
            setError('Demasiados intentos. Espera unos minutos');
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            setError('Error del servidor. Contacta al administrador');
            break;
          default:
            setError('Error de autenticación. Intenta nuevamente');
        }
      } else if (err.request) {
        setError('Error de conexión. Verifica tu internet');
      } else {
        setError('Error inesperado. Intenta nuevamente');
      }
      
      // Limpiar contraseña en caso de error
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  // Determinar tamaño de pantalla
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;

  // Estilos responsivos mejorados - SIN ERRORES DE TIPO
  const getInputStyle = (type: 'username' | 'password'): React.CSSProperties => {
    let padding, fontSize;
    
    if (isMobile) {
      padding = type === 'password' ? '14px 48px 14px 20px' : '14px 20px';
      fontSize = '15px';
    } else if (isTablet) {
      padding = type === 'password' ? '16px 52px 16px 24px' : '16px 24px';
      fontSize = '16px';
    } else {
      padding = type === 'password' ? '18px 56px 18px 28px' : '18px 28px';
      fontSize = '17px';
    }

    const baseStyle: React.CSSProperties = {
      width: '100%',
      padding,
      fontSize,
      border: `2px solid ${error ? SAMSUNG_COLORS.error : SAMSUNG_COLORS.grayDark}`,
      borderRadius: '12px',
      background: SAMSUNG_COLORS.white,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      color: SAMSUNG_COLORS.text,
      fontWeight: 500,
      boxSizing: 'border-box',
    };

    if (isFocused[type]) {
      return {
        ...baseStyle,
        borderColor: error ? SAMSUNG_COLORS.error : SAMSUNG_COLORS.blueLight,
        boxShadow: `0 0 0 4px ${error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(20, 40, 160, 0.15)'}`,
        transform: 'translateY(-2px)',
      };
    }

    return baseStyle;
  };

  // Estados para hover
  const [isHovered, setIsHovered] = useState({
    passwordToggle: false,
    loginBtn: false
  });

  // Función para el estilo del botón toggle
  const getTogglePasswordStyle = (isHovered: boolean): React.CSSProperties => ({
    position: 'absolute',
    right: isMobile ? '16px' : '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: isMobile ? '20px' : '22px',
    cursor: 'pointer',
    color: isHovered ? SAMSUNG_COLORS.blueLight : SAMSUNG_COLORS.textLight,
    padding: '4px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  });

  // Función para el estilo del botón de login
  const getLoginButtonStyle = (isDisabled: boolean, isHovered: boolean): React.CSSProperties => ({
    width: '100%',
    padding: isMobile ? '16px' : '20px',
    background: isDisabled ? SAMSUNG_COLORS.grayDark : SAMSUNG_COLORS.gradient,
    color: isDisabled ? SAMSUNG_COLORS.textLight : SAMSUNG_COLORS.white,
    border: 'none',
    borderRadius: '12px',
    fontSize: isMobile ? '16px' : '17px',
    fontWeight: 700,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    position: 'relative',
    overflow: 'hidden',
    transform: !isDisabled && isHovered ? 'translateY(-2px)' : undefined,
    boxShadow: !isDisabled && isHovered ? 
      '0 10px 25px rgba(20, 40, 160, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' : 
      '0 6px 20px rgba(20, 40, 160, 0.2)',
    letterSpacing: '0.3px',
    marginTop: '8px',
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isMobile ? '12px' : isTablet ? '20px' : '24px',
      position: 'relative',
      overflow: 'auto',
      background: SAMSUNG_COLORS.gray,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: 'border-box',
    }}>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { 
              opacity: 1; 
              transform: scale(1);
            }
            50% { 
              opacity: 0.7; 
              transform: scale(0.95);
            }
          }
          @keyframes float {
            0% { 
              transform: translateY(0) rotate(0deg); 
            }
            100% { 
              transform: translateY(-20px) rotate(1deg); 
            }
          }
          
          * {
            box-sizing: border-box;
          }
          
          .samsung-input:disabled {
            background: #f8fafc;
            cursor: not-allowed;
            opacity: 0.7;
          }
          
          .samsung-input::placeholder {
            color: #94a3b8;
            opacity: 0.7;
          }
          
          .btn-hover-effect {
            position: relative;
            overflow: hidden;
          }
          
          .btn-hover-effect::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            transform: translate(-50%, -50%);
            transition: width 0.6s ease, height 0.6s ease;
          }
          
          .btn-hover-effect:hover::before {
            width: 200px;
            height: 200px;
          }
          
          /* Mejoras de responsividad */
          @media (max-width: 767px) {
            .login-wrapper {
              margin: 10px;
            }
            
            input, button {
              -webkit-appearance: none;
              appearance: none;
            }
          }
          
          @media (max-width: 480px) {
            .login-wrapper {
              border-radius: 12px;
            }
            
            .left-panel, .right-panel {
              padding: 20px 16px;
            }
          }
        `}
      </style>

      {/* Fondo animado */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -2,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: SAMSUNG_COLORS.gradientVertical,
          opacity: 0.97
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `radial-gradient(circle at 10% 90%, rgba(255,255,255,0.15) 0%, transparent 40%),
                            radial-gradient(circle at 90% 10%, rgba(255,255,255,0.15) 0%, transparent 40%),
                            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)`,
          animation: 'float 30s ease-in-out infinite alternate'
        }} />
      </div>

      {/* Contenedor principal */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%',
        maxWidth: isMobile ? '100%' : isTablet ? '90%' : '1200px',
        height: isMobile ? 'auto' : isTablet ? '80vh' : '85vh',
        minHeight: isMobile ? '100vh' : '500px',
        borderRadius: isMobile ? '16px' : '24px',
        overflow: 'hidden',
        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25),
                    0 0 0 1px rgba(255, 255, 255, 0.1) inset`,
        background: SAMSUNG_COLORS.white,
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box',
      }}>
        
        {/* Panel izquierdo - Presentación */}
        <div style={{
          flex: isMobile ? '0 0 auto' : '1',
          background: SAMSUNG_COLORS.gradientLight,
          padding: isMobile ? '32px 24px' : isTablet ? '40px 32px' : '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          minHeight: isMobile ? '40vh' : 'auto',
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '12px' : '16px',
              marginBottom: isMobile ? '24px' : '32px',
              flexWrap: 'wrap',
            }}>
              <div style={{
                width: isMobile ? '48px' : isTablet ? '56px' : '64px',
                height: isMobile ? '48px' : isTablet ? '56px' : '64px',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: isMobile ? '14px' : '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px',
                  color: SAMSUNG_COLORS.white
                }}>🔐</span>
              </div>
              <div style={{ flex: 1, minWidth: isMobile ? '200px' : 'auto' }}>
                <h1 style={{
                  fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px',
                  fontWeight: 700,
                  color: SAMSUNG_COLORS.white,
                  margin: 0,
                  letterSpacing: '-0.5px',
                  lineHeight: 1.2,
                }}>Samsung IMEI</h1>
                <p style={{
                  fontSize: isMobile ? '12px' : isTablet ? '14px' : '15px',
                  color: 'rgba(255, 255, 255, 0.85)',
                  margin: '4px 0 0 0',
                  fontWeight: 400,
                  lineHeight: 1.4,
                }}>Verification System Pro</p>
              </div>
            </div>
            
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              marginTop: isMobile ? '16px' : '0',
            }}>
              <h2 style={{
                fontSize: isMobile ? '24px' : isTablet ? '32px' : '40px',
                fontWeight: 700,
                color: SAMSUNG_COLORS.white,
                marginBottom: isMobile ? '12px' : '20px',
                lineHeight: 1.1,
                wordBreak: 'break-word',
              }}>
                Sistema de Escaneo de Imei
              </h2>
              <p style={{
                fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: isMobile ? '20px' : '28px',
                lineHeight: 1.6,
              }}>
                Accede al sistema de verificación de IMEI de Samsung para garantizar la autenticidad de tus dispositivos. 
              </p>
            </div>
          </div>
          
          <div style={{
            position: isMobile ? 'relative' : 'absolute',
            bottom: isMobile ? '0' : isTablet ? '20px' : '24px',
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: isMobile ? '11px' : '12px',
            padding: isMobile ? '16px 0 0 0' : isTablet ? '0 16px' : '0',
            marginTop: isMobile ? '20px' : '0',
          }}>
            <p>Samsung Electronics © {new Date().getFullYear()} • Todos los derechos reservados</p>
          </div>
        </div>

        {/* Panel derecho - Login */}
        <div style={{
          flex: isMobile ? '0 0 auto' : '1.2',
          padding: isMobile ? '32px 24px' : isTablet ? '40px 32px' : '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: SAMSUNG_COLORS.white,
          overflowY: 'auto',
          maxHeight: isMobile ? '60vh' : 'none',
        }}>
          <div style={{
            marginBottom: isMobile ? '24px' : '36px',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px',
              fontWeight: 700,
              color: SAMSUNG_COLORS.text,
              marginBottom: '8px',
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
            }}>Acceso Seguro</h2>
            <p style={{
              fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
              color: SAMSUNG_COLORS.textLight,
              lineHeight: 1.5,
              maxWidth: '500px',
              margin: '0 auto',
            }}>
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '20px' : '28px',
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            {/* Campo Usuario */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 600,
                color: SAMSUNG_COLORS.text,
                paddingLeft: '4px',
              }}>
                <span style={{
                  fontSize: isMobile ? '18px' : '20px',
                  opacity: 0.8,
                }}>👤</span>
                Usuario autorizado
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Ingresa tu usuario"
                  style={getInputStyle('username')}
                  disabled={loading}
                  autoComplete="username"
                  onFocus={() => setIsFocused(prev => ({ ...prev, username: true }))}
                  onBlur={() => setIsFocused(prev => ({ ...prev, username: false }))}
                  className="samsung-input"
                  maxLength={50}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 600,
                color: SAMSUNG_COLORS.text,
                paddingLeft: '4px',
              }}>
                <span style={{
                  fontSize: isMobile ? '18px' : '20px',
                  opacity: 0.8,
                }}>🔒</span>
                Contraseña segura
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Ingresa tu contraseña"
                  style={getInputStyle('password')}
                  disabled={loading}
                  autoComplete="current-password"
                  onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
                  onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
                  className="samsung-input"
                  maxLength={100}
                />
                <button
                  type="button"
                  style={getTogglePasswordStyle(isHovered.passwordToggle)}
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseEnter={() => setIsHovered(prev => ({ ...prev, passwordToggle: true }))}
                  onMouseLeave={() => setIsHovered(prev => ({ ...prev, passwordToggle: false }))}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Estado de carga */}
            {loading && (
              <div style={{
                background: 'rgba(20, 40, 160, 0.03)',
                border: `2px solid ${SAMSUNG_COLORS.grayDark}`,
                borderRadius: '12px',
                padding: isMobile ? '16px' : '20px',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '16px' : '20px',
                marginBottom: '12px',
                backdropFilter: 'blur(10px)',
                width: '100%',
              }}>
                <div style={{
                  width: isMobile ? '24px' : '28px',
                  height: isMobile ? '24px' : '28px',
                  border: `3px solid ${SAMSUNG_COLORS.grayDark}`,
                  borderTop: `3px solid ${SAMSUNG_COLORS.blue}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  flexShrink: 0,
                }}></div>
                <div>
                  <p style={{
                    margin: '0 0 4px 0',
                    fontWeight: 600,
                    color: SAMSUNG_COLORS.text,
                    fontSize: isMobile ? '15px' : '16px',
                  }}>Verificando credenciales...</p>
                  <small style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: SAMSUNG_COLORS.textLight,
                    display: 'block',
                  }}>
                    Autenticación en proceso, por favor espera
                  </small>
                </div>
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.03)',
                border: `2px solid rgba(239, 68, 68, 0.2)`,
                borderRadius: '12px',
                padding: isMobile ? '16px' : '20px',
                display: 'flex',
                gap: isMobile ? '16px' : '20px',
                marginBottom: '12px',
                backdropFilter: 'blur(10px)',
                width: '100%',
              }} role="alert">
                <div style={{
                  fontSize: isMobile ? '24px' : '28px',
                  color: SAMSUNG_COLORS.error,
                  flexShrink: 0,
                }}>⚠️</div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: '0 0 6px 0',
                    fontWeight: 600,
                    color: SAMSUNG_COLORS.error,
                    fontSize: isMobile ? '15px' : '16px',
                  }}>Error de autenticación</p>
                  <div style={{ lineHeight: '1.5' }}>
                    {error.split('\n').map((line, index) => (
                      <p key={index} style={{
                        margin: '2px 0',
                        color: SAMSUNG_COLORS.text,
                        fontSize: isMobile ? '13px' : '14px',
                      }}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Botón de login */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              style={getLoginButtonStyle(loading || !username.trim() || !password.trim(), isHovered.loginBtn)}
              onMouseEnter={() => setIsHovered(prev => ({ ...prev, loginBtn: true }))}
              onMouseLeave={() => setIsHovered(prev => ({ ...prev, loginBtn: false }))}
              className="btn-hover-effect"
            >
              {loading ? (
                <>
                  <span style={{
                    width: isMobile ? '20px' : '22px',
                    height: isMobile ? '20px' : '22px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}></span>
                  Verificando...
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <span style={{
                    fontSize: isMobile ? '20px' : '22px',
                    fontWeight: 300,
                    transition: 'transform 0.3s ease',
                  }}>→</span>
                </>
              )}
            </button>

            {/* Footer del formulario */}
            <div style={{
              marginTop: isMobile ? '24px' : '36px',
              paddingTop: isMobile ? '20px' : '28px',
              borderTop: `2px solid ${SAMSUNG_COLORS.grayDark}`,
              width: '100%',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '12px' : '16px',
                fontSize: isMobile ? '12px' : '13px',
                color: SAMSUNG_COLORS.textLight,
                flexWrap: 'wrap',
              }}>
                <span style={{
                  padding: isMobile ? '4px 12px' : '6px 16px',
                  background: 'rgba(20, 40, 160, 0.08)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  color: SAMSUNG_COLORS.blueDark,
                  whiteSpace: 'nowrap',
                }}>v1.1.1 </span>
                <span style={{
                  width: '8px',
                  height: '8px',
                  background: SAMSUNG_COLORS.success,
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite',
                  boxShadow: `0 0 0 2px rgba(16, 185, 129, 0.2)`,
                  flexShrink: 0,
                }}></span>                
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;