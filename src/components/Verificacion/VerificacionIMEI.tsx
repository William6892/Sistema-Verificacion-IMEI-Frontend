// src/components/Verificacion/VerificacionIMEI.tsx - CÁMARA EN LÍNEA
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
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
  const [scanResult, setScanResult] = useState('');
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);

  // Inicializar scanner cuando se muestra la cámara
  useEffect(() => {
    if (showCamera && cameraContainerRef.current && !scannerRef.current) {
      startScanner();
    } else if (!showCamera && scannerRef.current) {
      stopScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [showCamera]);

  const startScanner = () => {
    if (scannerRef.current) return;
    
    try {
      scannerRef.current = new Html5QrcodeScanner(
        "camera-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.7777778, // 16:9
        },
        false
      );
      
      scannerRef.current.render(
        (decodedText) => {
          handleScannedCode(decodedText);
        },
        (error) => {
          console.log('Error escaneando:', error);
        }
      );
      
      setScanning(true);
    } catch (err) {
      console.error('Error inicializando scanner:', err);
      setError('No se pudo iniciar la cámara. Verifica los permisos.');
      setShowCamera(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScannedCode = (code: string) => {
    setScanResult(code);
    
    // Extraer IMEI del código escaneado
    const imeiMatch = code.match(/\b\d{15,16}\b/);
    if (imeiMatch) {
      const scannedImei = imeiMatch[0];
      setImei(scannedImei);
      setShowCamera(false); // Cerrar cámara
      
      // Auto-verificar después de escanear
      setTimeout(() => {
        handleVerificar(scannedImei);
      }, 500);
    } else {
      setError('No se encontró un IMEI válido en el código escaneado.');
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
    } catch (err: any) {
      setError(err.message || 'Error al verificar IMEI');
    } finally {
      setLoading(false);
    }
  };

  // Función de ejemplo para simular API
  const mockVerificarIMEI = async (imei: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const imeiLastDigit = parseInt(imei.slice(-1));
        const isValid = imeiLastDigit % 3 !== 0; // 66% válidos
        
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

  const handleClear = () => {
    setImei('');
    setResultado(null);
    setError('');
    setScanResult('');
    if (showCamera) {
      setShowCamera(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!/^\d$/.test(e.key) && 
        e.key !== 'Backspace' && 
        e.key !== 'Delete' && 
        e.key !== 'Tab' &&
        e.key !== 'Enter') {
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
    if (imei.length <= 15) return imei;
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
        {/* Sección de cámara - EN LÍNEA */}
        {showCamera ? (
          <div className="camera-inline-section">
            <div className="camera-header-inline">
              <h3>📷 Escanear IMEI con cámara</h3>
              <button 
                onClick={() => {
                  stopScanner();
                  setShowCamera(false);
                }}
                className="btn-close-camera-inline"
              >
                ✕ Cerrar cámara
              </button>
            </div>
            
            <div className="camera-preview-container">
              <div 
                id="camera-container" 
                ref={cameraContainerRef}
                className="camera-preview"
              />
              
              <div className="camera-instructions-inline">
                <div className="scan-guide">
                  <div className="scan-box"></div>
                </div>
                <p className="instruction-text">
                  📸 Enfoca el código de barras o número IMEI dentro del cuadro
                </p>
                <p className="instruction-subtext">
                  💡 La cámara detectará automáticamente el IMEI
                </p>
              </div>
            </div>
            
            <div className="camera-actions-inline">
              <button
                onClick={() => {
                  stopScanner();
                  setShowCamera(false);
                }}
                className="btn-cancel-scan"
              >
                Cancelar escaneo
              </button>
            </div>
          </div>
        ) : (
          /* Botón para abrir cámara */
          <div className="camera-section">
            <button
              onClick={() => {
                setShowCamera(true);
                setError('');
              }}
              className="btn-open-camera-inline"
            >
              <span className="btn-icon">📷</span>
              Usar cámara para escanear IMEI
            </button>
            
            <div className="option-divider">
              <span className="divider-text">O ingresa manualmente</span>
            </div>
          </div>
        )}

        {/* Input manual - Siempre visible */}
        <form onSubmit={handleSubmit} className="verificacion-form">
          <div className="form-group">
            <label htmlFor="imei">
              <span className="label-icon">🔢</span>
              Número IMEI
            </label>
            
            <div className="imei-input-wrapper">
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
                placeholder="Ej: 358879090123456"
                maxLength={20}
                className="imei-input"
                disabled={loading}
                inputMode="numeric"
              />
              
              {imei && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn-clear-input"
                  title="Limpiar"
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="imei-hints">
              <span>💡 Puedes escanear con la cámara o teclear *#06# en el teléfono</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !imei.trim() || imei.length < 10}
            className={`btn-verificar ${loading ? 'loading' : ''}`}
          >
            {loading ? 'VERIFICANDO...' : 'VERIFICAR IMEI'}
          </button>
        </form>

        {/* Mensaje de error */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div className={`resultado-card ${resultado.valido ? 'valido' : 'invalido'}`}>
            <div className="resultado-header">
              <div className="status-icon">
                {resultado.valido ? '✅' : '❌'}
              </div>
              <div className="status-info">
                <h3>{resultado.valido ? 'IMEI AUTORIZADO' : 'IMEI NO REGISTRADO'}</h3>
                <p className="imei-display">{formatIMEI(imei)}</p>
              </div>
            </div>
            
            {resultado.valido ? (
              <div className="resultado-details">
                <div className="detail-item">
                  <span className="detail-label">👤 Propietario:</span>
                  <span className="detail-value">{resultado.personaNombre}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">🏢 Empresa:</span>
                  <span className="detail-value">{resultado.empresaNombre}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📅 Registrado:</span>
                  <span className="detail-value">{formatDate(resultado.fechaRegistro)}</span>
                </div>
              </div>
            ) : (
              <div className="resultado-details">
                <p className="error-description">
                  El IMEI no está registrado en la base de datos.
                  {userRole === 'Admin' && (
                    <button className="btn-register-admin">
                      📝 Registrar este IMEI
                    </button>
                  )}
                </p>
              </div>
            )}
            
            <div className="resultado-actions">
              <button onClick={handleClear} className="btn-nueva-verificacion">
                <span className="btn-icon">🔄</span>
                Nueva Verificación
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Información de ayuda */}
      <div className="help-section">
        <h3>📋 ¿Dónde encontrar el IMEI?</h3>
        <div className="help-grid">
          <div className="help-item">
            <div className="help-icon">1️⃣</div>
            <div className="help-text">
              <strong>Tecla de marcado:</strong> *#06#
            </div>
          </div>
          <div className="help-item">
            <div className="help-icon">2️⃣</div>
            <div className="help-text">
              <strong>Configuración:</strong> Ajustes → Acerca del teléfono
            </div>
          </div>
          <div className="help-item">
            <div className="help-icon">3️⃣</div>
            <div className="help-text">
              <strong>Caja original:</strong> Etiqueta del empaque
            </div>
          </div>
          <div className="help-item">
            <div className="help-icon">4️⃣</div>
            <div className="help-text">
              <strong>Batería:</strong> Debajo (si es removible)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificacionIMEI;