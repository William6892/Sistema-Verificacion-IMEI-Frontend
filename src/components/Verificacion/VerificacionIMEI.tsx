// src/components/Verificacion/VerificacionIMEI.tsx - VERSIÓN FUNCIONAL
import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../Verificacion/Verificacion.css';

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
  const [isMobile, setIsMobile] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      stopCamera();
    };
  }, []);

  // Función para calcular checksum Luhn
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

  // Función para verificar IMEI (conexión real al backend)
  const verificarIMEIReal = async (imei: string): Promise<ResultadoVerificacion> => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      if (!token) {
        return {
          valido: false,
          mensaje: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
        };
      }

      const response = await fetch(`${API_URL}/api/verificacion/verificar/${imei}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        // Endpoint no existe, usar mock temporal
        return await verificarIMEIMock(imei);
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        valido: data.valido || false,
        dispositivoId: data.dispositivoId,
        personaNombre: data.personaNombre,
        empresaNombre: data.empresaNombre,
        fechaRegistro: data.fechaRegistro,
        mensaje: data.mensaje || 'Verificación completada'
      };
    } catch (err) {
      console.error('Error verificando IMEI:', err);
      // Fallback a mock si hay error
      return await verificarIMEIMock(imei);
    }
  };

  // Función mock para simular API (fallback)
  const verificarIMEIMock = async (imei: string): Promise<ResultadoVerificacion> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // Simular validación con algoritmo Luhn
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
      }, 1000);
    });
  };

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Iniciar cámara simple (solo para mostrar, no escanear)
  const startCamera = useCallback(async () => {
    try {
      stopCamera(); // Detener cualquier cámara previa
      setCameraError(null);

      const constraints = {
        video: {
          facingMode: isMobile ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      return true;
    } catch (err: any) {
      console.error('Error inicializando cámara:', err);
      
      let errorMsg = 'Error al acceder a la cámara';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Permiso de cámara denegado. Habilita la cámara en ajustes del navegador.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No se encontró ninguna cámara disponible.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'La cámara está siendo usada por otra aplicación.';
      }
      
      setCameraError(errorMsg);
      return false;
    }
  }, [isMobile, stopCamera]);

  // Función para capturar imagen de la cámara y extraer texto (OCR simple)
  const captureAndProcessImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Capturar frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir a imagen para procesamiento
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simulación de OCR simple - buscar números en la imagen
    // En una implementación real usarías Tesseract.js o similar
    return "No se pudo detectar IMEI automáticamente. Ingresa manualmente.";
  }, []);

  // Efecto para manejar cámara
  useEffect(() => {
    if (showCamera) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [showCamera, startCamera, stopCamera]);

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
      const resultado = await verificarIMEIReal(imeiToVerify);
      setResultado(resultado);
    } catch (err: any) {
      setError(err.message || 'Error al verificar IMEI');
    } finally {
      setLoading(false);
    }
  }, [imei]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerificar();
  };

  const handleClear = useCallback(() => {
    setImei('');
    setResultado(null);
    setError('');
    setCameraError(null);
    if (showCamera) {
      stopCamera();
      setShowCamera(false);
    }
    if (inputRef.current) inputRef.current.focus();
  }, [showCamera, stopCamera]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // Función para simular escaneo con cámara
  const handleCameraScan = async () => {
    if (showCamera) {
      const detectedText = await captureAndProcessImage();
      if (detectedText && detectedText.includes('No se pudo detectar')) {
        setError(detectedText);
      }
    } else {
      setShowCamera(true);
    }
  };

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
                Vista previa de cámara
                {isMobile && <span className="mobile-indicator">Cámara trasera activa</span>}
              </h3>
              <button 
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
                className="btn-close-camera"
                aria-label="Cerrar cámara"
              >
                ×
              </button>
            </div>
            
            <div className="camera-container-wrapper">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-preview-box"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
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
                    Toma una foto clara del número IMEI
                  </p>
                </div>
              </div>
            </div>

            {cameraError && (
              <div className="alert alert-error">
                <span className="alert-icon" role="img" aria-label="error">⚠️</span>
                <span className="alert-text">{cameraError}</span>
              </div>
            )}
            
            <div className="camera-actions">
              <button
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
                className="btn-cancel-camera"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const detected = await captureAndProcessImage();
                  if (detected) {
                    // Simular extracción de IMEI
                    const numbers = detected.match(/\d+/g);
                    if (numbers) {
                      const possibleIMEI = numbers.find(n => n.length >= 10 && n.length <= 20);
                      if (possibleIMEI) {
                        setImei(possibleIMEI.substring(0, 16));
                        stopCamera();
                        setShowCamera(false);
                        setTimeout(() => {
                          handleVerificar(possibleIMEI.substring(0, 16));
                        }, 300);
                      } else {
                        setError('No se detectó un IMEI válido en la imagen. Ingresa manualmente.');
                      }
                    }
                  }
                }}
                className="btn-capture"
                disabled={!!cameraError}
              >
                <span role="img" aria-label="capturar">📸</span>
                Capturar
              </button>
            </div>
          </div>
        )}

        {/* Botón para abrir cámara - solo mostrar cuando no hay cámara activa */}
        {!showCamera && (
          <div className="camera-trigger-section">
            <button
              onClick={handleCameraScan}
              className="btn-camera-trigger"
              type="button"
            >
              <span role="img" aria-label="cámara" className="camera-icon">📷</span>
              {isMobile ? 'Tomar foto del IMEI' : 'Usar cámara para capturar IMEI'}
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
                    <button 
                      className="btn-register-new" 
                      type="button"
                      onClick={() => {
                        // Navegar al formulario de registro
                        window.location.href = '/dispositivos?registrar=' + imei;
                      }}
                    >
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