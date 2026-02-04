// Login.tsx - VERSIÓN RESPONSIVA CORREGIDA
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

  // Estilos responsivos mejorados
  const getInputStyle = (type: 'username' | 'password') => {
    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1024;
    
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

    const baseStyle = {
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
      boxSizing: 'border-box' as const,
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

  // Determinar tamaño de pantalla
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isMobile ? '12px' : isTablet ? '20px' : '24px',
      position: 'relative' as const,
      overflow: 'auto' as const,
      background: SAMSUNG_COLORS.gray,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: 'border-box' as const,
    },
    background: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -2,
      overflow: 'hidden' as const
    },
    backgroundGradient: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: SAMSUNG_COLORS.gradientVertical,
      opacity: 0.97
    },
    backgroundPattern: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundImage: `
        radial-gradient(circle at 10% 90%, rgba(255,255,255,0.15) 0%, transparent 40%),
        radial-gradient(circle at 90% 10%, rgba(255,255,255,0.15) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)
      `,
      animation: 'float 30s ease-in-out infinite alternate'
    },
    loginWrapper: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : ('row' as const),
      width: '100%',
      maxWidth: isMobile ? '100%' : isTablet ? '90%' : '1200px',
      height: isMobile ? 'auto' : isTablet ? '80vh' : '85vh',
      minHeight: isMobile ? '100vh' : '500px',
      borderRadius: isMobile ? '16px' : '24px',
      overflow: 'hidden' as const,
      boxShadow: `
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset
      `,
      background: SAMSUNG_COLORS.white,
      position: 'relative' as const,
      zIndex: 1,
      boxSizing: 'border-box' as const,
    },
    leftPanel: {
      flex: isMobile ? '0 0 auto' : '1',
      background: SAMSUNG_COLORS.gradientLight,
      padding: isMobile ? '32px 24px' : isTablet ? '40px 32px' : '48px 40px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'space-between',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      minHeight: isMobile ? '40vh' : 'auto',
    },
    rightPanel: {
      flex: isMobile ? '0 0 auto' : '1.2',
      padding: isMobile ? '32px 24px' : isTablet ? '40px 32px' : '48px 40px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      background: SAMSUNG_COLORS.white,
      overflowY: 'auto' as const,
      maxHeight: isMobile ? '60vh' : 'none',
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '12px' : '16px',
      marginBottom: isMobile ? '24px' : '32px',
      flexWrap: 'wrap' as const,
    },
    logoCircle: {
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
    },
    logoIcon: {
      fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px',
      color: SAMSUNG_COLORS.white
    },
    logoText: {
      flex: 1,
      minWidth: isMobile ? '200px' : 'auto',
    },
    logoTitle: {
      fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px',
      fontWeight: 700,
      color: SAMSUNG_COLORS.white,
      margin: 0,
      letterSpacing: '-0.5px',
      lineHeight: 1.2,
    },
    logoSubtitle: {
      fontSize: isMobile ? '12px' : isTablet ? '14px' : '15px',
      color: 'rgba(255, 255, 255, 0.85)',
      margin: '4px 0 0 0',
      fontWeight: 400,
      lineHeight: 1.4,
    },
    welcomeSection: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      marginTop: isMobile ? '16px' : '0',
    },
    welcomeTitle: {
      fontSize: isMobile ? '24px' : isTablet ? '32px' : '40px',
      fontWeight: 700,
      color: SAMSUNG_COLORS.white,
      marginBottom: isMobile ? '12px' : '20px',
      lineHeight: 1.1,
      wordBreak: 'break-word' as const,
    },
    welcomeText: {
      fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: isMobile ? '20px' : '28px',
      lineHeight: 1.6,
    },
    loginHeader: {
      marginBottom: isMobile ? '24px' : '36px',
      textAlign: 'center' as const,
    },
    loginTitle: {
      fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px',
      fontWeight: 700,
      color: SAMSUNG_COLORS.text,
      marginBottom: '8px',
      letterSpacing: '-0.5px',
      lineHeight: 1.2,
    },
    loginSubtitle: {
      fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
      color: SAMSUNG_COLORS.textLight,
      lineHeight: 1.5,
      maxWidth: '500px',
      margin: '0 auto',
    },
    loginForm: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: isMobile ? '20px' : '28px',
      width: '100%',
      maxWidth: '500px',
      margin: '0 auto',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      width: '100%',
    },
    formLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: isMobile ? '14px' : '15px',
      fontWeight: 600,
      color: SAMSUNG_COLORS.text,
      paddingLeft: '4px',
    },
    labelIcon: {
      fontSize: isMobile ? '18px' : '20px',
      opacity: 0.8,
    },
    inputContainer: {
      position: 'relative' as const,
      width: '100%',
    },
    togglePassword: (isHovered: boolean) => ({
      position: 'absolute' as const,
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
    }),
    loadingState: {
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
    },
    samsungSpinner: {
      width: isMobile ? '24px' : '28px',
      height: isMobile ? '24px' : '28px',
      border: `3px solid ${SAMSUNG_COLORS.grayDark}`,
      borderTop: `3px solid ${SAMSUNG_COLORS.blue}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      flexShrink: 0,
    },
    loadingTextP: {
      margin: '0 0 4px 0',
      fontWeight: 600,
      color: SAMSUNG_COLORS.text,
      fontSize: isMobile ? '15px' : '16px',
    },
    loadingTextSmall: {
      fontSize: isMobile ? '12px' : '13px',
      color: SAMSUNG_COLORS.textLight,
      display: 'block' as const,
    },
    errorState: {
      background: 'rgba(239, 68, 68, 0.03)',
      border: `2px solid rgba(239, 68, 68, 0.2)`,
      borderRadius: '12px',
      padding: isMobile ? '16px' : '20px',
      display: 'flex',
      gap: isMobile ? '16px' : '20px',
      marginBottom: '12px',
      backdropFilter: 'blur(10px)',
      width: '100%',
    },
    errorIcon: {
      fontSize: isMobile ? '24px' : '28px',
      color: SAMSUNG_COLORS.error,
      flexShrink: 0,
    },
    errorContent: {
      flex: 1,
    },
    errorTitle: {
      margin: '0 0 6px 0',
      fontWeight: 600,
      color: SAMSUNG_COLORS.error,
      fontSize: isMobile ? '15px' : '16px',
    },
    errorMessages: {
      lineHeight: '1.5',
    },
    errorLine: {
      margin: '2px 0',
      color: SAMSUNG_COLORS.text,
      fontSize: isMobile ? '13px' : '14px',
    },
    btnLogin: (isDisabled: boolean, isHovered: boolean) => ({
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
      position: 'relative' as const,
      overflow: 'hidden' as const,
      transform: !isDisabled && isHovered ? 'translateY(-2px)' : 'none',
      boxShadow: !isDisabled && isHovered ? 
        '0 10px 25px rgba(20, 40, 160, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' : 
        '0 6px 20px rgba(20, 40, 160, 0.2)',
      letterSpacing: '0.3px',
      marginTop: '8px',
    }),
    btnSpinner: {
      width: isMobile ? '20px' : '22px',
      height: isMobile ? '20px' : '22px',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    btnIcon: {
      fontSize: isMobile ? '20px' : '22px',
      fontWeight: 300,
      transition: 'transform 0.3s ease',
    },
    loginFooter: {
      marginTop: isMobile ? '24px' : '36px',
      paddingTop: isMobile ? '20px' : '28px',
      borderTop: `2px solid ${SAMSUNG_COLORS.grayDark}`,
      width: '100%',
    },
    versionInfo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '12px' : '16px',
      fontSize: isMobile ? '12px' : '13px',
      color: SAMSUNG_COLORS.textLight,
      flexWrap: 'wrap' as const,
    },
    version: {
      padding: isMobile ? '4px 12px' : '6px 16px',
      background: 'rgba(20, 40, 160, 0.08)',
      borderRadius: '8px',
      fontWeight: 600,
      color: SAMSUNG_COLORS.blueDark,
      whiteSpace: 'nowrap' as const,
    },
    statusIndicator: {
      width: '8px',
      height: '8px',
      background: SAMSUNG_COLORS.success,
      borderRadius: '50%',
      animation: 'pulse 2s infinite',
      boxShadow: `0 0 0 2px rgba(16, 185, 129, 0.2)`,
      flexShrink: 0,
    },
    copyright: {
      position: isMobile ? 'relative' as const : 'absolute' as const,
      bottom: isMobile ? '0' : isTablet ? '20px' : '24px',
      left: 0,
      right: 0,
      textAlign: 'center' as const,
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: isMobile ? '11px' : '12px',
      padding: isMobile ? '16px 0 0 0' : isTablet ? '0 16px' : '0',
      marginTop: isMobile ? '20px' : '0',
    },
  };

  // Estados para hover
  const [isHovered, setIsHovered] = useState({
    passwordToggle: false,
    loginBtn: false
  });

  return (
    <div style={styles.container}>
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
          
          @media (min-width: 768px) and (max-width: 1023px) {
            .login-wrapper {
              max-height: 90vh;
            }
          }
          
          @media (min-width: 1024px) {
            .login-wrapper {
              max-height: 85vh;
            }
          }
        `}
      </style>

      {/* Fondo animado */}
      <div style={styles.background}>
        <div style={styles.backgroundGradient} />
        <div style={styles.backgroundPattern} />
      </div>

      {/* Contenedor principal */}
      <div style={styles.loginWrapper}>
        
        {/* Panel izquierdo - Presentación */}
        <div style={styles.leftPanel}>
          <div>
            <div style={styles.logoContainer}>
              <div style={styles.logoCircle}>
                <span style={styles.logoIcon}>🔐</span>
              </div>
              <div style={styles.logoText}>
                <h1 style={styles.logoTitle}>Samsung IMEI</h1>
                <p style={styles.logoSubtitle}>Verification System Pro</p>
              </div>
            </div>
            
            <div style={styles.welcomeSection}>
              <h2 style={styles.welcomeTitle}>
                Sistema de Gestión Seguro
              </h2>
              <p style={styles.welcomeText}>
                Accede al sistema de verificación de IMEI más avanzado del mercado. 
                Protegido con cifrado de última generación y autenticación multifactor.
              </p>
            </div>
          </div>
          
          <div style={styles.copyright}>
            <p>Samsung Electronics © {new Date().getFullYear()} • Todos los derechos reservados</p>
          </div>
        </div>

        {/* Panel derecho - Login */}
        <div style={styles.rightPanel}>
          <div style={styles.loginHeader}>
            <h2 style={styles.loginTitle}>Acceso Seguro</h2>
            <p style={styles.loginSubtitle}>
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={styles.loginForm}>
            {/* Campo Usuario */}
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <span style={styles.labelIcon}>👤</span>
                Usuario autorizado
              </label>
              <div style={styles.inputContainer}>
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
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <span style={styles.labelIcon}>🔒</span>
                Contraseña segura
              </label>
              <div style={styles.inputContainer}>
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
                  style={styles.togglePassword(isHovered.passwordToggle)}
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
              <div style={styles.loadingState}>
                <div style={styles.samsungSpinner}></div>
                <div>
                  <p style={styles.loadingTextP}>Verificando credenciales...</p>
                  <small style={styles.loadingTextSmall}>
                    Autenticación en proceso, por favor espera
                  </small>
                </div>
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div style={styles.errorState} role="alert">
                <div style={styles.errorIcon}>⚠️</div>
                <div style={styles.errorContent}>
                  <p style={styles.errorTitle}>Error de autenticación</p>
                  <div style={styles.errorMessages}>
                    {error.split('\n').map((line, index) => (
                      <p key={index} style={styles.errorLine}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Botón de login */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              style={styles.btnLogin(loading || !username.trim() || !password.trim(), isHovered.loginBtn)}
              onMouseEnter={() => setIsHovered(prev => ({ ...prev, loginBtn: true }))}
              onMouseLeave={() => setIsHovered(prev => ({ ...prev, loginBtn: false }))}
              className="btn-hover-effect"
            >
              {loading ? (
                <>
                  <span style={styles.btnSpinner}></span>
                  Verificando...
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <span style={styles.btnIcon}>→</span>
                </>
              )}
            </button>

            {/* Footer del formulario */}
            <div style={styles.loginFooter}>
              <div style={styles.versionInfo}>
                <span style={styles.version}>v2.1.4 PRO</span>
                <span style={styles.statusIndicator}></span>
                <span>Sistema seguro • Conectado</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;