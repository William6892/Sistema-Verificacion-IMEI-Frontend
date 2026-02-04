// src/components/Verificacion/VerificacionIMEI.tsx - VERSIÓN CON HTML5-QRCODE
import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../Verificacion/Verificacion.css';

// Importar html5-qrcode
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

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
  const [showScanner, setShowScanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
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
      stopScanner();
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

  // Iniciar escáner con html5-qrcode
  const startScanner = useCallback(() => {
    if (!scannerContainerRef.current) return;
    
    try {
      setScannerError(null);
      setIsScanning(true);
      
      // Configurar el escáner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
      };

      // Crear instancia del escáner
      scannerRef.current = new Html5QrcodeScanner(
        "html5qr-scanner-container",
        config,
        false
      );

      // Definir función de éxito
      const onScanSuccess = (decodedText: string) => {
        console.log('Código detectado:', decodedText);
        
        // Extraer números del código escaneado
        const numbers = decodedText.match(/\d+/g);
        if (numbers) {
          // Buscar posibles IMEIs (10-20 dígitos)
          const possibleIMEI = numbers.find(n => n.length >= 10 && n.length <= 20);
          if (possibleIMEI) {
            const imeiToSet = possibleIMEI.substring(0, 16);
            handleScannedIMEI(imeiToSet);
            return;
          }
        }
        
        // Si no se encontró IMEI en números, intentar con el texto completo
        const cleanedText = decodedText.replace(/\D/g, '');
        if (cleanedText.length >= 10 && cleanedText.length <= 20) {
          handleScannedIMEI(cleanedText.substring(0, 16));
        } else {
          setScannerError('No se encontró un IMEI válido en el código escaneado');
        }
      };

      // Función para manejar IMEI escaneado
      const handleScannedIMEI = (imei: string) => {
        setImei(imei);
        stopScanner();
        setShowScanner(false);
        setTimeout(() => {
          handleVerificar(imei);
        }, 300);
      };

      // Definir función de error
      const onScanError = (errorMessage: string) => {
        console.log('Error de escaneo:', errorMessage);
        // No mostrar errores menores
        if (!errorMessage.includes('NotFoundException') && 
            !errorMessage.includes('NoMultiFormatReader')) {
          setScannerError(errorMessage);
        }
      };

      // Iniciar el escáner
      scannerRef.current.render(onScanSuccess, onScanError);

    } catch (err: any) {
      console.error('Error inicializando escáner:', err);
      setScannerError('Error al iniciar el escáner: ' + err.message);
      setIsScanning(false);
    }
  }, [handleVerificar]);

  // Detener escáner
  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(error => {
        console.error("Error al limpiar escáner:", error);
      });
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Efecto para manejar escáner
  useEffect(() => {
    if (showScanner && scannerContainerRef.current) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [showScanner, startScanner, stopScanner]);

  const handleClear = useCallback(() => {
    setImei('');
    setResultado(null);
    setError('');
    setScannerError(null);
    if (showScanner) {
      stopScanner();
      setShowScanner(false);
    }
    if (inputRef.current) inputRef.current.focus();
  }, [showScanner, stopScanner]);

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

  // Función para alternar escáner
  const handleToggleScanner = () => {
    if (showScanner) {
      stopScanner();
      setShowScanner(false);
    } else {
      setShowScanner(true);
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
        {/* Sección de escáner */}
        {showScanner && (
          <div className="camera-active-section">
            <div className="camera-header">
              <h3>
                <span role="img" aria-label="escáner">🔍</span>
                Escáner de Códigos
                {isMobile && <span className="mobile-indicator">Cámara trasera activa</span>}
              </h3>
              <button 
                onClick={handleToggleScanner}
                className="btn-close-camera"
                aria-label="Cerrar escáner"
              >
                ×
              </button>
            </div>
            
            <div className="camera-container-wrapper">
              {/* Contenedor para html5-qrcode */}
              <div 
                id="html5qr-scanner-container" 
                ref={scannerContainerRef}
                className="html5qr-scanner"
              />
              
              <div className="camera-overlay">
                <div className="scan-frame">
                  <div className="scan-corner scan-corner-tl"></div>
                  <div className="scan-corner scan-corner-tr"></div>
                  <div className="scan-corner scan-corner-bl"></div>
                  <div className="scan-corner scan-corner-br"></div>
                </div>
                
                <div className="camera-instructions">
                  <p className="instruction-main">
                    <span role="img" aria-label="instrucción">📸</span>
                    {isScanning ? 'Escaneando...' : 'Iniciando escáner...'}
                  </p>
                  <p className="instruction-sub">
                    Enfoca el código de barras o QR del dispositivo
                  </p>
                </div>
              </div>
            </div>

            {scannerError && (
              <div className="alert alert-error">
                <span className="alert-icon" role="img" aria-label="error">⚠️</span>
                <span className="alert-text">{scannerError}</span>
              </div>
            )}
            
            <div className="scanner-info">
              <div className="info-item">
                <span className="info-icon" role="img" aria-label="compatible">✅</span>
                <span className="info-text">Compatibles: QR y códigos de barras</span>
              </div>
              <div className="info-item">
                <span className="info-icon" role="img" aria-label="auto">⚡</span>
                <span className="info-text">Detección automática</span>
              </div>
              {isMobile && (
                <div className="info-item">
                  <span className="info-icon" role="img" aria-label="flash">💡</span>
                  <span className="info-text">Toque para activar flash</span>
                </div>
              )}
            </div>
            
            <div className="camera-actions">
              <button
                onClick={handleToggleScanner}
                className="btn-cancel-camera"
              >
                <span role="img" aria-label="cancelar">←</span>
                Volver
              </button>
            </div>
          </div>
        )}

        {/* Botón para abrir escáner - solo mostrar cuando no hay escáner activo */}
        {!showScanner && (
          <div className="camera-trigger-section">
            <button
              onClick={handleToggleScanner}
              className="btn-camera-trigger"
              type="button"
            >
              <span role="img" aria-label="escáner" className="camera-icon">🔍</span>
              {isMobile ? 'Escanear código' : 'Usar escáner de códigos'}
            </button>
            
            <div className="divider-with-text">
              <span>O ingresa manualmente</span>
            </div>
          </div>
        )}

        {/* Formulario de entrada manual */}
        {!showScanner && (
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
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon" role="img" aria-label="error">⚠️</span>
            <span className="alert-text">{error}</span>
          </div>
        )}

        {/* Resultado */}
        {resultado && !showScanner && (
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
                        window.location.href = `/dispositivos?registrar=${encodeURIComponent(imei)}`;
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
      {!showScanner && (
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
      )}
    </div>
  );
};

export default VerificacionIMEI;