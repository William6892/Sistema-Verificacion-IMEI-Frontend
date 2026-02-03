// src/components/Dispositivos/DispositivoForm.tsx - VERSIÓN COMPLETA CON ESTILOS INCLUIDOS
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { dispositivosService } from '../../services/dispositivosService';
import { personasService } from '../../services/personasService';

interface DispositivoFormProps {
  dispositivo?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  title: string;
  empresas: any[];
  userRole: string;
  userEmpresaId?: number;
}

const DispositivoForm: React.FC<DispositivoFormProps> = ({
  dispositivo,
  onSubmit,
  onCancel,
  title,
  empresas,
  userRole,
  userEmpresaId
}) => {
  const [formData, setFormData] = useState({
    imei: '',
    personaId: '',
    personaNombre: '',
    empresaId: userEmpresaId?.toString() || '',
    empresaNombre: '',
    identificacion: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [personas, setPersonas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPersonas, setFilteredPersonas] = useState<any[]>([]);
  const [showPersonasList, setShowPersonasList] = useState(false);
  const [imeiValido, setImeiValido] = useState<boolean | null>(null);
  const [imeiMensaje, setImeiMensaje] = useState('');
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const imeiInputRef = useRef<HTMLInputElement>(null);

  // Estilos en línea organizados
  const styles = {
    // Overlay del modal
    modalOverlay: {
      position: 'fixed' as 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.3s ease-out'
    },
    
    // Contenido del modal
    modalContent: {
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '24px',
      width: '100%',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflowY: 'auto' as 'auto',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      position: 'relative' as 'relative',
      animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    // Header del modal
    modalHeader: {
      padding: '30px 40px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      borderRadius: '24px 24px 0 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '3px solid rgba(255, 255, 255, 0.1)',
      position: 'relative' as 'relative',
      overflow: 'hidden'
    },
    
    modalHeaderBg: {
      position: 'absolute' as 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
      animation: 'shimmer 3s infinite linear',
      pointerEvents: 'none' as 'none'
    },
    
    modalTitle: {
      margin: 0,
      fontSize: '28px',
      color: 'white',
      fontWeight: 800,
      position: 'relative' as 'relative',
      zIndex: 1,
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    
    modalClose: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      fontSize: '36px',
      color: 'white',
      cursor: 'pointer',
      width: '50px',
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      position: 'relative' as 'relative',
      zIndex: 1
    },
    
    // Formulario
    modalForm: {
      padding: '40px'
    },
    
    // Mensaje de error
    formError: {
      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      border: '2px solid #ef4444',
      borderRadius: '16px',
      padding: '20px 25px',
      marginBottom: '30px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      color: '#dc2626',
      fontSize: '15px',
      fontWeight: 500,
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)'
    },
    
    errorIcon: {
      fontSize: '24px',
      flexShrink: 0
    },
    
    errorText: {
      flex: 1
    },
    
    // Grupos de formulario
    formGroup: {
      marginBottom: '35px'
    },
    
 formLabel: {
  marginBottom: '15px',
  fontSize: '16px',
  fontWeight: 700,
  color: '#1e293b',
  display: 'flex', 
  alignItems: 'center',
  gap: '10px'
},
    
    formLabelIcon: {
      fontSize: '20px',
      color: '#3b82f6',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(59, 130, 246, 0.1)',
      borderRadius: '8px'
    },
    
    // Campo IMEI
    imeiInputGroup: {
      display: 'flex',
      gap: '15px',
      alignItems: 'stretch',
      flexWrap: 'wrap' as 'wrap'
    },
    
    imeiInputWrapper: {
      flex: 1,
      minWidth: '300px',
      position: 'relative' as 'relative'
    },
    
    formInput: {
      width: '100%',
      padding: '18px 20px',
      border: '3px solid #e2e8f0',
      borderRadius: '15px',
      fontSize: '18px',
      background: 'white',
      color: '#1e293b',
      outline: 'none',
      transition: 'all 0.3s ease',
      fontFamily: `'SF Mono', 'Monaco', 'Courier New', monospace`,
      letterSpacing: '1px',
      fontWeight: 600
    },
    
    btnVerificarIMEI: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '15px',
      padding: '0 35px',
      fontSize: '16px',
      fontWeight: 700,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      minWidth: '160px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
      whiteSpace: 'nowrap' as 'nowrap'
    },
    
    formHint: {
      marginTop: '12px',
      fontSize: '14px',
      color: '#64748b',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      paddingLeft: '5px'
    },
    
    // Mensaje de verificación IMEI
    verificacionMensaje: {
      marginTop: '20px',
      padding: '18px 25px',
      borderRadius: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      fontSize: '15px',
      fontWeight: 600,
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
    },
    
    verificacionMensajeValido: {
      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      border: '2px solid #10b981',
      color: '#065f46'
    },
    
    verificacionMensajeInvalido: {
      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      border: '2px solid #ef4444',
      color: '#991b1b'
    },
    
    mensajeIcon: {
      fontSize: '24px',
      flexShrink: 0
    },
    
    mensajeText: {
      flex: 1
    },
    
    // Select de empresa
    formSelect: {
      width: '100%',
      padding: '18px 20px',
      border: '3px solid #e2e8f0',
      borderRadius: '15px',
      fontSize: '16px',
      background: 'white',
      color: '#1e293b',
      cursor: 'pointer',
      transition: 'all 0.3s',
      appearance: 'none' as 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 20px center',
      backgroundSize: '20px',
      paddingRight: '50px'
    },
    
    loadingSmall: {
      marginTop: '15px',
      padding: '12px 20px',
      background: 'rgba(59, 130, 246, 0.1)',
      borderRadius: '10px',
      color: '#3b82f6',
      fontSize: '14px',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    
    // Buscador de personas
    searchContainer: {
      position: 'relative' as 'relative'
    },
    
    searchInput: {
      width: '100%',
      padding: '18px 20px',
      border: '3px solid #e2e8f0',
      borderRadius: '15px',
      fontSize: '16px',
      background: 'white',
      color: '#1e293b',
      outline: 'none',
      transition: 'all 0.3s',
      paddingRight: '50px'
    },
    
    searchIcon: {
      position: 'absolute' as 'absolute',
      right: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '22px',
      color: '#64748b',
      pointerEvents: 'none' as 'none'
    },
    
    // Lista de personas (modal)
    personasListModal: {
      position: 'absolute' as 'absolute',
      top: 'calc(100% + 10px)',
      left: 0,
      right: 0,
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      border: '2px solid #e2e8f0',
      zIndex: 1000,
      maxHeight: '400px',
      overflowY: 'auto' as 'auto',
      animation: 'slideDown 0.3s ease-out'
    },
    
    listHeader: {
      padding: '20px 25px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderBottom: '2px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: '20px 20px 0 0'
    },
    
    listHeaderText: {
      fontSize: '15px',
      fontWeight: 700,
      color: '#1e293b',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    
    btnCloseList: {
      background: 'none',
      border: 'none',
      fontSize: '30px',
      color: '#64748b',
      cursor: 'pointer',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '10px',
      transition: 'all 0.3s'
    },
    
    personasScroll: {
      maxHeight: '320px',
      overflowY: 'auto' as 'auto'
    },
    
    // Item de persona
    personaItem: {
      padding: '20px 25px',
      borderBottom: '1px solid #f1f5f9',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    
    personaAvatar: {
      width: '55px',
      height: '55px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      borderRadius: '15px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '26px',
      fontWeight: 700,
      flexShrink: 0,
      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
    },
    
    personaInfo: {
      flex: 1,
      minWidth: 0
    },
    
    personaName: {
      fontSize: '17px',
      fontWeight: 700,
      color: '#1e293b',
      marginBottom: '8px',
      whiteSpace: 'nowrap' as 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    
    personaDetails: {
      display: 'flex',
      flexDirection: 'column' as 'column',
      gap: '6px'
    },
    
    detail: {
      fontSize: '13px',
      color: '#64748b',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    
    btnSelect: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 25px',
      fontSize: '14px',
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.3s',
      whiteSpace: 'nowrap' as 'nowrap',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
    },
    
    // Sin resultados
    noResults: {
      padding: '40px 25px',
      textAlign: 'center' as 'center',
      color: '#64748b',
      fontSize: '15px',
      lineHeight: 1.6
    },
    
    // Sin personas
    noPersonas: {
      marginTop: '20px',
      padding: '20px',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      borderRadius: '15px',
      border: '2px solid #f59e0b'
    },
    
    hintWarning: {
      color: '#92400e',
      fontSize: '14px',
      fontWeight: 500,
      margin: 0,
      lineHeight: 1.6,
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    
    // Persona seleccionada
    selectedPersonaDisplay: {
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      borderRadius: '20px',
      padding: '25px',
      border: '3px solid #bae6fd'
    },
    
    selectedHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    
    selectedTitle: {
      fontSize: '16px',
      fontWeight: 700,
      color: '#0369a1',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    
    btnChange: {
      background: 'white',
      color: '#3b82f6',
      border: '2px solid #3b82f6',
      borderRadius: '12px',
      padding: '10px 25px',
      fontSize: '14px',
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    
    selectedDetails: {
      display: 'flex',
      flexDirection: 'column' as 'column',
      gap: '15px'
    },
    
    detailRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    
    detailLabel: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#475569',
      minWidth: '120px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    
    detailValue: {
      fontSize: '15px',
      fontWeight: 600,
      color: '#1e293b',
      flex: 1
    },
    
    // Acciones del modal
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '20px',
      marginTop: '40px',
      paddingTop: '30px',
      borderTop: '2px solid #f1f5f9'
    },
    
    btnCancel: {
      background: 'white',
      color: '#64748b',
      border: '3px solid #e2e8f0',
      borderRadius: '15px',
      padding: '18px 35px',
      fontSize: '16px',
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minWidth: '140px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
    },
    
    btnSubmit: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '15px',
      padding: '18px 40px',
      fontSize: '16px',
      fontWeight: 700,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      minWidth: '180px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
    },
    
    // Spinner
    spinner: {
      width: '22px',
      height: '22px',
      border: '3px solid rgba(255, 255, 255, 0.3)',
      borderTop: '3px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    
    // Loading overlay
    loadingOverlay: {
      position: 'absolute' as 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '24px',
      zIndex: 100,
      backdropFilter: 'blur(4px)'
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (dispositivo) {
      setFormData({
        imei: dispositivo.imei || '',
        personaId: dispositivo.personaId?.toString() || '',
        personaNombre: dispositivo.personaNombre || '',
        empresaId: dispositivo.empresaId?.toString() || '',
        empresaNombre: dispositivo.empresaNombre || '',
        identificacion: ''
      });
      
      if (dispositivo.personaId) {
        loadPersonas(dispositivo.empresaId);
      }
    } else if (userEmpresaId) {
      const empresa = empresas.find(e => e.id === userEmpresaId);
      setFormData(prev => ({
        ...prev,
        empresaId: userEmpresaId.toString(),
        empresaNombre: empresa?.nombre || ''
      }));
    }
  }, [dispositivo, userEmpresaId, empresas]);

  // Cargar personas cuando cambia la empresa
  useEffect(() => {
    if (formData.empresaId && !dispositivo) {
      loadPersonas(parseInt(formData.empresaId));
    }
  }, [formData.empresaId]);

  // Filtrar personas cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = personas.filter(p =>
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.identificacion?.includes(searchTerm)
      );
      setFilteredPersonas(filtered);
      setShowPersonasList(filtered.length > 0);
    } else {
      setFilteredPersonas([]);
      setShowPersonasList(false);
    }
  }, [searchTerm, personas]);

  // Función para cargar personas con manejo de errores
  const loadPersonas = async (empresaId: number) => {
    if (!empresaId) return;
    
    setLoadingPersonas(true);
    try {
      // Usar el servicio existente de personas
      const data = await personasService.getPersonasPorEmpresa(empresaId);
      setPersonas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error cargando personas:', err);
      setError('Error al cargar personas de la empresa');
      setPersonas([]);
    } finally {
      setLoadingPersonas(false);
    }
  };

  // Verificar IMEI con validación mejorada
  const verificarIMEI = async () => {
    const imei = formData.imei.trim();
    
    if (!imei) {
      setError('Ingresa un IMEI primero');
      if (imeiInputRef.current) imeiInputRef.current.focus();
      return;
    }

    if (imei.length < 10 || imei.length > 20) {
      setError('El IMEI debe tener entre 10 y 20 dígitos');
      if (imeiInputRef.current) imeiInputRef.current.focus();
      return;
    }

    if (!/^\d+$/.test(imei)) {
      setError('El IMEI solo debe contener números');
      if (imeiInputRef.current) imeiInputRef.current.focus();
      return;
    }

    setVerificando(true);
    setImeiValido(null);
    setImeiMensaje('');

    try {
      const resultado = await dispositivosService.verificarIMEI(imei);
      
      if (resultado.existe && resultado.dispositivo) {
        setImeiValido(false);
        const persona = resultado.dispositivo.personaNombre || 'Desconocido';
        setImeiMensaje(`❌ Este IMEI ya está registrado a nombre de: ${persona}`);
        setError('Este IMEI ya está registrado en el sistema');
      } else {
        setImeiValido(true);
        setImeiMensaje('✅ IMEI disponible para registro');
        setError('');
      }
    } catch (err: any) {
      setImeiValido(false);
      setImeiMensaje('❌ Error al verificar IMEI');
      setError(err.response?.data?.mensaje || 'Error al verificar IMEI');
    } finally {
      setVerificando(false);
    }
  };

  // Seleccionar persona
 const handleSelectPersona = (persona: any) => {
    const identificacion = persona.identificacion || '';
    
    // Mostrar solo los últimos 4 dígitos (más seguro)
    const identificacionOculta = identificacion.length > 4 
        ? '••••' + identificacion.slice(-4)
        : '••••';
    
    setFormData({
        ...formData,
        personaId: persona.id.toString(),
        personaNombre: persona.nombre,
        identificacion: identificacionOculta // ← Solo últimos dígitos
    });
    setSearchTerm(`${persona.nombre} (•••${identificacion.slice(-4)})`);
    setShowPersonasList(false);
};

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.imei.trim()) {
      setError('El IMEI es requerido');
      if (imeiInputRef.current) imeiInputRef.current.focus();
      return;
    }

    if (formData.imei.length < 10 || formData.imei.length > 20) {
      setError('El IMEI debe tener entre 10 y 20 dígitos');
      if (imeiInputRef.current) imeiInputRef.current.focus();
      return;
    }

    if (!/^\d+$/.test(formData.imei)) {
      setError('El IMEI solo debe contener números');
      if (imeiInputRef.current) imeiInputRef.current.focus();
      return;
    }

    if (!formData.personaId) {
      setError('Debes seleccionar una persona');
      if (searchInputRef.current) searchInputRef.current.focus();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = {
        imei: formData.imei.trim(),
        personaId: parseInt(formData.personaId)
      };
      await onSubmit(submitData);
    } catch (err: any) {
      const errorMsg = err.response?.data?.mensaje || 
                       err.message || 
                       'Error al guardar dispositivo';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar selección de persona
  const clearPersonaSelection = () => {
    setFormData({
      ...formData,
      personaId: '',
      personaNombre: '',
      identificacion: ''
    });
    setSearchTerm('');
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Cerrar lista de personas al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPersonasList && modalRef.current) {
        if (!modalRef.current.contains(event.target as Node)) {
          setShowPersonasList(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPersonasList]);

  return (
    <div 
      style={styles.modalOverlay} 
      onClick={onCancel}
      className="modal-overlay"
    >
      <div 
        ref={modalRef}
        style={styles.modalContent} 
        onClick={e => e.stopPropagation()}
        className="modal-content"
      >
        {/* Loading overlay */}
        {loading && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner}></div>
          </div>
        )}

        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderBg}></div>
          <h3 style={styles.modalTitle}>
            <span role="img" aria-label="dispositivo">📱</span>
            {title}
          </h3>
          <button 
            onClick={onCancel}
            style={styles.modalClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.modalForm}>
          {error && (
            <div style={styles.formError}>
              <span style={styles.errorIcon}>⚠️</span> 
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {/* Campo IMEI */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              <span style={styles.formLabelIcon}>🔢</span>
              Número IMEI *
            </label>
            <div style={styles.imeiInputGroup}>
              <div style={styles.imeiInputWrapper}>
                <input
                  ref={imeiInputRef}
                  type="text"
                  value={formData.imei}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, imei: value});
                    setImeiValido(null);
                    setImeiMensaje('');
                    if (error) setError('');
                  }}
                  placeholder="Ej: 358879090123456"
                  maxLength={20}
                  required
                  style={{
                    ...styles.formInput,
                    borderColor: imeiValido === true ? '#10b981' : 
                                imeiValido === false ? '#ef4444' : 
                                '#e2e8f0'
                  }}
                  disabled={loading || !!dispositivo}
                  inputMode="numeric"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = imeiValido === true ? '#10b981' : 
                                                       imeiValido === false ? '#ef4444' : 
                                                       '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              {!dispositivo && (
                <button
                  type="button"
                  onClick={verificarIMEI}
                  disabled={verificando || !formData.imei.trim() || formData.imei.length < 10}
                  style={{
                    ...styles.btnVerificarIMEI,
                    opacity: (verificando || !formData.imei.trim() || formData.imei.length < 10) ? 0.6 : 1,
                    cursor: (verificando || !formData.imei.trim() || formData.imei.length < 10) ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!verificando && formData.imei.trim() && formData.imei.length >= 10) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!verificando && formData.imei.trim() && formData.imei.length >= 10) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = styles.btnVerificarIMEI.boxShadow;
                    }
                  }}
                >
                  {verificando ? '🔍 Verificando...' : '🔍 Verificar'}
                </button>
              )}
            </div>
            <div style={styles.formHint}>
              <span>💡</span>
              10-20 dígitos (solo números)
            </div>
            
            {/* Mensaje de verificación */}
            {imeiMensaje && (
              <div style={{
                ...styles.verificacionMensaje,
                ...(imeiValido ? styles.verificacionMensajeValido : styles.verificacionMensajeInvalido)
              }}>
                <span style={styles.mensajeIcon}>
                  {imeiValido ? '✅' : '❌'}
                </span>
                <span style={styles.mensajeText}>{imeiMensaje}</span>
              </div>
            )}
          </div>

          {/* Seleccionar empresa (solo Admin) */}
          {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <span style={styles.formLabelIcon}>🏢</span>
                Empresa *
              </label>
              <select
                value={formData.empresaId}
                onChange={(e) => {
                  const empresaId = e.target.value;
                  const empresa = empresas.find(e => e.id === parseInt(empresaId));
                  setFormData({
                    ...formData,
                    empresaId,
                    empresaNombre: empresa?.nombre || '',
                    personaId: '',
                    personaNombre: '',
                    identificacion: ''
                  });
                  setSearchTerm('');
                  setShowPersonasList(false);
                }}
                required
                style={styles.formSelect}
                disabled={loading || !!dispositivo || loadingPersonas}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="">-- Seleccionar empresa --</option>
                {empresas.map(empresa => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
              {loadingPersonas && (
                <div style={styles.loadingSmall}>
                  <span>⏳</span>
                  Cargando personas...
                </div>
              )}
            </div>
          )}

          {/* Buscar/Seleccionar persona */}
          {formData.empresaId && (
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <span style={styles.formLabelIcon}>👤</span>
                Persona (Propietario) *
              </label>
              
              {!formData.personaId ? (
                <div style={{position: 'relative' as 'relative'}}>
                  <div style={styles.searchContainer}>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre o identificación..."
                      style={{
                        ...styles.searchInput,
                        borderColor: showPersonasList ? '#3b82f6' : '#e2e8f0'
                      }}
                      onFocus={() => {
                        if (searchTerm && personas.length > 0) {
                          setShowPersonasList(true);
                        }
                      }}
                      disabled={loading || loadingPersonas}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setShowPersonasList(false);
                        }
                      }}
                    />
                    <span style={styles.searchIcon}>🔍</span>
                  </div>

                  {showPersonasList && (
                    <div style={styles.personasListModal}>
                      <div style={styles.listHeader}>
                        <div style={styles.listHeaderText}>
                          <span>📋</span>
                          Personas encontradas ({filteredPersonas.length})
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setShowPersonasList(false)}
                          style={styles.btnCloseList}
                          disabled={loading}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f1f5f9';
                            e.currentTarget.style.color = '#ef4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = '#64748b';
                          }}
                          aria-label="Cerrar lista"
                        >
                          ×
                        </button>
                      </div>
                      <div style={styles.personasScroll}>
                        {filteredPersonas.length > 0 ? (
                          filteredPersonas.map(persona => (
                            <div 
                              key={persona.id}
                              style={styles.personaItem}
                              onClick={() => !loading && handleSelectPersona(persona)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.transform = 'translateX(5px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.transform = 'translateX(0)';
                              }}
                            >
                              <div style={styles.personaAvatar}>
                                {persona.nombre?.charAt(0).toUpperCase() || '👤'}
                              </div>
                              <div style={styles.personaInfo}>
                                <div style={styles.personaName}>{persona.nombre}</div>
                                <div style={styles.personaDetails}>
                                  <span style={styles.detail}>🆔 ID: {persona.identificacion}</span>
                                  {persona.telefono && (
                                    <span style={styles.detail}>📞 {persona.telefono}</span>
                                  )}
                                  <span style={styles.detail}>
                                    📱 {persona.cantidadDispositivos || 0} dispositivo{persona.cantidadDispositivos !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              <button 
                                type="button"
                                style={styles.btnSelect}
                                disabled={loading}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                                }}
                              >
                                Seleccionar
                              </button>
                            </div>
                          ))
                        ) : (
                          <div style={styles.noResults}>
                            <p style={{marginBottom: '10px'}}>
                              <strong>No se encontraron personas con "{searchTerm}"</strong>
                            </p>
                            {personas.length === 0 && (
                              <p>
                                ⚠️ Esta empresa no tiene personas registradas. 
                                Primero debes registrar personas en la empresa.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {personas.length === 0 && !loadingPersonas && (
                    <div style={styles.noPersonas}>
                      <p style={styles.hintWarning}>
                        <span>⚠️</span>
                        Esta empresa no tiene personas registradas. 
                        Primero debes registrar personas en la empresa.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.selectedPersonaDisplay}>
                  <div style={styles.selectedHeader}>
                    <div style={styles.selectedTitle}>
                      <span>✅</span>
                      Persona seleccionada:
                    </div>
                    <button
                      type="button"
                      onClick={clearPersonaSelection}
                      style={styles.btnChange}
                      disabled={loading}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#3b82f6';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      Cambiar
                    </button>
                  </div>
                  <div style={styles.selectedDetails}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>
                        <span>👤</span>
                        Nombre:
                      </span>
                      <span style={styles.detailValue}>{formData.personaNombre}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>
                        <span>🆔</span>
                        Identificación:
                      </span>
                      <span style={styles.detailValue}>{formData.identificacion}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>
                        <span>🏢</span>
                        Empresa:
                      </span>
                      <span style={styles.detailValue}>{formData.empresaNombre}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={styles.modalActions}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={styles.btnCancel}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.05)';
                }
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.imei || !formData.personaId || imeiValido === false}
              style={{
                ...styles.btnSubmit,
                opacity: (loading || !formData.imei || !formData.personaId || imeiValido === false) ? 0.6 : 1,
                cursor: (loading || !formData.imei || !formData.personaId || imeiValido === false) ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!loading && formData.imei && formData.personaId && imeiValido !== false) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && formData.imei && formData.personaId && imeiValido !== false) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                }
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  Guardando...
                </>
              ) : dispositivo ? (
                '✏️ Actualizar'
              ) : (
                '✅ Registrar'
              )}
            </button>
          </div>
        </form>

        {/* Estilos CSS globales para animaciones */}
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }

            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }

            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            /* Scrollbar personalizada */
            .modal-content::-webkit-scrollbar {
              width: 10px;
            }

            .modal-content::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 10px;
            }

            .modal-content::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 10px;
              border: 2px solid #f1f5f9;
            }

            .modal-content::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }

            .personas-scroll::-webkit-scrollbar {
              width: 8px;
            }

            .personas-scroll::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 10px;
            }

            .personas-scroll::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 10px;
            }

            .personas-scroll::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }

            /* Mejoras responsive */
            @media (max-width: 768px) {
              .modal-overlay {
                padding: 15px;
              }

              .modal-content {
                max-height: 85vh;
              }

              .modal-header {
                padding: 20px 25px;
              }

              .modal-title {
                font-size: 22px;
              }

              .modal-close {
                width: 40px;
                height: 40px;
                font-size: 30px;
              }

              .modal-form {
                padding: 25px;
              }

              .imei-input-group {
                flex-direction: column;
              }

              .imei-input-wrapper {
                min-width: 100%;
              }

              .btn-verificar-imei {
                width: 100%;
                min-width: auto;
              }

              .modal-actions {
                flex-direction: column;
                gap: 15px;
              }

              .btn-cancel,
              .btn-submit {
                width: 100%;
                min-width: auto;
              }

              .personas-list-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-height: 70vh;
              }
            }

            @media (max-width: 480px) {
              .modal-header {
                padding: 15px 20px;
              }

              .modal-title {
                font-size: 20px;
              }

              .modal-form {
                padding: 20px;
              }

              .form-input,
              .form-select {
                padding: 15px;
                font-size: 16px;
              }

              .btn-verificar-imei,
              .btn-cancel,
              .btn-submit {
                padding: 15px 25px;
                font-size: 15px;
              }

              .persona-item {
                flex-direction: column;
                text-align: center;
                gap: 15px;
              }

              .persona-avatar {
                width: 70px;
                height: 70px;
                font-size: 32px;
              }

              .persona-name {
                white-space: normal;
                text-align: center;
              }

              .persona-details {
                text-align: center;
                align-items: center;
              }

              .btn-select {
                width: 100%;
              }
            }

            /* Focus visible para accesibilidad */
            input:focus-visible,
            select:focus-visible,
            button:focus-visible {
              outline: 3px solid #3b82f6;
              outline-offset: 2px;
              border-radius: 8px;
            }

            /* Estados disabled */
            input:disabled,
            select:disabled,
            button:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }

            /* Transiciones suaves */
            input,
            select,
            button,
            .persona-item,
            .modal-content {
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default DispositivoForm;