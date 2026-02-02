// Login.tsx - VERSIÓN REACT PURO CON ESTILOS SAMSUNG
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

// Constantes de colores Samsung
const SAMSUNG_COLORS = {
  blue: '#1428a0',
  blueLight: '#1e40ff',
  blueDark: '#0d1b66',
  gradient: 'linear-gradient(135deg, #1428a0 0%, #1e40ff 50%, #4a7dff 100%)',
  gray: '#f5f7fa',
  grayDark: '#e1e8f0',
  text: '#1a202c',
  textLight: '#718096',
  success: '#38b2ac',
  error: '#e53e3e',
  warning: '#ed8936',
  white: '#ffffff'
};

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hoverLogin, setHoverLogin] = useState(false);
  const [focusInput, setFocusInput] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Iniciando sesión...');
      await authService.login(username, password);
      
      console.log('✅ Login exitoso');
      // Animación de éxito antes de redirigir
      setTimeout(() => {
        navigate('/');
      }, 500);
      
    } catch (err: any) {
      console.error('❌ Error en login:', err);
      
      // Manejo detallado de errores
      if (err.code === 'ECONNABORTED') {
        setError('⏱️ El servidor está tardando en responder.\n' +
                'En la primera conexión puede tardar hasta 1 minuto.\n' +
                'Por favor, intenta nuevamente.');
      } else if (err.response) {
        switch (err.response.status) {
          case 401:
            setError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
            break;
          case 404:
            setError('Servicio no disponible temporalmente.');
            break;
          case 500:
            setError('Error interno del servidor. Contacta al administrador.');
            break;
          default:
            setError(`Error ${err.response.status}: No se pudo completar el login`);
        }
      } else if (err.request) {
        setError('No hay conexión con el servidor.\n' +
                'Verifica tu conexión a internet o contacta al administrador.');
      } else {
        setError('Error inesperado. Por favor, intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  // Estilos base
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
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
      zIndex: -1
    },
    backgroundGradient: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: SAMSUNG_COLORS.gradient,
      opacity: 0.95
    },
    backgroundPattern: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`
    },
    loginCard: {
      width: '100%',
      maxWidth: '440px',
      background: SAMSUNG_COLORS.white,
      borderRadius: '24px',
      padding: '40px',
      boxShadow: `0 20px 60px rgba(20, 40, 160, 0.15),
                  0 0 0 1px rgba(255, 255, 255, 0.1) inset`,
      backdropFilter: 'blur(10px)',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      zIndex: 1
    },
    cardTopBorder: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: SAMSUNG_COLORS.gradient,
      borderRadius: '24px 24px 0 0'
    },
    loginHeader: {
      textAlign: 'center' as const,
      marginBottom: '40px'
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      marginBottom: '24px'
    },
    logoCircle: {
      width: '56px',
      height: '56px',
      background: SAMSUNG_COLORS.gradient,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(20, 40, 160, 0.3)'
    },
    logoIcon: {
      fontSize: '28px',
      color: SAMSUNG_COLORS.white
    },
    logoText: {
      textAlign: 'left' as const
    },
    logoTitle: {
      fontSize: '24px',
      fontWeight: 700,
      color: SAMSUNG_COLORS.blueDark,
      margin: 0,
      letterSpacing: '-0.5px'
    },
    logoSubtitle: {
      fontSize: '14px',
      color: SAMSUNG_COLORS.textLight,
      margin: '4px 0 0 0',
      fontWeight: 500
    },
    welcomeSection: {
      h2: {
        fontSize: '28px',
        color: SAMSUNG_COLORS.text,
        marginBottom: '8px',
        fontWeight: 600
      },
      p: {
        color: SAMSUNG_COLORS.textLight,
        fontSize: '15px'
      }
    },
    loginForm: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px'
    },
    formLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '15px',
      fontWeight: 600,
      color: SAMSUNG_COLORS.text
    },
    labelIcon: {
      fontSize: '18px',
      opacity: 0.8
    },
    inputContainer: {
      position: 'relative' as const
    },
    formInput: (isPassword?: boolean, hasError?: boolean) => ({
      width: '100%',
      padding: isPassword ? '16px 52px 16px 20px' : '16px 20px',
      fontSize: '16px',
      border: `2px solid ${hasError ? SAMSUNG_COLORS.error : SAMSUNG_COLORS.grayDark}`,
      borderRadius: '12px',
      background: SAMSUNG_COLORS.white,
      transition: 'all 0.3s ease',
      outline: 'none',
      color: SAMSUNG_COLORS.text,
      '::placeholder': {
        color: SAMSUNG_COLORS.textLight,
        opacity: 0.6
      },
      ':focus': {
        borderColor: hasError ? SAMSUNG_COLORS.error : SAMSUNG_COLORS.blueLight,
        boxShadow: `0 0 0 4px ${hasError ? 'rgba(229, 62, 62, 0.1)' : 'rgba(20, 40, 160, 0.1)'}`,
        transform: 'translateY(-1px)'
      },
      ':disabled': {
        background: SAMSUNG_COLORS.gray,
        cursor: 'not-allowed'
      }
    }),
    togglePassword: {
      position: 'absolute' as const,
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: SAMSUNG_COLORS.textLight,
      padding: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s',
      ':hover': {
        background: SAMSUNG_COLORS.gray,
        color: SAMSUNG_COLORS.text
      }
    },
    demoSection: {
      marginTop: '8px',
      marginBottom: '8px'
    },
    btnDemo: {
      width: '100%',
      padding: '14px',
      background: 'rgba(20, 40, 160, 0.05)',
      border: `1px solid ${SAMSUNG_COLORS.grayDark}`,
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: 500,
      color: SAMSUNG_COLORS.blue,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      transition: 'all 0.3s',
      ':hover': {
        background: 'rgba(20, 40, 160, 0.1)',
        transform: 'translateY(-1px)'
      }
    },
    demoIcon: {
      fontSize: '18px'
    },
    loadingState: {
      background: 'rgba(20, 40, 160, 0.05)',
      border: `1px solid ${SAMSUNG_COLORS.grayDark}`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '16px'
    },
    samsungSpinner: {
      width: '24px',
      height: '24px',
      border: `3px solid ${SAMSUNG_COLORS.grayDark}`,
      borderTop: `3px solid ${SAMSUNG_COLORS.blue}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    loadingText: {
      flex: 1,
      p: {
        margin: '0 0 4px 0',
        fontWeight: 600,
        color: SAMSUNG_COLORS.text
      },
      small: {
        fontSize: '12px',
        color: SAMSUNG_COLORS.textLight,
        display: 'block'
      }
    },
    errorState: {
      background: 'rgba(229, 62, 62, 0.05)',
      border: `1px solid rgba(229, 62, 62, 0.2)`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      gap: '16px',
      marginBottom: '16px'
    },
    errorIcon: {
      fontSize: '24px',
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
      fontSize: '16px'
    },
    errorMessages: {
      lineHeight: '1.5'
    },
    errorLine: {
      margin: '4px 0',
      color: SAMSUNG_COLORS.text,
      fontSize: '14px'
    },
    btnLogin: (isLoading: boolean, isDisabled: boolean) => ({
      width: '100%',
      padding: '18px',
      background: isDisabled 
        ? SAMSUNG_COLORS.grayDark 
        : isLoading 
          ? SAMSUNG_COLORS.success
          : SAMSUNG_COLORS.gradient,
      color: isDisabled ? SAMSUNG_COLORS.textLight : SAMSUNG_COLORS.white,
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: 600,
      cursor: isDisabled || isLoading ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      ':hover': !isDisabled && !isLoading ? {
        transform: 'translateY(-2px)',
        boxShadow: '0 12px 24px rgba(20, 40, 160, 0.3)'
      } : {},
      ':active': !isDisabled && !isLoading ? {
        transform: 'translateY(0)'
      } : {}
    }),
    btnSpinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    btnIcon: {
      fontSize: '20px',
      fontWeight: 300
    },
    loginFooter: {
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: `1px solid ${SAMSUNG_COLORS.grayDark}`
    },
    footerLinks: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      marginBottom: '16px',
      flexWrap: 'wrap' as const
    },
    linkBtn: {
      background: 'none',
      border: 'none',
      color: SAMSUNG_COLORS.blue,
      fontSize: '14px',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '4px',
      transition: 'all 0.2s',
      ':hover': {
        background: 'rgba(20, 40, 160, 0.05)'
      }
    },
    separator: {
      color: SAMSUNG_COLORS.textLight,
      fontSize: '12px'
    },
    versionInfo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '12px',
      color: SAMSUNG_COLORS.textLight
    },
    version: {
      padding: '2px 8px',
      background: 'rgba(20, 40, 160, 0.1)',
      borderRadius: '4px',
      fontWeight: 500
    },
    statusIndicator: {
      width: '8px',
      height: '8px',
      background: SAMSUNG_COLORS.success,
      borderRadius: '50%',
      animation: 'pulse 2s infinite'
    },
    globalFooter: {
      marginTop: '40px',
      textAlign: 'center' as const,
      color: 'rgba(255,255,255,0.8)',
      fontSize: '14px'
    },
    footerContent: {
      p: {
        margin: '4px 0'
      }
    },
    footerNote: {
      fontSize: '12px',
      opacity: 0.8
    }
  };

  return (
    <div style={styles.container}>
      {/* Estilos globales */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes float {
            0% { transform: translateY(0) rotate(0deg); }
            100% { transform: translateY(-20px) rotate(1deg); }
          }
        `}
      </style>

      {/* Fondo animado */}
      <div style={styles.background}>
        <div style={styles.backgroundGradient} />
        <div style={{ ...styles.backgroundPattern, animation: 'float 20s ease-in-out infinite alternate' }} />
      </div>

      {/* Tarjeta de login */}
      <div style={styles.loginCard}>
        <div style={styles.cardTopBorder} />
        
        {/* Header */}
        <div style={styles.loginHeader}>
          <div style={styles.logoContainer}>
            <div style={styles.logoCircle}>
              <span style={styles.logoIcon}>🔐</span>
            </div>
            <div style={styles.logoText}>
              <h1 style={styles.logoTitle}>IMEI Verification</h1>
              <p style={styles.logoSubtitle}>Sistema de Gestión</p>
            </div>
          </div>
          
          <div style={styles.welcomeSection}>
            <h2 style={styles.welcomeSection.h2}>Bienvenido</h2>
            <p style={styles.welcomeSection.p}>Ingresa tus credenciales para acceder al sistema</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={styles.loginForm}>
          {/* Campo Usuario */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              <span style={styles.labelIcon}>👤</span>
              Usuario
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
                style={styles.formInput(false, !!error)}
                disabled={loading}
                autoComplete="username"
                onFocus={() => setFocusInput('username')}
                onBlur={() => setFocusInput(null)}
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              <span style={styles.labelIcon}>🔒</span>
              Contraseña
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
                style={styles.formInput(true, !!error)}
                disabled={loading}
                autoComplete="current-password"
                onFocus={() => setFocusInput('password')}
                onBlur={() => setFocusInput(null)}
              />
              <button
                type="button"
                style={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Botón Demo */}
          <div style={styles.demoSection}>
            <button
              type="button"
              onClick={handleDemoLogin}
              style={styles.btnDemo}
            >
              <span style={styles.demoIcon}>🚀</span>
              Usar credenciales de demo
            </button>
          </div>

          {/* Estado de carga */}
          {loading && (
            <div style={styles.loadingState}>
              <div style={styles.samsungSpinner}></div>
              <div style={styles.loadingText}>
                <p>Conectando con el servidor...</p>
                <small>Esto puede tardar unos segundos en la primera conexión</small>
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
            style={styles.btnLogin(loading, !username.trim() || !password.trim())}
            onMouseEnter={() => setHoverLogin(true)}
            onMouseLeave={() => setHoverLogin(false)}
          >
            {loading ? (
              <>
                <span style={styles.btnSpinner}></span>
                Procesando...
              </>
            ) : (
              <>
                <span style={styles.btnIcon}>→</span>
                Iniciar Sesión
              </>
            )}
          </button>

          {/* Footer del formulario */}
          <div style={styles.loginFooter}>
            <div style={styles.footerLinks}>
              <button type="button" style={styles.linkBtn}>
                ¿Olvidaste tu contraseña?
              </button>
              <span style={styles.separator}>•</span>
              <button type="button" style={styles.linkBtn}>
                Contactar soporte
              </button>
            </div>
            
            <div style={styles.versionInfo}>
              <span style={styles.version}>v2.1.4</span>
              <span style={styles.statusIndicator}></span>
              <span>Sistema activo</span>
            </div>
          </div>
        </form>
      </div>

      {/* Footer global */}
      <footer style={styles.globalFooter}>
        <div style={styles.footerContent}>
          <p style={styles.footerContent.p}>Samsung Style UI • IMEI Verification System © 2024</p>
          <p style={styles.footerNote}>
            Optimizado para Chrome, Safari y navegadores modernos
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Login;