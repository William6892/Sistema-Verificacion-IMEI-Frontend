// Login.tsx - VERSIÓN SEGURA SIN CREDENCIALES DEMO
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
  const [isFocused, setIsFocused] = useState({
    username: false,
    password: false
  });
  
  const navigate = useNavigate();

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

  // Estilos base
  const getInputStyle = (type: 'username' | 'password') => {
    const baseStyle = {
      width: '100%',
      padding: type === 'password' ? '16px 52px 16px 20px' : '16px 20px',
      fontSize: '16px',
      border: `2px solid ${error ? SAMSUNG_COLORS.error : SAMSUNG_COLORS.grayDark}`,
      borderRadius: '12px',
      background: SAMSUNG_COLORS.white,
      transition: 'all 0.3s ease',
      outline: 'none',
      color: SAMSUNG_COLORS.text,
    };

    if (isFocused[type]) {
      return {
        ...baseStyle,
        borderColor: error ? SAMSUNG_COLORS.error : SAMSUNG_COLORS.blueLight,
        boxShadow: `0 0 0 4px ${error ? 'rgba(229, 62, 62, 0.1)' : 'rgba(20, 40, 160, 0.1)'}`,
        transform: 'translateY(-1px)'
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
    welcomeTitle: {
      fontSize: '28px',
      color: SAMSUNG_COLORS.text,
      marginBottom: '8px',
      fontWeight: 600,
      textAlign: 'center' as const
    },
    welcomeText: {
      color: SAMSUNG_COLORS.textLight,
      fontSize: '15px',
      textAlign: 'center' as const,
      lineHeight: 1.5
    },
    securityNote: {
      fontSize: '12px',
      color: SAMSUNG_COLORS.textLight,
      textAlign: 'center' as const,
      marginTop: '16px',
      padding: '12px',
      background: 'rgba(20, 40, 160, 0.03)',
      borderRadius: '8px',
      border: `1px solid ${SAMSUNG_COLORS.grayDark}`
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
    togglePassword: (isHovered: boolean) => ({
      position: 'absolute' as const,
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: isHovered ? SAMSUNG_COLORS.gray : 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: isHovered ? SAMSUNG_COLORS.text : SAMSUNG_COLORS.textLight,
      padding: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s'
    }),
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
    loadingTextP: {
      margin: '0 0 4px 0',
      fontWeight: 600,
      color: SAMSUNG_COLORS.text
    },
    loadingTextSmall: {
      fontSize: '12px',
      color: SAMSUNG_COLORS.textLight,
      display: 'block' as const
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
    btnLogin: (isDisabled: boolean, isHovered: boolean) => ({
      width: '100%',
      padding: '18px',
      background: isDisabled ? SAMSUNG_COLORS.grayDark : SAMSUNG_COLORS.gradient,
      color: isDisabled ? SAMSUNG_COLORS.textLight : SAMSUNG_COLORS.white,
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: 600,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      transform: !isDisabled && isHovered ? 'translateY(-2px)' : 'none',
      boxShadow: !isDisabled && isHovered ? '0 12px 24px rgba(20, 40, 160, 0.3)' : 'none'
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
    linkBtn: (isHovered: boolean) => ({
      background: isHovered ? 'rgba(20, 40, 160, 0.05)' : 'none',
      border: 'none',
      color: SAMSUNG_COLORS.blue,
      fontSize: '14px',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '4px',
      transition: 'all 0.2s'
    }),
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
    footerText: {
      margin: '4px 0'
    },
    footerNote: {
      fontSize: '12px',
      opacity: 0.8
    }
  };

  // Estados para hover
  const [isHovered, setIsHovered] = useState({
    passwordToggle: false,
    loginBtn: false,
    forgotBtn: false,
    supportBtn: false
  });

  return (
    <div style={styles.container}>
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
          
          .samsung-input:disabled {
            background: #f5f7fa;
            cursor: not-allowed;
          }
          
          .samsung-input::placeholder {
            color: #718096;
            opacity: 0.6;
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
              <p style={styles.logoSubtitle}>Sistema de Gestión Seguro</p>
            </div>
          </div>
          
          <div>
            <h2 style={styles.welcomeTitle}>Acceso Seguro</h2>
            <p style={styles.welcomeText}>Ingresa tus credenciales autorizadas</p>
            
            {/* Nota de seguridad */}
            <div style={styles.securityNote}>
              🔒 Sistema protegido con autenticación segura
            </div>
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
                placeholder="Usuario autorizado"
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
                placeholder="Contraseña segura"
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
                  Por favor, espera
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
          >
            {loading ? (
              <>
                <span style={styles.btnSpinner}></span>
                Verificando...
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
              <button 
                type="button" 
                style={styles.linkBtn(isHovered.forgotBtn)}
                onMouseEnter={() => setIsHovered(prev => ({ ...prev, forgotBtn: true }))}
                onMouseLeave={() => setIsHovered(prev => ({ ...prev, forgotBtn: false }))}
                onClick={() => {/* Lógica de recuperación de contraseña */}}
              >
                Recuperar acceso
              </button>
              <span style={styles.separator}>•</span>
              <button 
                type="button" 
                style={styles.linkBtn(isHovered.supportBtn)}
                onMouseEnter={() => setIsHovered(prev => ({ ...prev, supportBtn: true }))}
                onMouseLeave={() => setIsHovered(prev => ({ ...prev, supportBtn: false }))}
                onClick={() => {/* Lógica de contacto */}}
              >
                Soporte técnico
              </button>
            </div>
            
            <div style={styles.versionInfo}>
              <span style={styles.version}>v2.1.4</span>
              <span style={styles.statusIndicator}></span>
              <span>Sistema seguro</span>
            </div>
          </div>
        </form>
      </div>

      {/* Footer global */}
      <footer style={styles.globalFooter}>
        <div>
          <p style={styles.footerText}>Samsung Style UI • IMEI Verification System © {new Date().getFullYear()}</p>
          <p style={styles.footerNote}>
            Sistema protegido. Acceso restringido a personal autorizado
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Login;