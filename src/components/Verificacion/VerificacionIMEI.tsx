// src/components/Verificacion/VerificacionIMEI.tsx - VERSIÓN RESPONSIVE CON CÁMARA MÓVIL OPTIMIZADA
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './Verificacion.css';

interface VerificacionIMEIProps {
  userRole?: string;
  userEmpresaId?: number;
}

const VerificacionIMEI: React.FC<VerificacionIMEIProps> = ({ userRole, userEmpresaId }) => {
  const [imei, setImei] = useState('');
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const smallScreen = window.innerWidth <= 768;
      setIsMobile(mobile || smallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Manejar scanner de cámara
  useEffect(() => {
    if (showCamera) {
      startScanner();
    } else {
      stopScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [showCamera]);

  const startScanner = async () => {
    if (scannerRef.current || !cameraContainerRef.current) return;
    
    try {
      const html5QrCode = new Html5Qrcode("camera-container");
      scannerRef.current = html5QrCode;
      
      // Configuración optimizada para móviles
      const qrboxSize = isMobile 
        ? Math.min(250, window.innerWidth - 80)
        : 300;
      
      const config = {
        fps: 10,
        qrbox: {
          width: qrboxSize,
          height: Math.floor(qrboxSize * 0.6)
        },
        aspectRatio: 1.777778,
        disableFlip: false,
      };

      // Preferir cámara trasera en móviles
      const cameraConfig = isMobile 
        ? { facingMode: "environment" }
        : { facingMode: "user" };

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText) => {
          handleScannedCode(decodedText);
        },
        (errorMessage) => {
          // Silenciar errores de escaneo normal
        }
      );
      
      setScanning(true);
      setError('');
      
    } catch (err: any) {
      console.error('Error inicializando cámara:', err);
      
      let errorMsg = '❌ No se pudo iniciar la cámara.';
      
      if (err.name === 'NotAllowedError') {
        errorMsg = '🚫 Permiso de cámara denegado. Por favor, permite el acceso en la configuración de tu navegador.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = '📵 No se encontró ninguna cámara disponible.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = '⚠️ La cámara está siendo usada por otra aplicación.';
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = '🔄 Error de configuración. Intenta con otra cámara.';
      }
      
      setError(errorMsg);
      setShowCamera(false);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error deteniendo scanner:', err);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScannedCode = async (code: string) => {
    console.log('Código escaneado:', code);
    
    // Intentar extraer IMEI (15-16 dígitos)
    const imeiMatch = code.match(/\b\d{15,16}\b/);
    
    if (imeiMatch) {
      const scannedImei = imeiMatch[0];
      setImei(scannedImei);
      
      // Detener scanner
      await stopScanner();
      setShowCamera(false);
      
      // Vibración de éxito en móviles
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      
      // Auto-verificar
      setTimeout(() => {
        handleVerificar(scannedImei);
      }, 300);
      
    } else {
      // Buscar cualquier secuencia larga de números
      const longNumberMatch = code.match(/\d{10,}/);
      if (longNumberMatch) {
        const possibleImei = longNumberMatch[0].substring(0, 16);
        setImei(possibleImei);
        setError('⚠️ Número detectado. Verifica que sea correcto.');
      }
    }
  };

  const handleVerificar = async (imeiToCheck?: string) => {
    const imeiToVerify = imeiToCheck || imei;
    
    if (!imeiToVerify.trim()) {
      setError('Por favor, ingresa un IMEI');
      return;
    }

    if (imeiToVerify.length < 10 || imeiToVerify.length > 20 || !/^\d+$/.test(imeiToVerify)) {
      setError('IMEI inválido. Debe contener solo números (10-20 dígitos)');
      return;
    }

    setLoading(true);
    setError('');
    setResultado(null);

    try {
      // SIMULAR LLAMADA A API - REEMPLAZA CON TU API REAL
      const mockResult = await mockVerificarIMEI(imeiToVerify);
      setResultado(mockResult);
      
      // Vibración de feedback en móviles
      if (navigator.vibrate) {
        navigator.vibrate(mockResult.valido ? [100] : [200, 100, 200]);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error al verificar IMEI');
    } finally {
      setLoading(false);
    }
  };

  // Función mock para simular API
  const mockVerificarIMEI = async (imei: string): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const imeiLastDigit = parseInt(imei.slice(-1));
        const isValid = imeiLastDigit % 3 !== 0;
        
        if (isValid) {
          resolve({
            valido: true,
            dispositivoId: Math.floor(Math.random() * 1000) + 1,
            personaNombre: 'Juan Pérez',
            empresaNombre: 'TechCorp Solutions',
            fechaRegistro: new Date().toISOString()
          });
        } else {
          resolve({
            valido: false,
            mensaje: 'IMEI no registrado en el sistema'
          });
        }
      }, 1500);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerificar();
  };

  const handleClear = async () => {
    setImei('');
    setResultado(null);
    setError('');
    if (showCamera) {
      await stopScanner();
      setShowCamera(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!/^\d$/.test(e.key) && 
        !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
    
    if (e.key === 'Enter' && imei.length >= 10) {
      handleVerificar();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatIMEI = (imei: string) => {
    if (imei.length <= 8) return imei;
    const parts = [
      imei.substring(0, 2),
      imei.substring(2, 8),
      imei.substring(8, 14),
      imei.substring(14)
    ].filter(part => part.length > 0);
    return parts.join('-');
  };

  return (
    <div className="verificacion-container">
      {/* Header */}
      <div className="verificacion-header">
        <h1>📱 Verificación de IMEI</h1>
        <p className="subtitle">Escanea o ingresa un IMEI para verificar su estado</p>
      </div>

      {/* Formulario principal */}
      <div className="verificacion-card">
        {/* Sección de cámara */}
        {showCamera ? (
          <div className="camera-active-section">
            <div className="camera-header">
              <h3>📷 Escanear IMEI</h3>
              <button 
                onClick={async () => {
                  await stopScanner();
                  setShowCamera(false);
                }}
                className="btn-close-camera"
                aria-label="Cerrar cámara"
              >
                ✕
              </button>
            </div>
            
            <div className="camera-container-wrapper">
              <div 
                id="camera-container" 
                ref={cameraContainerRef}
                className="camera-preview-box"
              />
              
              {scanning && (
                <div className="camera-overlay">
                  <div className="scan-frame">
                    <div className="scan-corner scan-corner-tl"></div>
                    <div className="scan-corner scan-corner-tr"></div>
                    <div className="scan-corner scan-corner-bl"></div>
                    <div className="scan-corner scan-corner-br"></div>
                    <div className="scan-line"></div>
                  </div>
                  
                  <div className="camera-instructions">
                    <p className="instruction-main">
                      📸 Enfoca el código de barras o IMEI
                    </p>
                    <p className="instruction-sub">
                      La detección es automática
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={async () => {
                await stopScanner();
                setShowCamera(false);
              }}
              className="btn-cancel-camera"
            >
              Cancelar escaneo
            </button>
          </div>
        ) : (
          <>
            {/* Botón para abrir cámara */}
            <div className="camera-trigger-section">
              <button
                onClick={() => {
                  setShowCamera(true);
                  setError('');
                }}
                className="btn-camera-trigger"
                type="button"
              >
                <svg className="camera-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Escanear con cámara</span>
              </button>
              
              <div className="divider-with-text">
                <span>O ingresa manualmente</span>
              </div>
            </div>

            {/* Formulario de ingreso manual */}
            <form onSubmit={handleSubmit} className="verification-form">
              <div className="form-field">
                <label htmlFor="imei" className="field-label">
                  🔢 Número IMEI
                </label>
                
                <div className="input-with-clear">
                  <input
                    id="imei"
                    type="text"
                    value={imei}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setImei(value);
                      if (error) setError('');
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="358879090123456"
                    maxLength={20}
                    className="imei-field"
                    disabled={loading}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                  />
                  
                  {imei && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="btn-clear-field"
                      aria-label="Limpiar"
                    >
                      ×
                    </button>
                  )}
                </div>
                
                <div className="field-hint">
                  💡 Marca *#06# en tu teléfono para ver el IMEI
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !imei.trim() || imei.length < 10}
                className={`btn-submit ${loading ? 'btn-loading' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Verificando...
                  </>
                ) : (
                  'Verificar IMEI'
                )}
              </button>
            </form>
          </>
        )}

        {/* Mensaje de error */}
        {error && !showCamera && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{error}</span>
          </div>
        )}

        {/* Resultado */}
        {resultado && !showCamera && (
          <div className={`result-card ${resultado.valido ? 'result-valid' : 'result-invalid'}`}>
            <div className="result-status">
              <div className="status-badge">
                {resultado.valido ? '✅' : '❌'}
              </div>
              <div className="status-text">
                <h3 className="status-title">
                  {resultado.valido ? 'IMEI AUTORIZADO' : 'IMEI NO REGISTRADO'}
                </h3>
                <p className="status-imei">{formatIMEI(imei)}</p>
              </div>
            </div>
            
            {resultado.valido ? (
              <div className="result-info">
                <div className="info-row">
                  <span className="info-label">👤 Propietario</span>
                  <span className="info-value">{resultado.personaNombre}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">🏢 Empresa</span>
                  <span className="info-value">{resultado.empresaNombre}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">📅 Registrado</span>
                  <span className="info-value">{formatDate(resultado.fechaRegistro)}</span>
                </div>
              </div>
            ) : (
              <div className="result-message">
                <p>El IMEI no está registrado en la base de datos.</p>
                {userRole === 'Admin' && (
                  <button className="btn-register-new">
                    📝 Registrar este IMEI
                  </button>
                )}
              </div>
            )}
            
            <button onClick={handleClear} className="btn-reset">
              🔄 Nueva Verificación
            </button>
          </div>
        )}
      </div>

      {/* Sección de ayuda */}
      <div className="help-panel">
        <h3 className="help-title">📋 ¿Dónde encontrar el IMEI?</h3>
        <div className="help-items">
          <div className="help-card">
            <span className="help-number">1</span>
            <div className="help-content">
              <strong>Marcador</strong>
              <p>*#06#</p>
            </div>
          </div>
          <div className="help-card">
            <span className="help-number">2</span>
            <div className="help-content">
              <strong>Ajustes</strong>
              <p>Acerca del teléfono</p>
            </div>
          </div>
          <div className="help-card">
            <span className="help-number">3</span>
            <div className="help-content">
              <strong>Caja</strong>
              <p>Etiqueta del empaque</p>
            </div>
          </div>
          <div className="help-card">
            <span className="help-number">4</span>
            <div className="help-content">
              <strong>Batería</strong>
              <p>Debajo (si es removible)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificacionIMEI;