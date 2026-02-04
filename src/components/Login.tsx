// Login.tsx - VERSIÓN SIN RECUPERAR CONTRASEÑA
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

  // Estilos base responsivos
  const getInputStyle = (type: 'username' | 'password') => {
    const isMobile = screenWidth < 768;
    const padding = isMobile 
      ? (type === 'password' ? '18px 56px 18px 24px' : '18px 24px') 
      : (type === 'password' ? '20px 60px 20px 28px' : '20px 28px');

    const baseStyle = {
      width: '100%',
      padding,
      fontSize: isMobile ? '16px' : '18px',
      border: `2px solid ${error ? SAMSUNG_COLORS.error : SAMSUNG_COLORS.grayDark}`,
      borderRadius: '14px',
      background: SAMSUNG_COLORS.white,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      color: SAMSUNG_COLORS.text,
      fontWeight: 500,
    };

    if (isFocused[type]) {
      return {
        ...baseStyle,
        borderColor: error ? SAMSUNG_COLORS.error : SAMSUNG_COLORS.blueLight,
        boxShadow: `0 0 0 4px ${error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(20, 40, 160, 0.15)'}`,
        transform: 'translateY(-2px)',
        background: 'linear-gradient(to bottom, #ffffff, #f8fafc)'
      };
    }

    return baseStyle;
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: screenWidth < 768 ? '16px' : '24px',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      background: SAMSUNG_COLORS.gray,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
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
    backgroundShapes: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden' as const
    },
    shape: {
      position: 'absolute' as const,
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    },
    loginWrapper: {
      display: 'flex',
      width: '100%',
      maxWidth: screenWidth < 768 ? '100%' : '1400px',
      height: screenWidth < 768 ? 'auto' : '85vh',
      minHeight: screenWidth < 768 ? '90vh' : '600px',
      borderRadius: screenWidth < 768 ? '20px' : '32px',
      overflow: 'hidden' as const,
      boxShadow: `
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset
      `,
      background: SAMSUNG_COLORS.white,
      position: 'relative' as const,
      zIndex: 1
    },
    leftPanel: {
      flex: screenWidth < 768 ? '0 0 100%' : '1',
      background: SAMSUNG_COLORS.gradientLight,
      padding: screenWidth < 768 ? '40px 32px' : '60px 48px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'space-between',
      position: 'relative' as const,
      overflow: 'hidden' as const
    },
    rightPanel: {
      flex: screenWidth < 768 ? '0 0 100%' : '1.2',
      padding: screenWidth < 768 ? '48px 32px' : '60px 48px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      background: SAMSUNG_COLORS.white
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: screenWidth < 768 ? '16px' : '20px',
      marginBottom: screenWidth < 768 ? '32px' : '48px'
    },
    logoCircle: {
      width: screenWidth < 768 ? '64px' : '80px',
      height: screenWidth < 768 ? '64px' : '80px',
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: screenWidth < 768 ? '20px' : '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
    },
    logoIcon: {
      fontSize: screenWidth < 768 ? '32px' : '40px',
      color: SAMSUNG_COLORS.white
    },
    logoText: {
      flex: 1
    },
    logoTitle: {
      fontSize: screenWidth < 768 ? '24px' : '32px',
      fontWeight: 700,
      color: SAMSUNG_COLORS.white,
      margin: 0,
      letterSpacing: '-0.5px'
    },
    logoSubtitle: {
      fontSize: screenWidth < 768 ? '14px' : '16px',
      color: 'rgba(255, 255, 255, 0.85)',
      margin: '8px 0 0 0',
      fontWeight: 400
    },
    welcomeSection: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center'
    },
    welcomeTitle: {
      fontSize: screenWidth < 768 ? '32px' : '48px',
      fontWeight: 700,
      color: SAMSUNG_COLORS.white,
      marginBottom: screenWidth < 768 ? '16px' : '24px',
      lineHeight: 1.1
    },
    welcomeText: {
      fontSize: screenWidth < 768 ? '16px' : '18px',
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: screenWidth < 768 ? '24px' : '32px',
      lineHeight: 1.6
    },
    featuresList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    featureItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: screenWidth < 768 ? '16px' : '20px',
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: screenWidth < 768 ? '14px' : '15px'
    },
    featureIcon: {
      fontSize: '20px',
      opacity: 0.9
    },
    loginHeader: {
      marginBottom: screenWidth < 768 ? '32px' : '48px',
      textAlign: 'center' as const
    },
    loginTitle: {
      fontSize: screenWidth < 768 ? '28px' : '36px',
      fontWeight: 700,
      color: SAMSUNG_COLORS.text,
      marginBottom: '12px',
      letterSpacing: '-0.5px'
    },
    loginSubtitle: {
      fontSize: screenWidth < 768 ? '16px' : '18px',
      color: SAMSUNG_COLORS.textLight,
      lineHeight: 1.5
    },
    loginForm: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: screenWidth < 768 ? '24px' : '32px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px'
    },
    formLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: screenWidth < 768 ? '15px' : '16px',
      fontWeight: 600,
      color: SAMSUNG_COLORS.text,
      paddingLeft: '8px'
    },
    labelIcon: {
      fontSize: '20px',
      opacity: 0.8
    },
    inputContainer: {
      position: 'relative' as const,
      width: '100%'
    },
    togglePassword: (isHovered: boolean) => ({
      position: 'absolute' as const,
      right: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      fontSize: '22px',
      cursor: 'pointer',
      color: isHovered ? SAMSUNG_COLORS.blueLight : SAMSUNG_COLORS.textLight,
      padding: '6px',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }),
    loadingState: {
      background: 'rgba(20, 40, 160, 0.03)',
      border: `2px solid ${SAMSUNG_COLORS.grayDark}`,
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '16px',
      backdropFilter: 'blur(10px)'
    },
    samsungSpinner: {
      width: '32px',
      height: '32px',
      border: `3px solid ${SAMSUNG_COLORS.grayDark}`,
      borderTop: `3px solid ${SAMSUNG_COLORS.blue}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    loadingTextP: {
      margin: '0 0 8px 0',
      fontWeight: 600,
      color: SAMSUNG_COLORS.text,
      fontSize: screenWidth < 768 ? '16px' : '18px'
    },
    loadingTextSmall: {
      fontSize: screenWidth < 768 ? '13px' : '14px',
      color: SAMSUNG_COLORS.textLight,
      display: 'block' as const
    },
    errorState: {
      background: 'rgba(239, 68, 68, 0.03)',
      border: `2px solid rgba(239, 68, 68, 0.2)`,
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      gap: '20px',
      marginBottom: '16px',
      backdropFilter: 'blur(10px)'
    },
    errorIcon: {
      fontSize: '28px',
      color: SAMSUNG_COLORS.error,
      flexShrink: 0
    },
    errorContent: {
      flex: 1
    },
    errorTitle: {
      margin: '0 0 8px 0',
      fontWeight: 600,
      color: SAMSUNG_COLORS.error,
      fontSize: screenWidth < 768 ? '16px' : '18px'
    },
    errorMessages: {
      lineHeight: '1.5'
    },
    errorLine: {
      margin: '4px 0',
      color: SAMSUNG_COLORS.text,
      fontSize: screenWidth < 768 ? '14px' : '15px'
    },
    btnLogin: (isDisabled: boolean, isHovered: boolean) => ({
      width: '100%',
      padding: screenWidth < 768 ? '20px' : '24px',
      background: isDisabled ? SAMSUNG_COLORS.grayDark : SAMSUNG_COLORS.gradient,
      color: isDisabled ? SAMSUNG_COLORS.textLight : SAMSUNG_COLORS.white,
      border: 'none',
      borderRadius: '16px',
      fontSize: screenWidth < 768 ? '17px' : '18px',
      fontWeight: 700,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      transform: !isDisabled && isHovered ? 'translateY(-3px) scale(1.01)' : 'none',
      boxShadow: !isDisabled && isHovered ? 
        '0 20px 40px rgba(20, 40, 160, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' : 
        '0 8px 24px rgba(20, 40, 160, 0.2)',
      letterSpacing: '0.5px'
    }),
    btnSpinner: {
      width: '24px',
      height: '24px',
      border: '3px solid rgba(255,255,255,0.3)',
      borderTop: '3px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    btnIcon: {
      fontSize: '24px',
      fontWeight: 300,
      transition: 'transform 0.3s ease'
    },
    loginFooter: {
      marginTop: screenWidth < 768 ? '32px' : '48px',
      paddingTop: screenWidth < 768 ? '24px' : '32px',
      borderTop: `2px solid ${SAMSUNG_COLORS.grayDark}`
    },
    // SE ELIMINARON los estilos de footerLinks y linkBtn
    versionInfo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      fontSize: screenWidth < 768 ? '13px' : '14px',
      color: SAMSUNG_COLORS.textLight,
      flexWrap: 'wrap' as const
    },
    version: {
      padding: '6px 16px',
      background: 'rgba(20, 40, 160, 0.08)',
      borderRadius: '12px',
      fontWeight: 600,
      color: SAMSUNG_COLORS.blueDark
    },
    statusIndicator: {
      width: '10px',
      height: '10px',
      background: SAMSUNG_COLORS.success,
      borderRadius: '50%',
      animation: 'pulse 2s infinite',
      boxShadow: `0 0 0 4px rgba(16, 185, 129, 0.2)`
    },
    copyright: {
      position: 'absolute' as const,
      bottom: screenWidth < 768 ? '20px' : '32px',
      left: 0,
      right: 0,
      textAlign: 'center' as const,
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: screenWidth < 768 ? '13px' : '14px',
      padding: screenWidth < 768 ? '0 16px' : '0'
    }
  };

  // Estados para hover (solo los necesarios ahora)
  const [isHovered, setIsHovered] = useState({
    passwordToggle: false,
    loginBtn: false
    // SE ELIMINARON forgotBtn y supportBtn
  });

  // Generar formas de fondo dinámicas
  const generateShapes = () => {
    const shapes = [];
    for (let i = 0; i < 15; i++) {
      const size = Math.random() * 200 + 50;
      shapes.push({
        ...styles.shape,
        width: `${size}px`,
        height: `${size}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animation: `float ${Math.random() * 20 + 20}s ease-in-out infinite alternate`,
        animationDelay: `${Math.random() * 5}s`
      });
    }
    return shapes;
  };

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
              transform: translateY(-40px) rotate(2deg); 
            }
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
            width: 300px;
            height: 300px;
          }
          
          @media (max-width: 768px) {
            .mobile-hide {
              display: none;
            }
          }
        `}
      </style>

      {/* Fondo animado mejorado */}
      <div style={styles.background}>
        <div style={styles.backgroundGradient} />
        <div style={styles.backgroundPattern} />
        <div style={styles.backgroundShapes}>
          {generateShapes().map((shapeStyle, index) => (
            <div key={index} style={shapeStyle} />
          ))}
        </div>
      </div>

      {/* Contenedor principal dividido en dos paneles */}
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
                Sistema de Gestión <br />Seguro
              </h2>
              <p style={styles.welcomeText}>
                Accede al sistema de verificación de IMEI más avanzado del mercado. 
                Protegido con cifrado de última generación y autenticación multifactor.
              </p>
              
              <ul style={styles.featuresList} className="mobile-hide">
                <li style={styles.featureItem}>
                  <span style={styles.featureIcon}>✅</span>
                  Verificación en tiempo real
                </li>
                <li style={styles.featureItem}>
                  <span style={styles.featureIcon}>✅</span>
                  Cifrado AES-256
                </li>
                <li style={styles.featureItem}>
                  <span style={styles.featureIcon}>✅</span>
                  Auditoría completa
                </li>
                <li style={styles.featureItem}>
                  <span style={styles.featureIcon}>✅</span>
                  Soporte 24/7
                </li>
              </ul>
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
              {/* SE ELIMINÓ la sección de footerLinks */}
              
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