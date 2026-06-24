// src/components/Verificacion/VerificacionIMEI.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../Verificacion/Verificacion.css';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../services/api';

// ─── Tipos ───────────────────────────────────────────────────────────────────

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

interface DispositivoSugerencia {
  imei: string;
  personaNombre?: string;
  empresaNombre?: string;
  modelo?: string;
  marca?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Devuelve true si `query` aparece en cualquier posición de `imei` */
const imeiContiene = (imei: string, query: string): boolean =>
  imei.includes(query);

/**
 * Búsqueda parcial MOCK.
 * ⚠️  Reemplazar por la llamada real al backend:
 *   GET /api/verificacion/buscar?digitos=XXXX
 * El endpoint debe aceptar el parámetro `digitos` y devolver un array de
 * { imei, personaNombre, empresaNombre, modelo, marca }.
 */
const MOCK_DISPOSITIVOS: DispositivoSugerencia[] = [
  { imei: '358879090123456', personaNombre: 'María García',   empresaNombre: 'TechCorp',   marca: 'Samsung', modelo: 'Galaxy S23' },
  { imei: '490154203237518', personaNombre: 'Carlos López',   empresaNombre: 'DataSys',    marca: 'Apple',   modelo: 'iPhone 14'  },
  { imei: '012345678901230', personaNombre: 'Ana Martínez',   empresaNombre: 'TechCorp',   marca: 'Xiaomi',  modelo: 'Redmi 12'   },
  { imei: '358879090109876', personaNombre: 'Pedro Sánchez',  empresaNombre: 'InnoTech',   marca: 'Samsung', modelo: 'Galaxy A54' },
  { imei: '490000000002345', personaNombre: 'Lucía Fernández',empresaNombre: 'GlobalBiz',  marca: 'Huawei',  modelo: 'P40 Pro'    },
  { imei: '111222333444555', personaNombre: 'Jorge Ruiz',     empresaNombre: 'StartupXYZ', marca: 'Motorola',modelo: 'Edge 30'    },
];

async function buscarDispositivosMock(query: string): Promise<DispositivoSugerencia[]> {
  // Simula latencia de red
  await new Promise(r => setTimeout(r, 180));
  const q = query.replace(/\D/g, '');
  if (!q) return [];
  return MOCK_DISPOSITIVOS.filter(d => imeiContiene(d.imei, q));
}

/**
 * Función real (descomenta y adapta cuando el endpoint esté disponible).
 *
 * async function buscarDispositivosAPI(
 *   query: string,
 *   token: string,
 *   apiURL: string
 * ): Promise<DispositivoSugerencia[]> {
 *   const res = await fetch(
 *     `${apiURL}/api/verificacion/buscar?digitos=${encodeURIComponent(query)}`,
 *     { headers: { Authorization: `Bearer ${token}` } }
 *   );
 *   if (!res.ok) return [];
 *   const data = await res.json();
 *   return data.dispositivos ?? data ?? [];
 * }
 */

// ─── Componente ───────────────────────────────────────────────────────────────

const VerificacionIMEI: React.FC<VerificacionIMEIProps> = ({ userRole, userEmpresaId }) => {
  const [imei, setImei] = useState('');
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // ── Estados de búsqueda parcial ──
  const [sugerencias, setSugerencias] = useState<DispositivoSugerencia[]>([]);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [sugerenciasError, setSugerenciasError] = useState('');
  /** Índice de sugerencia resaltada con teclado (-1 = ninguna) */
  const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);

  const [resultadosBusqueda, setResultadosBusqueda] = useState<DispositivoSugerencia[]>([]);
  const [showResultadosBusqueda, setShowResultadosBusqueda] = useState(false);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sugerenciasRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Detectar móvil ───────────────────────────────────────────────────────

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

  // ─── Cerrar dropdown al hacer clic fuera ─────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        sugerenciasRef.current && !sugerenciasRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Búsqueda parcial con debounce ────────────────────────────────────────

  const buscarPorUltimosDigitos = useCallback(async (query: string) => {
    const q = query.replace(/\D/g, '');
    if (q.length < 4) {
      setSugerencias([]);
      setShowSugerencias(false);
      setSugerenciasError('');
      return;
    }

    setBuscandoSugerencias(true);
    setSugerenciasError('');
    setSugerenciaActiva(-1);

    try {
      const response = await api.get('/api/Admin/dispositivos', {
        params: { search: q, limit: 10 }
      });
      const results = response.data?.dispositivos || [];
      const suggestions: DispositivoSugerencia[] = results.map((d: any) => ({
        imei: d.imei,
        personaNombre: d.personaNombre,
        empresaNombre: d.empresaNombre,
        modelo: d.modelo,
        marca: d.marca
      }));

      setSugerencias(suggestions);
      setShowSugerencias(true);
      if (suggestions.length === 0) {
        setSugerenciasError(`No se encontraron dispositivos con "${q}"`);
      }
    } catch (err) {
      console.error('Error al buscar sugerencias:', err);
      setSugerenciasError('Error al buscar dispositivos');
      setSugerencias([]);
      setShowSugerencias(true);
    } finally {
      setBuscandoSugerencias(false);
    }
  }, []);

  const handleImeiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setImei(value);
    if (error) setError('');
    setResultado(null);

    // Debounce 300 ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length >= 4) {
      debounceRef.current = setTimeout(() => buscarPorUltimosDigitos(value), 300);
    } else {
      setSugerencias([]);
      setShowSugerencias(false);
      setSugerenciasError('');
    }
  };

  const seleccionarSugerencia = useCallback((dispositivo: DispositivoSugerencia) => {
    setImei(dispositivo.imei);
    setSugerencias([]);
    setShowSugerencias(false);
    setSugerenciaActiva(-1);
    // Verificar automáticamente
    setTimeout(() => handleVerificar(dispositivo.imei), 50);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // (handleVerificar se define abajo; se usa con useCallback + ref trick)

  // ─── Verificación IMEI contra API ─────────────────────────────────────────

  const verificarIMEI = async (imei: string): Promise<ResultadoVerificacion> => {
    const cleanedIMEI = imei.replace(/\D/g, '');
    if (cleanedIMEI.length < 10 || cleanedIMEI.length > 20) {
      return { valido: false, mensaje: 'IMEI inválido. Debe tener entre 10 y 20 dígitos' };
    }

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

  const handleVerificar = useCallback(async (imeiToCheck?: string) => {
    const imeiToVerify = (imeiToCheck || imei).trim();
    if (!imeiToVerify) {
      setError('Por favor, ingresa un IMEI');
      if (inputRef.current) inputRef.current.focus();
      return;
    }
    const cleanedIMEI = imeiToVerify.replace(/\D/g, '');
    
    // Si tiene menos de 10 dígitos, hacemos una búsqueda de coincidencia en lugar de verificar directamente
    if (cleanedIMEI.length < 10) {
      if (cleanedIMEI.length < 4) {
        setError('Ingresa al menos 4 dígitos para buscar');
        return;
      }
      setLoading(true);
      setError('');
      setResultado(null);
      setShowSugerencias(false);
      try {
        const response = await api.get('/api/Admin/dispositivos', {
          params: { search: cleanedIMEI, limit: 30 }
        });
        const results = response.data?.dispositivos || [];
        const mapped = results.map((d: any) => ({
          imei: d.imei,
          personaNombre: d.personaNombre,
          empresaNombre: d.empresaNombre,
          modelo: d.modelo,
          marca: d.marca
        }));
        setResultadosBusqueda(mapped);
        setShowResultadosBusqueda(true);
        if (mapped.length === 0) {
          setError(`No se encontraron dispositivos que coincidan con "${cleanedIMEI}"`);
        }
      } catch (err: any) {
        setError(err.message || 'Error al buscar dispositivos');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError('');
    setResultado(null);
    setShowResultadosBusqueda(false);
    setShowSugerencias(false);
    try {
      const res = await verificarIMEI(cleanedIMEI);
      setResultado(res);
      setImei(cleanedIMEI);
    } catch (err: any) {
      setError(err.message || 'Error al verificar IMEI');
    } finally {
      setLoading(false);
    }
  }, [imei]);

  // Actualizar la referencia de seleccionarSugerencia para usar handleVerificar actualizado
  const handleVerificarRef = useRef(handleVerificar);
  useEffect(() => { handleVerificarRef.current = handleVerificar; }, [handleVerificar]);

  const handleSeleccionarSugerencia = useCallback((dispositivo: DispositivoSugerencia) => {
    setImei(dispositivo.imei);
    setSugerencias([]);
    setShowSugerencias(false);
    setSugerenciaActiva(-1);
    setShowResultadosBusqueda(false);
    setResultadosBusqueda([]);
    setTimeout(() => handleVerificarRef.current(dispositivo.imei), 50);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSugerencias(false);
    handleVerificar();
  };

  // ─── Navegación por teclado en dropdown ──────────────────────────────────

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Navegación en el dropdown
    if (showSugerencias && sugerencias.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSugerenciaActiva(prev => Math.min(prev + 1, sugerencias.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSugerenciaActiva(prev => Math.max(prev - 1, -1));
        return;
      }
      if (e.key === 'Enter' && sugerenciaActiva >= 0) {
        e.preventDefault();
        handleSeleccionarSugerencia(sugerencias[sugerenciaActiva]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSugerencias(false);
        return;
      }
    }

    // Validación normal de teclas
    if (
      !/^\d$/.test(e.key) &&
      !['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','Home','End','Escape'].includes(e.key)
    ) {
      e.preventDefault();
    }
    if (e.key === 'Enter' && imei.length >= 4) handleVerificar();
  };

  // ─── Escáner ──────────────────────────────────────────────────────────────

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
        await html5Qrcode.start({ facingMode: { exact: 'environment' } }, config, onScanSuccess, onScanError);
      } catch {
        try {
          await html5Qrcode.start({ facingMode: 'environment' }, config, onScanSuccess, onScanError);
        } catch {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            await html5Qrcode.start(cameras[cameras.length - 1].id, config, onScanSuccess, onScanError);
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

  // ─── Limpiar ──────────────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setImei('');
    setResultado(null);
    setError('');
    setScannerError(null);
    setSugerencias([]);
    setShowSugerencias(false);
    setSugerenciasError('');
    setSugerenciaActiva(-1);
    setShowResultadosBusqueda(false);
    setResultadosBusqueda([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (showScanner) { stopScanner(); setShowScanner(false); }
    if (inputRef.current) inputRef.current.focus();
  }, [showScanner, stopScanner]);

  const handleToggleScanner = () => {
    if (showScanner) { stopScanner(); setShowScanner(false); }
    else setShowScanner(true);
  };

  // ─── Formato ──────────────────────────────────────────────────────────────

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

  /**
   * Resalta la parte del IMEI que coincide con la búsqueda actual.
   * Devuelve fragmentos { text, highlight }.
   */
  const resaltarCoincidencia = (imeiCompleto: string, query: string): { text: string; hl: boolean }[] => {
    const q = query.replace(/\D/g, '');
    if (!q) return [{ text: imeiCompleto, hl: false }];
    const idx = imeiCompleto.indexOf(q);
    if (idx === -1) return [{ text: imeiCompleto, hl: false }];
    return [
      { text: imeiCompleto.slice(0, idx), hl: false },
      { text: imeiCompleto.slice(idx, idx + q.length), hl: true },
      { text: imeiCompleto.slice(idx + q.length), hl: false },
    ].filter(p => p.text !== '');
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const queryActual = imei.replace(/\D/g, '');

  const renderSugerencias = () => {
    if (!showSugerencias) return null;

    return (
      <div
        ref={sugerenciasRef}
        className="imei-suggestions-dropdown"
        role="listbox"
        aria-label="Sugerencias de dispositivos"
      >
        {/* Cabecera del dropdown */}
        <div className="suggestions-header">
          {buscandoSugerencias ? (
            <span className="suggestions-searching">
              <span className="spinner suggestions-spinner" />
              Buscando dispositivos...
            </span>
          ) : sugerencias.length > 0 ? (
            <span className="suggestions-count">
              {sugerencias.length} dispositivo{sugerencias.length !== 1 ? 's' : ''} encontrado{sugerencias.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="suggestions-empty-label">Sin resultados</span>
          )}
        </div>

        {/* Lista de sugerencias */}
        {sugerencias.length > 0 && (
          <ul className="suggestions-list">
            {sugerencias.map((d, i) => {
              const partes = resaltarCoincidencia(d.imei, queryActual);
              return (
                <li
                  key={d.imei}
                  className={`suggestion-item${sugerenciaActiva === i ? ' suggestion-item--active' : ''}`}
                  role="option"
                  aria-selected={sugerenciaActiva === i}
                  onMouseEnter={() => setSugerenciaActiva(i)}
                  onMouseLeave={() => setSugerenciaActiva(-1)}
                  onMouseDown={(e) => {
                    // mouseDown en lugar de click para ejecutar antes del blur
                    e.preventDefault();
                    handleSeleccionarSugerencia(d);
                  }}
                >
                  <div className="suggestion-imei">
                    <span role="img" aria-label="dispositivo" className="suggestion-icon">📱</span>
                    <span className="suggestion-imei-text">
                      {partes.map((p, pi) =>
                        p.hl
                          ? <mark key={pi} className="imei-match-highlight">{p.text}</mark>
                          : <span key={pi}>{p.text}</span>
                      )}
                    </span>
                  </div>
                  <div className="suggestion-meta">
                    {d.personaNombre && (
                      <span className="suggestion-meta-item">
                        <span role="img" aria-label="persona">👤</span>
                        {d.personaNombre}
                      </span>
                    )}
                    {d.empresaNombre && (
                      <span className="suggestion-meta-item">
                        <span role="img" aria-label="empresa">🏢</span>
                        {d.empresaNombre}
                      </span>
                    )}
                    {d.marca && d.modelo && (
                      <span className="suggestion-meta-item suggestion-meta-device">
                        {d.marca} {d.modelo}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Estado vacío */}
        {!buscandoSugerencias && sugerencias.length === 0 && sugerenciasError && (
          <div className="suggestions-empty">
            <span role="img" aria-label="sin resultados">🔍</span>
            <p>{sugerenciasError}</p>
            <small>Puedes ingresar el IMEI completo para verificar</small>
          </div>
        )}

        {/* Atajo: un solo resultado */}
        {!buscandoSugerencias && sugerencias.length === 1 && (
          <div className="suggestions-single-hint">
            <span role="img" aria-label="tip">💡</span>
            Pulsa <kbd>Enter</kbd> o haz clic para verificar este dispositivo
          </div>
        )}
      </div>
    );
  };

  // ─── JSX principal ────────────────────────────────────────────────────────

  return (
    <div className="verificacion-container">
      {/* Estilos inline del dropdown (no requiere modificar Verificacion.css) */}
      <style>{`
        /* ── Dropdown de sugerencias ── */
        .imei-input-wrapper {
          position: relative;
        }
        .imei-suggestions-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 1000;
          background: #ffffff;
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          overflow: hidden;
          max-height: 320px;
          display: flex;
          flex-direction: column;
        }
        .suggestions-header {
          padding: 8px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.78rem;
          display: flex;
          align-items: center;
          gap: 6px;
          min-height: 34px;
        }
        .suggestions-searching {
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .suggestions-spinner {
          width: 14px !important;
          height: 14px !important;
          border-width: 2px !important;
        }
        .suggestions-count {
          color: #374151;
          font-weight: 600;
        }
        .suggestions-empty-label {
          color: #9ca3af;
        }
        .suggestions-list {
          list-style: none;
          margin: 0;
          padding: 4px 0;
          overflow-y: auto;
          flex: 1;
        }
        .suggestion-item {
          padding: 10px 14px;
          cursor: pointer;
          transition: background 0.13s;
          border-bottom: 1px solid #f3f4f6;
        }
        .suggestion-item:last-child {
          border-bottom: none;
        }
        .suggestion-item:hover,
        .suggestion-item--active {
          background: #eff6ff;
        }
        .suggestion-imei {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .suggestion-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }
        .suggestion-imei-text {
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          font-weight: 600;
          color: #111827;
          letter-spacing: 0.04em;
        }
        .imei-match-highlight {
          background: #fef08a;
          color: #92400e;
          border-radius: 2px;
          padding: 0 1px;
        }
        .suggestion-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding-left: 26px;
        }
        .suggestion-meta-item {
          font-size: 0.75rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .suggestion-meta-device {
          color: #9ca3af;
          font-style: italic;
        }
        .suggestions-empty {
          padding: 20px 14px;
          text-align: center;
          color: #6b7280;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .suggestions-empty span {
          font-size: 1.5rem;
        }
        .suggestions-empty p {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 500;
          color: #374151;
        }
        .suggestions-empty small {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .suggestions-single-hint {
          padding: 7px 14px;
          background: #f0fdf4;
          border-top: 1px solid #d1fae5;
          font-size: 0.75rem;
          color: #065f46;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .suggestions-single-hint kbd {
          background: #d1fae5;
          border: 1px solid #6ee7b7;
          border-radius: 3px;
          padding: 1px 5px;
          font-family: monospace;
          font-size: 0.72rem;
        }
        /* ── Indicador de búsqueda activa en el input ── */
        .partial-search-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          color: #2563eb;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 20px;
          padding: 2px 10px;
          margin-top: 5px;
          width: fit-content;
        }
        .partial-search-badge .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2563eb;
          animation: pulse-dot 1.4s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>

      <div className="verificacion-header">
        <h1>
          <span role="img" aria-label="teléfono">📱</span>
          Verificación de IMEI
        </h1>
        <p className="subtitle">
          Escanea, ingresa el IMEI completo o busca por los últimos 4 dígitos
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
            <div className="camera-trigger-section">
              <button onClick={handleToggleScanner} className="btn-camera-trigger" type="button">
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
                  {queryActual.length >= 4 && queryActual.length < 10 && (
                    <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#6b7280', fontWeight: 400 }}>
                      (búsqueda parcial activa)
                    </span>
                  )}
                </label>

                {/* Wrapper con posición relativa para el dropdown */}
                <div className="imei-input-wrapper">
                  <div className="input-with-clear">
                    <input
                      id="imei-input"
                      ref={inputRef}
                      type="text"
                      value={imei}
                      onChange={handleImeiChange}
                      onKeyDown={handleKeyPress}
                      onFocus={() => {
                        if (sugerencias.length > 0) setShowSugerencias(true);
                      }}
                      placeholder="Ej: 2345 (parcial) o 358879090123456 (completo)"
                      maxLength={20}
                      className="imei-field"
                      disabled={loading}
                      inputMode="numeric"
                      autoComplete="off"
                      aria-autocomplete="list"
                      aria-haspopup="listbox"
                      aria-expanded={showSugerencias}
                    />
                    {imei && (
                      <button type="button" onClick={handleClear} className="btn-clear-field" aria-label="Limpiar">
                        ×
                      </button>
                    )}
                  </div>

                  {/* Dropdown de sugerencias */}
                  {renderSugerencias()}
                </div>

                {/* Badge de búsqueda parcial */}
                {buscandoSugerencias && (
                  <div className="partial-search-badge">
                    <span className="dot" />
                    Buscando dispositivos con «{queryActual}»...
                  </div>
                )}
                {!buscandoSugerencias && queryActual.length >= 4 && queryActual.length < 10 && !showSugerencias && sugerencias.length > 0 && (
                  <div
                    className="partial-search-badge"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowSugerencias(true)}
                  >
                    <span role="img" aria-label="resultados">📋</span>
                    {sugerencias.length} resultado{sugerencias.length !== 1 ? 's' : ''} — haz clic para ver
                  </div>
                )}

                <div className="field-hint">
                  <span role="img" aria-label="consejo">💡</span>
                  Escribe ≥4 dígitos para buscar por coincidencia, o marca *#06# para el IMEI completo
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !imei.trim() || imei.length < 4}
                className={`btn-submit ${loading ? 'btn-loading' : ''}`}
              >
                {loading ? (
                  <><span className="spinner"></span>VERIFICANDO...</>
                ) : imei.length >= 10 ? (
                  <><span role="img" aria-label="verificar">✅</span>VERIFICAR IMEI</>
                ) : (
                  <><span role="img" aria-label="buscar">🔍</span>BUSCAR POR COINCIDENCIAS</>
                )}
              </button>
            </form>

            {error && (
              <div className="alert alert-error">
                <span className="alert-icon" role="img" aria-label="error">⚠️</span>
                <span className="alert-text">{error}</span>
              </div>
            )}

            {showResultadosBusqueda && (
              <div className="search-results-section" style={{ marginTop: '24px', borderTop: '1px solid var(--gray-200)', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📋</span> Resultados de Búsqueda ({resultadosBusqueda.length})
                </h3>
                {resultadosBusqueda.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {resultadosBusqueda.map((d) => (
                      <div 
                        key={d.imei} 
                        style={{ 
                          background: 'var(--bg-light)', 
                          border: '1.5px solid var(--gray-300)', 
                          borderRadius: '12px', 
                          padding: '16px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '8px',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>📱</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '15px', color: 'var(--samsung-blue)' }}>
                            {formatIMEI(d.imei)}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {d.personaNombre && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>👤</span> Propietario: <strong>{d.personaNombre}</strong>
                            </span>
                          )}
                          {d.empresaNombre && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>🏢</span> Empresa: {d.empresaNombre}
                            </span>
                          )}
                          {d.marca && d.modelo && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontStyle: 'italic' }}>
                              📱 Modelo: {d.marca} {d.modelo}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSeleccionarSugerencia(d)}
                          style={{
                            marginTop: '8px',
                            background: 'var(--samsung-blue)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--samsung-blue-light)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--samsung-blue)'}
                        >
                          Verificar dispositivo
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-error" style={{ margin: 0 }}>
                    <span className="alert-icon" role="img" aria-label="error">⚠️</span>
                    <span className="alert-text">No se encontraron dispositivos que coincidan con la búsqueda.</span>
                  </div>
                )}
              </div>
            )}

            {resultado && (
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