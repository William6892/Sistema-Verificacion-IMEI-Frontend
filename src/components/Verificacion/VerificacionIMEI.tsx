// src/components/Verificacion/VerificacionIMEI.tsx - VERSIÓN CORREGIDA
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import './Verificacion.css';

interface VerificacionIMEIProps {
  userRole?: string;
  userEmpresaId?: number;
}

interface ResultadoVerificacion {
  valido: boolean;
  dispositivoId?: number;
  personaNombre?: string;
  empresaNombre?: string;
  fechaRegistro?: string;
  mensaje?: string;
}

const VerificacionIMEI: React.FC<VerificacionIMEIProps> = ({ userRole, userEmpresaId }) => {
  const [imei, setImei] = useState('');
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(mobile || isTouchDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Función para calcular checksum Luhn (algoritmo real para IMEI)
  const calculateLuhnChecksum = (imei: string): number => {
    let sum = 0;
    const digits = imei.split('').map(Number);
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];
      
      if ((digits.length - i) % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
    }
    
    return sum % 10;
  };

  // Función mock para simular API
  const mockVerificarIMEI = async (imei: string): Promise<ResultadoVerificacion> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // Simular validación más realista
          const checksum = calculateLuhnChecksum(imei);
          const isValid = checksum === 0; // IMEI válido según algoritmo Luhn
          
          if (isValid) {
            resolve({
              valido: true,
              dispositivoId: Math.floor(Math.random() * 1000) + 1,
              personaNombre: 'Juan Pérez',
              empresaNombre: 'TechCorp Solutions',
              fechaRegistro: new Date().toISOString(),
              mensaje: 'Dispositivo registrado y autorizado'
            });
          } else {
            resolve({
              valido: false,
              mensaje: 'IMEI no registrado en el sistema o inválido'
            });
          }
        } catch (err) {
          resolve({
            valido: false,
            mensaje: 'Error procesando IMEI'
          });
        }
      }, 1500);
    });
  };

  // Detener scanner
  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear().catch(err => console.log('Error al limpiar scanner:', err));
        scannerRef.current = null;
      } catch (err) {
        console.error('Error deteniendo scanner:', err);
      }
    }
    setScanning(false);
  }, []);

  // Función principal de verificación
  const handleVerificar = useCallback(async (imeiToCheck?: string) => {
    const imeiToVerify = (imeiToCheck || imei).trim();
    
    if (!imeiToVerify) {
      setError('Por favor, ingresa un IMEI');
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    // Validación básica de IMEI
    if (imeiToVerify.length < 10 || imeiToVerify.length > 20 || !/^\d+$/.test(imeiToVerify)) {
      setError('IMEI inválido. Debe contener solo números (10-20 dígitos)');
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    setLoading(true);
    setError('');
    setResultado(null);

    try {
      const mockResult = await mockVerificarIMEI(imeiToVerify);
      setResultado(mockResult);
    } catch (err: any) {
      setError(err.message || 'Error al verificar IMEI');
    } finally {
      setLoading(false);
    }
  }, [imei]);

  // Iniciar scanner
  const startScanner = useCallback(async () => {
    if (scannerRef.current || !document.getElementById('camera-container')) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: isMobile ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      stream.getTracks().forEach(track => track.stop());
      
      const config = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
          return { width: size, height: size * 0.6 };
        },
        aspectRatio: 1.7777778,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      };

      scannerRef.current = new Html5QrcodeScanner(
        "camera-container",
        config,
        false
      );
      
      // Función local para manejar el código escaneado
      const onScanSuccess = (decodedText: string) => {
        // Extraer IMEI del código escaneado
        const imeiMatch = decodedText.match(/\b\d{15,16}\b/);
        
        if (imeiMatch) {
          const scannedImei = imeiMatch[0];
          setImei(scannedImei);
          
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          
          stopScanner();
          setShowCamera(false);
          
          setTimeout(() => {
            handleVerificar(scannedImei);
          }, 300);
        } else {
          const numbers = decodedText.match(/\d+/g);
          if (numbers) {
            const longNumber = numbers.find(num => num.length >= 10);
            if (longNumber) {
              const extractedImei = longNumber.substring(0, 16);
              setImei(extractedImei);
              setError('Número detectado. Verifica que sea un IMEI válido antes de verificar.');
              stopScanner();
              setShowCamera(false);
              if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(extractedImei.length, extractedImei.length);
              }
            } else {
              setError('No se encontró un IMEI válido en el código escaneado.');
            }
          } else {
            setError('No se encontró un IMEI válido en el código escaneado.');
          }
        }
      };
      
      const onScanError = (error: any) => {
        const errorMessage = error?.toString() || '';
        
        if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission')) {
          setError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara en ajustes.');
          setShowCamera(false);
        } else if (errorMessage.includes('NotFoundError')) {
          setError('No se encontró cámara en el dispositivo.');
          setShowCamera(false);
        } else if (errorMessage.includes('NotReadableError')) {
          setError('La cámara está siendo usada por otra aplicación.');
          setShowCamera(false);
        }
      };
      
      scannerRef.current.render(onScanSuccess, onScanError);
      
      setScanning(true);
      setError('');
      
    } catch (err: any) {
      console.error('Error inicializando cámara:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. Habilita la cámara en ajustes del navegador.');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara disponible.');
      } else if (err.name === 'NotReadableError') {
        setError('La cámara está siendo usada por otra aplicación.');
      } else {
        setError('Error al iniciar la cámara. Intenta de nuevo.');
      }
      
      setShowCamera(false);
      scannerRef.current = null;
    }
  }, [isMobile, stopScanner, handleVerificar]);

  // Inicializar scanner cuando se muestra la cámara
  useEffect(() => {
    if (showCamera && !scannerRef.current) {
      startScanner();
    } else if (!showCamera && scannerRef.current) {
      stopScanner();
    }
    
    return () => {
      if (showCamera && scannerRef.current) {
        stopScanner();
      }
    };
  }, [showCamera, startScanner, stopScanner]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerificar();
  };

  const handleClear = useCallback(() => {
    setImei('');
    setResultado(null);
    setError('');
    if (showCamera) {
      stopScanner();
      setShowCamera(false);
    }
    if (inputRef.current) inputRef.current.focus();
  }, [showCamera, stopScanner]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir solo números y teclas de control
    if (!/^\d$/.test(e.key) && 
        e.key !== 'Backspace' && 
        e.key !== 'Delete' && 
        e.key !== 'Tab' &&
        e.key !== 'Enter' &&
        e.key !== 'ArrowLeft' &&
        e.key !== 'ArrowRight' &&
        e.key !== 'Home' &&
        e.key !== 'End' &&
        e.key !== 'Escape') {
      e.preventDefault();
    }
    
    if (e.key === 'Enter' && imei.length >= 10) {
      handleVerificar();
    }
  };

  const formatDate = useCallback((dateString: string) => {
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
  }, []);

  const formatIMEI = useCallback((imei: string) => {
    const cleaned = imei.replace(/\D/g, '');
    if (cleaned.length <= 15) return cleaned;
    
    // Formato estándar IMEI: AA-BBBBBB-CCCCCC-D
    const parts = [
      cleaned.substring(0, 2),
      cleaned.substring(2, 8),
      cleaned.substring(8, 14),
      cleaned.substring(14)
    ].filter(part => part.length > 0);
    
    return parts.join('-');
  }, []);

  return (
    <div className="verificacion-container">
      {/* Header */}
      <div className="verificacion-header">
        <h1>
          <span role="img" aria-label="teléfono">📱</span>
          Verificación de IMEI
        </h1>
        <p className="subtitle">
          Escanea o ingresa un IMEI para verificar su estado en el sistema
        </p>
      </div>

      {/* Formulario principal */}
      <div className="verificacion-card">
        {/* Sección de cámara */}
        {showCamera && (
          <div className="camera-active-section">
            <div className="camera-header">
              <h3>
                <span role="img" aria-label="cámara">📷</span>
                Escanear IMEI
                {isMobile && <span className="mobile-indicator">Cámara trasera activa</span>}
              </h3>
              <button 
                onClick={() => {
                  stopScanner();
                  setShowCamera(false);
                }}
                className="btn-close-camera"
                aria-label="Cerrar cámara"
              >
                ×
              </button>
            </div>
            
            <div className="camera-container-wrapper">
              <div 
                id="camera-container" 
                ref={cameraContainerRef}
                className="camera-preview-box"
              />
              
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
                    <span role="img" aria-label="instrucción">📸</span>
                    Enfoca el código de barras o número IMEI
                  </p>
                  <p className="instruction-sub">
                    La detección es automática. Asegúrate de que el código esté bien iluminado.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                stopScanner();
                setShowCamera(false);
              }}
              className="btn-cancel-camera"
            >
              Cancelar escaneo
            </button>
          </div>
        )}

        {/* Botón para abrir cámara - solo mostrar cuando no hay cámara activa */}
        {!showCamera && (
          <div className="camera-trigger-section">
            <button
              onClick={() => {
                setShowCamera(true);
                setError('');
              }}
              className="btn-camera-trigger"
              type="button"
            >
              <span role="img" aria-label="cámara" className="camera-icon">📷</span>
              {isMobile ? 'Escanear con cámara' : 'Usar cámara para escanear'}
            </button>
            
            <div className="divider-with-text">
              <span>O ingresa manualmente</span>
            </div>
          </div>
        )}

        {/* Formulario de entrada manual */}
        <form onSubmit={handleSubmit} className="verification-form">
          <div className="form-field">
            <label className="field-label" htmlFor="imei-input">
              <span role="img" aria-label="número">🔢</span>
              Número IMEI
            </label>
            
            <div className="input-with-clear">
              <input
                id="imei-input"
                ref={inputRef}
                type="text"
                value={imei}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setImei(value);
                  if (error) setError('');
                }}
                onKeyDown={handleKeyPress}
                placeholder="Ej: 358879090123456"
                maxLength={20}
                className="imei-field"
                disabled={loading}
                inputMode="numeric"
                autoComplete="off"
              />
              
              {imei && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn-clear-field"
                  title="Limpiar campo"
                  aria-label="Limpiar campo"
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="field-hint">
              <span role="img" aria-label="consejo">💡</span>
              Teclea *#06# en el teléfono para ver el IMEI
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
                VERIFICANDO...
              </>
            ) : (
              <>
                <span role="img" aria-label="verificar">✅</span>
                VERIFICAR IMEI
              </>
            )}
          </button>
        </form>

        {/* Mensaje de error */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon" role="img" aria-label="error">⚠️</span>
            <span className="alert-text">{error}</span>
          </div>
        )}

        {/* Resultado */}
        {resultado && (
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
            
            <div className="result-info">
              {resultado.valido ? (
                <>
                  <div className="info-row">
                    <span className="info-label">
                      <span role="img" aria-label="persona">👤</span>
                      Propietario:
                    </span>
                    <span className="info-value">{resultado.personaNombre}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      <span role="img" aria-label="empresa">🏢</span>
                      Empresa:
                    </span>
                    <span className="info-value">{resultado.empresaNombre}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      <span role="img" aria-label="calendario">📅</span>
                      Registrado:
                    </span>
                    <span className="info-value">{formatDate(resultado.fechaRegistro!)}</span>
                  </div>
                </>
              ) : (
                <div className="result-message">
                  <p>{resultado.mensaje}</p>
                  {userRole === 'Admin' && (
                    <button className="btn-register-new" type="button">
                      <span role="img" aria-label="registrar">📝</span>
                      Registrar este IMEI
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <button 
              onClick={handleClear} 
              className="btn-reset"
              type="button"
            >
              <span role="img" aria-label="reiniciar">🔄</span>
              Nueva Verificación
            </button>
          </div>
        )}
      </div>

      {/* Panel de ayuda */}
      <div className="help-panel">
        <h3 className="help-title">
          <span role="img" aria-label="ayuda">📋</span>
          ¿Dónde encontrar el IMEI?
        </h3>
        <div className="help-items">
          <div className="help-card">
            <div className="help-number">1</div>
            <div className="help-content">
              <strong>Marcación rápida</strong>
              <p>Marca *#06# en el teléfono</p>
            </div>
          </div>
          <div className="help-card">
            <div className="help-number">2</div>
            <div className="help-content">
              <strong>Configuración</strong>
              <p>Ajustes → Acerca del teléfono</p>
            </div>
          </div>
          <div className="help-card">
            <div className="help-number">3</div>
            <div className="help-content">
              <strong>Caja original</strong>
              <p>Etiqueta del empaque</p>
            </div>
          </div>
          <div className="help-card">
            <div className="help-number">4</div>
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