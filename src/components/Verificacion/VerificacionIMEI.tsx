// src/components/Verificacion/VerificacionIMEI.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../Verificacion/Verificacion.css';
import { Html5Qrcode } from 'html5-qrcode';

interface VerificacionIMEIProps {
  userRole?: string;
  userEmpresaId?: number;
}

interface DispositivoResultado {
  dispositivoId?: number;
  personaNombre?: string;
  personaId?: number;
  empresaNombre?: string;
  empresaId?: number;
  fechaRegistro?: string;
  modelo?: string;
  marca?: string;
  estado?: string;
  imei?: string;
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
  // Para búsqueda por últimos 4 dígitos puede venir lista
  dispositivos?: DispositivoResultado[];
}

type SearchMode = 'full' | 'last4';

const VerificacionIMEI: React.FC<VerificacionIMEIProps> = ({ userRole, userEmpresaId }) => {
  const [imei, setImei] = useState('');
  const [last4, setLast4] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('full');
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const last4Ref = useRef<HTMLInputElement>(null);

  // Detectar móvil
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

  // Verificación IMEI completo contra API
  const verificarIMEICompleto = async (cleanedIMEI: string): Promise<ResultadoVerificacion> => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        return { valido: false, mensaje: 'Sesión expirada. Por favor, inicie sesión nuevamente.' };
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
        body: JSON.stringify({ IMEI: cleanedIMEI }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let responseText = '';
      try { responseText = await response.text(); } catch (e) {}

      if (response.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        return { valido: false, mensaje: 'Sesión expirada. Por favor, inicie sesión nuevamente.' };
      }
      if (response.status === 400) {
        try {
          const errorData = JSON.parse(responseText);
          return { valido: false, mensaje: errorData.mensaje || errorData.message || 'Error en la solicitud' };
        } catch { return { valido: false, mensaje: 'Formato de IMEI inválido' }; }
      }
      if (!response.ok) {
        return { valido: false, mensaje: `Error del servidor: ${response.status} ${response.statusText || ''}` };
      }

      let data;
      try { data = JSON.parse(responseText); } catch {
        return { valido: false, mensaje: 'Error procesando respuesta del servidor' };
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
      if (err.name === 'AbortError') return { valido: false, mensaje: 'Tiempo de espera agotado. Verifique su conexión.' };
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) return { valido: false, mensaje: 'No se pudo conectar con el servidor.' };
      return { valido: false, mensaje: 'Error de conexión con el servidor.' };
    }
  };

  // Búsqueda por últimos 4 dígitos contra API
  const buscarPorUltimos4 = async (digits: string): Promise<ResultadoVerificacion> => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        return { valido: false, mensaje: 'Sesión expirada. Por favor, inicie sesión nuevamente.' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/api/verificacion/buscar-por-ultimos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ ultimosDigitos: digits }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let responseText = '';
      try { responseText = await response.text(); } catch (e) {}

      if (response.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        return { valido: false, mensaje: 'Sesión expirada. Por favor, inicie sesión nuevamente.' };
      }
      if (response.status === 400) {
        try {
          const errorData = JSON.parse(responseText);
          return { valido: false, mensaje: errorData.mensaje || errorData.message || 'Error en la solicitud' };
        } catch { return { valido: false, mensaje: 'Formato inválido' }; }
      }
      if (!response.ok) {
        return { valido: false, mensaje: `Error del servidor: ${response.status} ${response.statusText || ''}` };
      }

      let data;
      try { data = JSON.parse(responseText); } catch {
        return { valido: false, mensaje: 'Error procesando respuesta del servidor' };
      }

      // El backend puede devolver un array de dispositivos o un único resultado
      if (Array.isArray(data.dispositivos) || Array.isArray(data)) {
        const lista: DispositivoResultado[] = (data.dispositivos || data).map((d: any) => ({
          dispositivoId: d.id || d.dispositivoId,
          personaNombre: d.persona?.nombre || d.personaNombre,
          personaId: d.persona?.id || d.personaId,
          empresaNombre: d.empresa?.nombre || d.empresaNombre,
          empresaId: d.empresa?.id || d.empresaId,
          fechaRegistro: d.fechaRegistro,
          modelo: d.modelo,
          marca: d.marca,
          estado: d.estado,
          imei: d.imei || d.IMEI,
        }));
        return {
          valido: lista.length > 0,
          dispositivos: lista,
          mensaje: lista.length > 0
            ? `Se encontraron ${lista.length} dispositivo(s)`
            : 'No se encontraron dispositivos con esos dígitos'
        };
      }

      // Respuesta simple (un solo dispositivo)
      return {
        valido: data.valido || false,
        dispositivoId: data.dispositivo?.id || data.dispositivoId,
        personaNombre: data.persona?.nombre || data.personaNombre,
        personaId: data.persona?.id || data.personaId,
        empresaNombre: data.empresa?.nombre || data.empresaNombre,
        empresaId: data.empresa?.id || data.empresaId,
        fechaRegistro: data.dispositivo?.fechaRegistro || data.fechaRegistro,
        mensaje: data.mensaje || 'Búsqueda completada'
      };
    } catch (err: any) {
      if (err.name === 'AbortError') return { valido: false, mensaje: 'Tiempo de espera agotado. Verifique su conexión.' };
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) return { valido: false, mensaje: 'No se pudo conectar con el servidor.' };
      return { valido: false, mensaje: 'Error de conexión con el servidor.' };
    }
  };

  const handleVerificar = useCallback(async (imeiToCheck?: string) => {
    // Modo últimos 4 dígitos
    if (searchMode === 'last4') {
      const digits = last4.trim();
      if (digits.length !== 4) {
        setError('Ingresa exactamente 4 dígitos');
        if (last4Ref.current) last4Ref.current.focus();
        return;
      }
      setLoading(true);
      setError('');
      setResultado(null);
      try {
        const res = await buscarPorUltimos4(digits);
        setResultado(res);
      } catch (err: any) {
        setError(err.message || 'Error al buscar dispositivos');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Modo IMEI completo
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
      const res = await verificarIMEICompleto(cleanedIMEI);
      setResultado(res);
      setImei(cleanedIMEI);
    } catch (err: any) {
      setError(err.message || 'Error al verificar IMEI');
    } finally {
      setLoading(false);
    }
  }, [imei, last4, searchMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerificar();
  };

  // Cambiar modo de búsqueda
  const handleChangeMode = (mode: SearchMode) => {
    setSearchMode(mode);
    setImei('');
    setLast4('');
    setResultado(null);
    setError('');
    setScannerError(null);
    if (showScanner) { stopScanner(); setShowScanner(false); }
  };

  // Extraer IMEI de texto escaneado
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
        const extracted = match[1].replace(/\D/g, '');
        if (extracted.length >= 10 && extracted.length <= 20) return extracted;
      }
    }
    const allNumbers = text.match(/\d+/g);
    if (allNumbers) {
      for (const num of allNumbers) {
        if (num.length >= 10 && num.length <= 20) return num;
      }
    }
    return null;
  };

  // Iniciar escáner
  const startScanner = useCallback(async () => {
    if (!scannerContainerRef.current) return;
    try {
      setScannerError(null);
      setIsScanning(true);

      if (html5QrcodeRef.current) {
        try {
          const st = html5QrcodeRef.current.getState();
          if (st === 2 || st === 3) await html5QrcodeRef.current.stop();
          html5QrcodeRef.current.clear();
        } catch (_) {}
        html5QrcodeRef.current = null;
      }

      const html5Qrcode = new Html5Qrcode('html5qr-scanner-container');
      html5QrcodeRef.current = html5Qrcode;

      const onScanSuccess = (decodedText: string) => {
        const extractedIMEI = extractIMEIFromText(decodedText);
        if (extractedIMEI) {
          stopScanner();
          setShowScanner(false);
          // Al escanear, forzar modo full con el IMEI completo
          setSearchMode('full');
          setImei(extractedIMEI);
          setTimeout(() => handleVerificar(extractedIMEI), 300);
        } else {
          setScannerError(`No se encontró IMEI en: "${decodedText.substring(0, 50)}"`);
        }
      };

      const onScanError = (msg: string) => {
        if (
          !msg.includes('NotFoundException') &&
          !msg.includes('NoMultiFormatReader') &&
          !msg.includes('QR code parse error') &&
          !msg.includes('No MultiFormat Readers')
        ) {
          console.warn('⚠️ Escáner:', msg);
        }
      };

      const containerWidth = scannerContainerRef.current.offsetWidth || 320;
      const qrboxSize = Math.min(Math.floor(containerWidth * 0.82), 400);

      const config = {
        fps: 15,
        qrbox: { width: qrboxSize, height: qrboxSize },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 1.5,
      };

      try {
        await html5Qrcode.start(
          { facingMode: { exact: 'environment' } },
          config, onScanSuccess, onScanError
        );
      } catch {
        try {
          await html5Qrcode.start(
            { facingMode: 'environment' },
            config, onScanSuccess, onScanError
          );
        } catch {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            await html5Qrcode.start(
              cameras[cameras.length - 1].id,
              config, onScanSuccess, onScanError
            );
          } else {
            throw new Error('No se encontraron cámaras disponibles');
          }
        }
      }
    } catch (err: any) {
      console.error('❌ Error escáner:', err);
      setScannerError(
        err.message?.includes('Permission')
          ? 'Permiso de cámara denegado. Actívalo en la configuración del navegador.'
          : 'Error al iniciar la cámara. Verifique los permisos.'
      );
      setIsScanning(false);
    }
  }, [handleVerificar]);

  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current) {
      try {
        const st = html5QrcodeRef.current.getState();
        if (st === 2 || st === 3) await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (e) { console.warn('stopScanner:', e); }
      html5QrcodeRef.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (showScanner) {
      const t = setTimeout(() => startScanner(), 100);
      return () => clearTimeout(t);
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [showScanner]);

  const handleClear = useCallback(() => {
    setImei('');
    setLast4('');
    setResultado(null);
    setError('');
    setScannerError(null);
    if (showScanner) { stopScanner(); setShowScanner(false); }
    if (searchMode === 'full' && inputRef.current) inputRef.current.focus();
    if (searchMode === 'last4' && last4Ref.current) last4Ref.current.focus();
  }, [showScanner, stopScanner, searchMode]);

  const handleKeyPressIMEI = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      !/^\d$/.test(e.key) &&
      !['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','Home','End','Escape'].includes(e.key)
    ) {
      e.preventDefault();
    }
    if (e.key === 'Enter' && imei.length >= 10) handleVerificar();
  };

  const handleKeyPressLast4 = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      !/^\d$/.test(e.key) &&
      !['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','Home','End','Escape'].includes(e.key)
    ) {
      e.preventDefault();
    }
    if (e.key === 'Enter' && last4.length === 4) handleVerificar();
  };

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return 'No registrada';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'Fecha inválida'; }
  }, []);

  const formatIMEI = useCallback((val: string) => {
    const c = val.replace(/\D/g, '');
    if (c.length <= 15) return c;
    return [c.slice(0,2), c.slice(2,8), c.slice(8,14), c.slice(14)].filter(Boolean).join('-');
  }, []);

  const handleToggleScanner = () => {
    if (showScanner) { stopScanner(); setShowScanner(false); }
    else setShowScanner(true);
  };

  // Botón submit deshabilitado según modo
  const isSubmitDisabled =
    loading ||
    (searchMode === 'full' && (!imei.trim() || imei.replace(/\D/g, '').length < 10)) ||
    (searchMode === 'last4' && last4.trim().length !== 4);

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
              <button onClick={handleToggleScanner} className="btn-close-camera" aria-label="Cerrar escáner">
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
              <button onClick={handleToggleScanner} className="btn-cancel-camera">
                <span role="img" aria-label="volver">←</span>
                Volver
              </button>
            </div>
          </div>
        )}

        {!showScanner && (
          <>
            {/* Toggle modo de búsqueda */}
            <div className="search-mode-toggle">
              <button
                type="button"
                className={`mode-btn ${searchMode === 'full' ? 'active' : ''}`}
                onClick={() => handleChangeMode('full')}
              >
                <span role="img" aria-label="imei">🔢</span>
                IMEI Completo
              </button>
              <button
                type="button"
                className={`mode-btn ${searchMode === 'last4' ? 'active' : ''}`}
                onClick={() => handleChangeMode('last4')}
              >
                <span role="img" aria-label="últimos">🔎</span>
                Últimos 4 dígitos
              </button>
            </div>

            {/* Botón escáner solo en modo IMEI completo */}
            {searchMode === 'full' && (
              <div className="camera-trigger-section">
                <button onClick={handleToggleScanner} className="btn-camera-trigger" type="button">
                  <span role="img" aria-label="escáner" className="camera-icon">🔍</span>
                  {isMobile ? 'Escanear código' : 'Usar escáner de códigos'}
                </button>
                <div className="divider-with-text">
                  <span>O ingresa manualmente</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="verification-form">
              <div className="form-field">
                {searchMode === 'full' ? (
                  <>
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
                        onKeyDown={handleKeyPressIMEI}
                        placeholder="Ej: 358879090123456"
                        maxLength={20}
                        className="imei-field"
                        disabled={loading}
                        inputMode="numeric"
                        autoComplete="off"
                      />
                      {imei && (
                        <button type="button" onClick={handleClear} className="btn-clear-field" aria-label="Limpiar">
                          ×
                        </button>
                      )}
                    </div>
                    <div className="field-hint">
                      <span role="img" aria-label="consejo">💡</span>
                      Teclea *#06# en el teléfono para ver el IMEI
                    </div>
                  </>
                ) : (
                  <>
                    <label className="field-label" htmlFor="last4-input">
                      <span role="img" aria-label="número">🔎</span>
                      Últimos 4 dígitos del IMEI
                    </label>
                    <div className="input-with-clear">
                      <input
                        id="last4-input"
                        ref={last4Ref}
                        type="text"
                        value={last4}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setLast4(value);
                          if (error) setError('');
                        }}
                        onKeyDown={handleKeyPressLast4}
                        placeholder="Ej: 3456"
                        maxLength={4}
                        className="imei-field imei-field--last4"
                        disabled={loading}
                        inputMode="numeric"
                        autoComplete="off"
                        autoFocus
                      />
                      {last4 && (
                        <button type="button" onClick={handleClear} className="btn-clear-field" aria-label="Limpiar">
                          ×
                        </button>
                      )}
                    </div>
                    <div className="field-hint">
                      <span role="img" aria-label="consejo">💡</span>
                      Ingresa los últimos 4 números del IMEI del dispositivo
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`btn-submit ${loading ? 'btn-loading' : ''}`}
              >
                {loading ? (
                  <><span className="spinner"></span>
                    {searchMode === 'last4' ? 'BUSCANDO...' : 'VERIFICANDO...'}
                  </>
                ) : (
                  <>
                    <span role="img" aria-label="verificar">✅</span>
                    {searchMode === 'last4' ? 'BUSCAR DISPOSITIVOS' : 'VERIFICAR IMEI'}
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

            {/* Resultado para IMEI completo */}
            {resultado && searchMode === 'full' && !resultado.dispositivos && (
              <div className={`result-card ${resultado.valido ? 'result-valid' : 'result-invalid'}`}>
                <div className="result-status">
                  <div className="status-badge">{resultado.valido ? '✅' : '❌'}</div>
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
                        <span className="info-label"><span role="img" aria-label="persona">👤</span>Propietario:</span>
                        <span className="info-value">{resultado.personaNombre || 'No asignado'}</span>
                      </div>
                      {resultado.empresaNombre && (
                        <div className="info-row">
                          <span className="info-label"><span role="img" aria-label="empresa">🏢</span>Empresa:</span>
                          <span className="info-value">{resultado.empresaNombre}</span>
                        </div>
                      )}
                      {resultado.fechaRegistro && (
                        <div className="info-row">
                          <span className="info-label"><span role="img" aria-label="fecha">📅</span>Registrado:</span>
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

                <button onClick={handleClear} className="btn-reset" type="button">
                  <span role="img" aria-label="reiniciar">🔄</span>
                  Nueva Verificación
                </button>
              </div>
            )}

            {/* Resultado para búsqueda por últimos 4 dígitos — lista de dispositivos */}
            {resultado && searchMode === 'last4' && (
              <div className={`result-card ${resultado.valido ? 'result-valid' : 'result-invalid'}`}>
                <div className="result-status">
                  <div className="status-badge">{resultado.valido ? '🔎' : '❌'}</div>
                  <div className="status-text">
                    <h3 className="status-title">
                      {resultado.valido
                        ? `DISPOSITIVOS ENCONTRADOS`
                        : 'SIN RESULTADOS'}
                    </h3>
                    <p className="status-imei">Terminación: ···· {last4}</p>
                  </div>
                </div>

                {resultado.valido && resultado.dispositivos && resultado.dispositivos.length > 0 ? (
                  <div className="result-list">
                    {resultado.dispositivos.map((d, idx) => (
                      <div key={d.dispositivoId ?? idx} className="result-list-item">
                        <div className="result-list-header">
                          <span className="result-list-index">#{idx + 1}</span>
                          {d.imei && (
                            <span className="result-list-imei">{formatIMEI(d.imei)}</span>
                          )}
                        </div>
                        <div className="result-info">
                          <div className="info-row">
                            <span className="info-label"><span role="img" aria-label="persona">👤</span>Propietario:</span>
                            <span className="info-value">{d.personaNombre || 'No asignado'}</span>
                          </div>
                          {d.empresaNombre && (
                            <div className="info-row">
                              <span className="info-label"><span role="img" aria-label="empresa">🏢</span>Empresa:</span>
                              <span className="info-value">{d.empresaNombre}</span>
                            </div>
                          )}
                          {d.fechaRegistro && (
                            <div className="info-row">
                              <span className="info-label"><span role="img" aria-label="fecha">📅</span>Registrado:</span>
                              <span className="info-value">{formatDate(d.fechaRegistro)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : resultado.valido && !resultado.dispositivos ? (
                  // Respuesta simple (un solo dispositivo sin array)
                  <div className="result-info">
                    <div className="info-row">
                      <span className="info-label"><span role="img" aria-label="persona">👤</span>Propietario:</span>
                      <span className="info-value">{resultado.personaNombre || 'No asignado'}</span>
                    </div>
                    {resultado.empresaNombre && (
                      <div className="info-row">
                        <span className="info-label"><span role="img" aria-label="empresa">🏢</span>Empresa:</span>
                        <span className="info-value">{resultado.empresaNombre}</span>
                      </div>
                    )}
                    {resultado.fechaRegistro && (
                      <div className="info-row">
                        <span className="info-label"><span role="img" aria-label="fecha">📅</span>Registrado:</span>
                        <span className="info-value">{formatDate(resultado.fechaRegistro)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="result-message">
                    <p>{resultado.mensaje || 'No se encontraron dispositivos con esos dígitos'}</p>
                  </div>
                )}

                <button onClick={handleClear} className="btn-reset" type="button">
                  <span role="img" aria-label="reiniciar">🔄</span>
                  Nueva Búsqueda
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