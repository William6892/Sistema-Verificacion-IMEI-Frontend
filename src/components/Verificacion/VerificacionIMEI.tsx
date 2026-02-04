// src/components/Verificacion/VerificacionIMEI.tsx - VERSIÓN CORREGIDA
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

  // Función principal de verificación - CONEXIÓN CORRECTA
  const verificarIMEI = async (imei: string): Promise<ResultadoVerificacion> => {
    const cleanedIMEI = imei.replace(/\D/g, '');
    
    // Validación básica
    if (cleanedIMEI.length < 10 || cleanedIMEI.length > 20) {
      return {
        valido: false,
        mensaje: 'IMEI inválido. Debe tener entre 10 y 20 dígitos'
      };
    }

    try {
      // URL del backend
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        return {
          valido: false,
          mensaje: 'Sesión expirada. Por favor, inicie sesión nuevamente.'
        };
      }

      // ¡IMPORTANTE! Usar POST según tu backend
      const response = await fetch(`${API_URL}/api/verificacion/verificar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          IMEI: cleanedIMEI
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.status === 401) {
        return {
          valido: false,
          mensaje: 'No autorizado. Por favor, inicie sesión nuevamente.'
        };
      }

      if (response.status === 400) {
        const errorData = await response.json();
        return {
          valido: false,
          mensaje: errorData.mensaje || 'Error en la solicitud'
        };
      }

      if (!response.ok) {
        return {
          valido: false,
          mensaje: `Error del servidor: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      console.log('Respuesta del backend:', data);

      // Tu backend devuelve VerificacionResultDTO
      // Mapear según la estructura de VerificacionResultDTO
      return {
        valido: data.valido || false,
        dispositivoId: data.dispositivoId,
        personaNombre: data.personaNombre,
        personaId: data.personaId,
        empresaNombre: data.empresaNombre,
        empresaId: data.empresaId,
        fechaRegistro: data.fechaRegistro,
        mensaje: data.mensaje || 'Verificación completada'
        // Agrega otros campos según tu DTO
      };

    } catch (err: any) {
      console.error('Error de conexión:', err);
      
      return {
        valido: false,
        mensaje: 'Error de conexión con el servidor. Por favor, intente nuevamente.'
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

    // Validación básica de IMEI
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
      setImei(cleanedIMEI); // Actualizar con IMEI limpio
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
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
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
        const numbers = decodedText.match(/\d+/g);
        if (numbers) {
          const possibleIMEI = numbers.find(n => n.length >= 10 && n.length <= 20);
          if (possibleIMEI) {
            const imeiToSet = possibleIMEI.substring(0, 16);
            handleScannedIMEI(imeiToSet);
            return;
          }
        }
        
        const cleanedText = decodedText.replace(/\D/g, '');
        if (cleanedText.length >= 10 && cleanedText.length <= 20) {
          handleScannedIMEI(cleanedText.substring(0, 16));
        } else {
          setScannerError('No se encontró un IMEI válido en el código escaneado');
        }
      };

      const handleScannedIMEI = (imei: string) => {
        const cleanedIMEI = imei.replace(/\D/g, '');
        setImei(cleanedIMEI);
        stopScanner();
        setShowScanner(false);
        setTimeout(() => {
          handleVerificar(cleanedIMEI);
        }, 300);
      };

      const onScanError = (errorMessage: string) => {
        if (!errorMessage.includes('NotFoundException') && 
            !errorMessage.includes('NoMultiFormatReader')) {
          setScannerError(errorMessage);
        }
      };

      scannerRef.current.render(onScanSuccess, onScanError);

    } catch (err: any) {
      console.error('Error inicializando escáner:', err);
      setScannerError('Error al iniciar el escáner');
      setIsScanning(false);
    }
  }, [handleVerificar]);

  // Detener escáner
  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
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

  // Función para registrar nuevo IMEI (solo Admin)
  const handleRegistrarIMEI = () => {
    if (userRole === 'Admin') {
      // Usar endpoint POST /api/verificacion/registrar-dispositivo
      // O redirigir a formulario de registro
      window.location.href = `/registrar-dispositivo?imei=${encodeURIComponent(imei)}`;
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
              <div 
                id="html5qr-scanner-container" 
                ref={scannerContainerRef}
                className="html5qr-scanner"
              />
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
                {isMobile ? 'Escanear código' : 'Usar escáner de códigos'}
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
                      {userRole === 'Admin' && (
                        <button 
                          className="btn-register-new" 
                          type="button"
                          onClick={handleRegistrarIMEI}
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