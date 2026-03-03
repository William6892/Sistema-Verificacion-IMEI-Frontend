// src/components/Verificacion/VerificacionIMEI.tsx - VERSIÓN MEJORADA CON CÁMARA GRANDE Y TRASERA
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
  personaId?: number;
  empresaNombre?: string;
  empresaId?: number;
  fechaRegistro?: string;
  mensaje?: string;
  modelo?: string;
  marca?: string;
  estado?: string;
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
  const [cameraInitializing, setCameraInitializing] = useState(false);
  
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

  // Función principal de verificación
  const verificarIMEI = async (imei: string): Promise<ResultadoVerificacion> => {
    const cleanedIMEI = imei.replace(/\D/g, '');
    
    if (cleanedIMEI.length < 10 || cleanedIMEI.length > 20) {
      return {
        valido: false,
        mensaje: 'IMEI inválido. Debe tener entre 10 y 20 dígitos'
      };
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        return {
          valido: false,
          mensaje: 'Sesión expirada. Por favor, inicie sesión nuevamente.'
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/api/verificacion/verificar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          IMEI: cleanedIMEI
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let responseText = '';
      try {
        responseText = await response.text();
        console.log('📦 Response body:', responseText);
      } catch (e) {
        console.error('❌ Error leyendo respuesta:', e);
      }

      if (response.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        return {
          valido: false,
          mensaje: 'Sesión expirada. Por favor, inicie sesión nuevamente.'
        };
      }

      if (response.status === 400) {
        try {
          const errorData = JSON.parse(responseText);
          return {
            valido: false,
            mensaje: errorData.mensaje || errorData.message || 'Error en la solicitud'
          };
        } catch {
          return {
            valido: false,
            mensaje: 'Formato de IMEI inválido'
          };
        }
      }

      if (!response.ok) {
        return {
          valido: false,
          mensaje: `Error del servidor: ${response.status} ${response.statusText || ''}`
        };
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error parseando respuesta:', parseError);
        return {
          valido: false,
          mensaje: 'Error procesando respuesta del servidor'
        };
      }

      return {
        valido: data.valido || false,
        dispositivoId: data.dispositivo?.id || data.dispositivoId,
        personaNombre: data.persona?.nombre || data.personaNombre,
        personaId: data.persona?.id || data.personaId,
        empresaNombre: data.empresa?.nombre || data.empresaNombre,
        empresaId: data.empresa?.id || data.empresaId,
        fechaRegistro: data.dispositivo?.fechaRegistro || data.fechaRegistro,
        mensaje: data.mensaje || 'Verificación completada'
      };

    } catch (err: any) {
      console.error('❌ Error de conexión:', err);
      
      if (err.name === 'AbortError') {
        return {
          valido: false,
          mensaje: 'Tiempo de espera agotado. Verifique su conexión.'
        };
      }
      
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        return {
          valido: false,
          mensaje: 'No se pudo conectar con el servidor. Verifique su conexión.'
        };
      }
      
      return {
        valido: false,
        mensaje: 'Error de conexión con el servidor.'
      };
    }
  };

  // Función principal de verificación
  const handleVerificar = useCallback(async (imeiToCheck?: string) => {
    const imeiToVerify = (imeiToCheck || imei).trim();
    
    if (!imeiToVerify) {
      setError('Por favor, ingresa un IMEI');
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    const cleanedIMEI = imeiToVerify.replace(/\D/g, '');
    if (cleanedIMEI.length < 10 || cleanedIMEI.length > 20) {
      setError('IMEI inválido. Debe contener solo números (10-20 dígitos)');
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    setLoading(true);
    setError('');
    setResultado(null);

    try {
      const resultado = await verificarIMEI(cleanedIMEI);
      setResultado(resultado);
      setImei(cleanedIMEI);
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

  // Función mejorada para extraer IMEI
  const extractIMEIFromText = (text: string): string | null => {
    const patterns = [
      /IMEI[:\s]*(\d{10,20})/i,
      /IMEI\d*[:\s]*(\d{10,20})/i,
      /(?:SN|S\/N|Serial|Número|No\.)[:\s]*(\d{10,20})/i,
      /\b(\d{15,16})\b/,
      /(\d[\d\s\-]{10,30}\d)/,
      /01(\d{14})/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const imei = match[1].replace(/\D/g, '');
        if (imei.length >= 10 && imei.length <= 20) {
          return imei;
        }
      }
    }
    
    const allNumbers = text.match(/\d+/g);
    if (allNumbers) {
      for (const num of allNumbers) {
        if (num.length >= 10 && num.length <= 20) {
          return num;
        }
      }
    }
    
    return null;
  };

  // Iniciar escáner - VERSIÓN MEJORADA (CÁMARA GRANDE + TRASERA)
  const startScanner = useCallback(() => {
    if (!scannerContainerRef.current) return;
    
    try {
      setScannerError(null);
      setIsScanning(true);
      setCameraInitializing(true);
      
      // CONFIGURACIÓN MEJORADA
      const config = {
        fps: 10,
        // 📏 CUADRO DE ESCANEO MÁS GRANDE
        qrbox: { width: 350, height: 350 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        // 📱 PRIORIZAR CÁMARA TRASERA
        videoConstraints: {
          facingMode: { exact: "environment" }
        }
      };

      scannerRef.current = new Html5QrcodeScanner(
        "html5qr-scanner-container",
        config,
        false
      );

      const onScanSuccess = (decodedText: string) => {
        setCameraInitializing(false);
        const extractedIMEI = extractIMEIFromText(decodedText);
        
        if (extractedIMEI) {
          if (scannerRef.current) {
            scannerRef.current.pause();
          }
          
          setImei(extractedIMEI);
          stopScanner();
          setShowScanner(false);
          
          setTimeout(() => {
            handleVerificar(extractedIMEI);
          }, 500);
        } else {
          setScannerError(`No se encontró IMEI válido.`);
          
          setTimeout(() => {
            if (scannerRef.current) {
              scannerRef.current.resume();
            }
          }, 2000);
        }
      };

      const onScanError = (errorMessage: string) => {
        setCameraInitializing(false);
        console.log('⚠️ Error de escaneo:', errorMessage);
        
        // Si falla la cámara trasera, intentar con cualquier cámara
        if (errorMessage.includes('facingMode') || errorMessage.includes('environment')) {
          console.log('🔄 Cámara trasera no disponible, usando cámara por defecto');
          setTimeout(() => {
            if (showScanner) {
              stopScanner();
              startScannerWithFallback();
            }
          }, 500);
          return;
        }
        
        if (!errorMessage.includes('NotFoundException') && 
            !errorMessage.includes('NoMultiFormatReader') &&
            !errorMessage.includes('QR code parse error')) {
          setScannerError('Error: ' + errorMessage.substring(0, 100));
        }
      };

      // Timeout para ocultar loading
      setTimeout(() => setCameraInitializing(false), 3000);
      
      scannerRef.current.render(onScanSuccess, onScanError);

    } catch (err: any) {
      console.error('❌ Error inicializando escáner:', err);
      setCameraInitializing(false);
      
      if (err.message?.includes('facingMode') || err.message?.includes('environment')) {
        console.log('🔄 Reintentando con cualquier cámara disponible...');
        setTimeout(() => {
          if (showScanner) {
            stopScanner();
            startScannerWithFallback();
          }
        }, 1000);
      } else {
        setScannerError('Error al iniciar la cámara.');
        setIsScanning(false);
      }
    }
  }, [handleVerificar, showScanner]);

  // Función de respaldo sin especificar cámara trasera
  const startScannerWithFallback = useCallback(() => {
    if (!scannerContainerRef.current) return;
    
    try {
      setScannerError(null);
      setIsScanning(true);
      setCameraInitializing(true);
      
      const config = {
        fps: 10,
        qrbox: { width: 350, height: 350 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      };

      scannerRef.current = new Html5QrcodeScanner(
        "html5qr-scanner-container",
        config,
        false
      );

      const onScanSuccess = (decodedText: string) => {
        setCameraInitializing(false);
        const extractedIMEI = extractIMEIFromText(decodedText);
        
        if (extractedIMEI) {
          if (scannerRef.current) {
            scannerRef.current.pause();
          }
          
          setImei(extractedIMEI);
          stopScanner();
          setShowScanner(false);
          
          setTimeout(() => {
            handleVerificar(extractedIMEI);
          }, 500);
        } else {
          setScannerError(`No se encontró IMEI válido.`);
          
          setTimeout(() => {
            if (scannerRef.current) {
              scannerRef.current.resume();
            }
          }, 2000);
        }
      };

      const onScanError = (errorMessage: string) => {
        setCameraInitializing(false);
        console.log('⚠️ Error de escaneo (fallback):', errorMessage);
        
        if (!errorMessage.includes('NotFoundException') && 
            !errorMessage.includes('NoMultiFormatReader')) {
          setScannerError('Error: ' + errorMessage.substring(0, 100));
        }
      };

      setTimeout(() => setCameraInitializing(false), 3000);
      scannerRef.current.render(onScanSuccess, onScanError);

    } catch (err: any) {
      console.error('❌ Error en scanner de respaldo:', err);
      setCameraInitializing(false);
      setScannerError('Error al iniciar la cámara.');
      setIsScanning(false);
    }
  }, [handleVerificar]);

  // Detener escáner
  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (error) {
        console.warn('Error al limpiar escáner:', error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setCameraInitializing(false);
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

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return 'No registrada';
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
      <div className="verificacion-header">
        <h1>
          <span role="img" aria-label="teléfono">📱</span>
          Verificación de IMEI
        </h1>
        <p className="subtitle">
          Escanea o ingresa un IMEI para verificar su estado en el sistema
        </p>
      </div>

      <div className="verificacion-card">
        {showScanner && (
          <div className="camera-active-section">
            <div className="camera-header">
              <h3>
                <span role="img" aria-label="escáner">🔍</span>
                Escáner de Códigos
                {isMobile && <span className="mobile-indicator">📱 Cámara trasera</span>}
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
              {cameraInitializing && (
                <div className="camera-loading">
                  <div className="spinner-large"></div>
                  <p>Iniciando cámara trasera...</p>
                </div>
              )}
              <div 
                id="html5qr-scanner-container" 
                ref={scannerContainerRef}
                className="html5qr-scanner"
                style={{ display: cameraInitializing ? 'none' : 'block' }}
              />
              
              {/* Overlay con marco de escaneo personalizado */}
              <div className="scan-frame-overlay">
                <div className="corner-tr"></div>
                <div className="corner-bl"></div>
              </div>
              <div className="scan-line"></div>
              
              <div className="camera-instructions">
                <div className="instruction-main">
                  <span>📷</span>
                  <span>Apunta al código de barras o IMEI</span>
                </div>
                <div className="instruction-sub">
                  El escaneo será automático
                </div>
              </div>
            </div>

            {scannerError && (
              <div className="alert alert-error">
                <span className="alert-icon" role="img" aria-label="error">⚠️</span>
                <span className="alert-text">{scannerError}</span>
              </div>
            )}
            
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

        {!showScanner && (
          <>
            <div className="camera-trigger-section">
              <button
                onClick={handleToggleScanner}
                className="btn-camera-trigger"
                type="button"
              >
                <span role="img" aria-label="escáner" className="camera-icon">🔍</span>
                {isMobile ? 'Escanear código con cámara trasera' : 'Usar escáner de códigos'}
              </button>
              
              <div className="divider-with-text">
                <span>O ingresa manualmente</span>
              </div>
            </div>

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

            {error && (
              <div className="alert alert-error">
                <span className="alert-icon" role="img" aria-label="error">⚠️</span>
                <span className="alert-text">{error}</span>
              </div>
            )}

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
                        <span className="info-value">{resultado.personaNombre || 'No asignado'}</span>
                      </div>
                      
                      {resultado.empresaNombre && (
                        <div className="info-row">
                          <span className="info-label">
                            <span role="img" aria-label="empresa">🏢</span>
                            Empresa:
                          </span>
                          <span className="info-value">{resultado.empresaNombre}</span>
                        </div>
                      )}
                      
                      {resultado.fechaRegistro && (
                        <div className="info-row">
                          <span className="info-label">
                            <span role="img" aria-label="calendario">📅</span>
                            Registrado:
                          </span>
                          <span className="info-value">{formatDate(resultado.fechaRegistro)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="result-message">
                      <p>{resultado.mensaje || 'Dispositivo no encontrado en el sistema'}</p>
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
          </>
        )}
      </div>

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
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificacionIMEI;