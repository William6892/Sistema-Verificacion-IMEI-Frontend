// src/components/Dispositivos/DispositivosList.tsx - VERSIÓN COMPLETA CON ESTILOS INCLUIDOS
import React, { useState, useEffect, useRef } from 'react';
import { dispositivosService, Dispositivo } from '../../services/dispositivosService';
import DispositivoForm from './DispositivoForm';
import DispositivoDetail from './DispositivoDetail';
import { empresasService } from '../../services/empresasService';

interface DispositivosListProps {
  userRole: string;
  userEmpresaId?: number;
  personaId?: number;
  modo?: 'embedded' | 'full';
  showHeader?: boolean;
  onDispositivoSelect?: (dispositivoId: number) => void;
}

const DispositivosList: React.FC<DispositivosListProps> = ({
  userRole,
  userEmpresaId,
  personaId,
  modo = 'full',
  showHeader = true,
  onDispositivoSelect
}) => {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDispositivo, setSelectedDispositivo] = useState<Dispositivo | null>(null);
  const [editingDispositivo, setEditingDispositivo] = useState<Dispositivo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    empresaId: userEmpresaId || 0,
    activo: true,
    page: 1,
    limit: 20
  });
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estilos en línea - Modo organizado
  const styles = {
    // Estructura principal
    container: {
      padding: modo === 'embedded' ? '0' : '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%',
      fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif`,
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
      minHeight: '100vh'
    } as React.CSSProperties,
    
    // Header
    header: {
      marginBottom: '30px',
      padding: '30px',
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0'
    },
    
    titleContainer: {
      display: 'flex',
      flexDirection: 'column' as 'column',
      gap: '10px',
      marginBottom: '25px'
    },
    
    title: {
      fontSize: '32px',
      color: '#1e293b',
      margin: '0 0 8px 0',
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    
    subtitle: {
      fontSize: '16px',
      color: '#64748b',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      flexWrap: 'wrap' as 'wrap'
    },
    
    countBadge: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: 'white',
      padding: '8px 20px',
      borderRadius: '25px',
      fontSize: '14px',
      fontWeight: 700,
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
    },
    
    // Barra de búsqueda y acciones
    headerActions: {
      display: 'flex',
      flexDirection: 'column' as 'column',
      gap: '20px'
    },
    
    searchContainer: {
      flex: 1,
      position: 'relative' as 'relative'
    },
    
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      background: 'white',
      border: '2px solid #e2e8f0',
      borderRadius: '15px',
      padding: '5px',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
    },
    
    searchInput: {
      flex: 1,
      border: 'none',
      padding: '15px 20px',
      fontSize: '16px',
      outline: 'none',
      background: 'transparent',
      color: '#1e293b'
    },
    
    searchIcon: {
      padding: '0 15px',
      color: '#64748b',
      fontSize: '20px'
    },
    
    clearSearch: {
      background: 'none',
      border: 'none',
      padding: '0 15px',
      fontSize: '24px',
      color: '#94a3b8',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color 0.2s'
    },
    
    actionButtons: {
      display: 'flex',
      gap: '15px',
      flexWrap: 'wrap' as 'wrap'
    },
    
    // Botones
    btn: {
      padding: '14px 28px',
      borderRadius: '12px',
      fontWeight: 600,
      fontSize: '15px',
      cursor: 'pointer',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      minHeight: '52px'
    },
    
    btnPrimary: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: 'white',
      boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)'
    },
    
    btnSecondary: {
      background: 'white',
      color: '#475569',
      border: '2px solid #e2e8f0',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
    },
    
    // Panel de filtros
    filtersPanel: {
      background: 'white',
      borderRadius: '20px',
      padding: '30px',
      marginBottom: '30px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0',
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '20px'
    },
    
    filterGroup: {
      display: 'flex',
      flexDirection: 'column' as 'column',
      gap: '10px'
    },
    
    filterLabel: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#334155',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    
    filterSelect: {
      padding: '14px 18px',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      fontSize: '15px',
      background: 'white',
      color: '#1e293b',
      cursor: 'pointer',
      transition: 'all 0.3s',
      appearance: 'none' as 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 15px center',
      backgroundSize: '18px',
      paddingRight: '45px'
    },
    
    clearFiltersBtn: {
      background: 'none',
      border: 'none',
      color: '#3b82f6',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
      padding: '12px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      justifyContent: 'center',
      marginTop: '10px',
      borderTop: '1px solid #f1f5f9',
      paddingTop: '20px'
    },
    
    // Mensaje de error
    errorMessage: {
      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      border: '2px solid #ef4444',
      borderRadius: '15px',
      padding: '20px',
      marginBottom: '25px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      color: '#dc2626',
      fontSize: '15px',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.1)'
    },
    
    errorClose: {
      background: 'none',
      border: 'none',
      color: '#dc2626',
      fontSize: '24px',
      cursor: 'pointer',
      marginLeft: 'auto',
      padding: '0',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      transition: 'background 0.2s'
    },
    
    // Contenedor de tabla
    tableContainer: {
      background: 'white',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0',
      marginBottom: '30px'
    },
    
    tableInfo: {
      padding: '20px 30px',
      background: '#f8fafc',
      color: '#64748b',
      fontSize: '14px',
      fontWeight: 500,
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    
    table: {
      width: '100%',
      borderCollapse: 'collapse' as 'collapse',
      minWidth: '1000px'
    },
    
    tableHeader: {
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
    },
    
    tableHeaderCell: {
      padding: '20px 25px',
      textAlign: 'left' as 'left',
      fontWeight: 700,
      color: '#334155',
      borderBottom: '3px solid #e2e8f0',
      fontSize: '13px',
      textTransform: 'uppercase' as 'uppercase',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap' as 'nowrap'
    },
    
    tableRow: {
      transition: 'all 0.3s ease',
      borderBottom: '1px solid #f1f5f9'
    },
    
    tableCell: {
      padding: '20px 25px',
      verticalAlign: 'middle' as 'middle',
      fontSize: '14px'
    },
    
    // Elementos específicos de tabla
    idBadge: {
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      color: '#475569',
      padding: '6px 15px',
      borderRadius: '15px',
      fontSize: '12px',
      fontWeight: 700,
      fontFamily: `'SF Mono', 'Monaco', 'Courier New', monospace`,
      display: 'inline-block',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    
    imeiDisplay: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    
    imeiIcon: {
      fontSize: '22px',
      color: '#3b82f6',
      background: 'rgba(59, 130, 246, 0.1)',
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    
    imeiNumber: {
      fontFamily: `'SF Mono', 'Monaco', 'Courier New', monospace`,
      fontWeight: 600,
      color: '#1e293b',
      fontSize: '15px',
      letterSpacing: '0.5px'
    },
    
    imeiHint: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '4px'
    },
    
    imeiError: {
      color: '#ef4444',
      fontSize: '12px',
      marginLeft: '8px',
      fontWeight: 500
    },
    
    personaInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    
    personaIcon: {
      fontSize: '22px',
      color: '#10b981',
      background: 'rgba(16, 185, 129, 0.1)',
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    
    personaName: {
      fontWeight: 600,
      color: '#1e293b',
      fontSize: '15px',
      marginBottom: '4px',
      maxWidth: '200px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    
    personaId: {
      fontSize: '12px',
      color: '#64748b',
      fontFamily: `'SF Mono', 'Monaco', 'Courier New', monospace`
    },
    
    empresaInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    
    empresaIcon: {
      fontSize: '22px',
      color: '#8b5cf6',
      background: 'rgba(139, 92, 246, 0.1)',
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    
    empresaName: {
      color: '#1e293b',
      fontSize: '14px',
      fontWeight: 500,
      maxWidth: '150px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    
    fechaContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    
    fechaIcon: {
      fontSize: '22px',
      color: '#f59e0b',
      background: 'rgba(245, 158, 11, 0.1)',
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    
    fechaText: {
      color: '#475569',
      fontSize: '14px',
      fontWeight: 500
    },
    
    estadoBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '8px 20px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: 700,
      whiteSpace: 'nowrap' as 'nowrap',
      minWidth: '100px'
    },
    
    estadoBadgeActive: {
      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      color: '#065f46',
      border: '1px solid #10b981'
    },
    
    estadoBadgeInactive: {
      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      color: '#991b1b',
      border: '1px solid #ef4444'
    },
    
    estadoDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%'
    },
    
    estadoDotActive: {
      background: '#10b981',
      boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
    },
    
    estadoDotInactive: {
      background: '#ef4444',
      boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
    },
    
    // ── ACCIONES EN TABLA ── mejorado ──────────────────────────────────────
    actionsContainer: {
      display: 'flex',
      flexDirection: 'column' as 'column',
      gap: '6px',
      minWidth: '120px'
    },

    actionsTopRow: {
      display: 'flex',
      gap: '6px'
    },

    actionsBottomRow: {
      display: 'flex',
      gap: '6px'
    },
    
    btnAction: {
      padding: '9px 14px',
      borderRadius: '10px',
      fontWeight: 600,
      fontSize: '12px',
      cursor: 'pointer',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '5px',
      transition: 'all 0.25s ease',
      flex: 1,
      whiteSpace: 'nowrap' as 'nowrap'
    },
    
    btnView: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      color: '#1e40af',
      border: '1px solid #93c5fd'
    },
    
    btnEdit: {
      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      color: '#065f46',
      border: '1px solid #6ee7b7'
    },
    
    btnToggleDeactivate: {
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      color: '#92400e',
      border: '1px solid #fcd34d'
    },
    
    btnToggleActivate: {
      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      color: '#065f46',
      border: '1px solid #6ee7b7'
    },
    
    btnDelete: {
      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    },
    
    // Paginación
    pagination: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '25px 30px',
      borderTop: '1px solid #f1f5f9',
      background: '#f8fafc'
    },
    
    pageInfo: {
      color: '#64748b',
      fontSize: '14px',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    
    totalInfo: {
      color: '#475569',
      fontWeight: 600
    },
    
    btnPagination: {
      padding: '12px 24px',
      border: '2px solid #e2e8f0',
      background: 'white',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '14px',
      color: '#475569',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      minWidth: '120px'
    },
    
    // Estado vacío
    emptyState: {
      padding: '80px 30px',
      textAlign: 'center' as 'center',
      background: 'white'
    },
    
    emptyContent: {
      maxWidth: '500px',
      margin: '0 auto'
    },
    
    emptyIcon: {
      fontSize: '72px',
      marginBottom: '30px',
      color: '#e2e8f0',
      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))'
    },
    
    emptyTitle: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#1e293b',
      margin: '0 0 15px 0'
    },
    
    emptyText: {
      color: '#64748b',
      fontSize: '16px',
      lineHeight: 1.6,
      marginBottom: '30px'
    },
    
    // Estado de carga
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column' as 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '500px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
      borderRadius: '20px',
      padding: '60px'
    },
    
    spinner: {
      width: '70px',
      height: '70px',
      border: '5px solid rgba(59, 130, 246, 0.1)',
      borderTop: '5px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '30px',
      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.2)'
    },
    
    loadingText: {
      fontSize: '18px',
      color: '#64748b',
      fontWeight: 500
    }
  };

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm !== debouncedSearchTerm) {
        setFilters(prev => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar empresas
  useEffect(() => {
    loadEmpresas();
  }, []);

  // Cargar dispositivos cuando cambian filtros o personaId
  useEffect(() => {
    loadDispositivos();
  }, [filters, personaId, debouncedSearchTerm]);

  const loadEmpresas = async () => {
    if (userRole !== 'Admin' && !userEmpresaId) return;
    
    try {
      const data = await empresasService.getEmpresas();
      setEmpresas(Array.isArray(data) ? data : []);
    } catch (err) {
      // Error silencioso para empresas
    }
  };

  const loadDispositivos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params: any = { 
        ...filters,
        search: debouncedSearchTerm || undefined
      };
      
      // Si hay personaId, usar endpoint específico
      if (personaId) {
        const dispositivosPersona = await dispositivosService.getDispositivosPorPersona(personaId);
        setDispositivos(Array.isArray(dispositivosPersona) ? dispositivosPersona : []);
        setTotal(Array.isArray(dispositivosPersona) ? dispositivosPersona.length : 0);
        return;
      }
      
      // Para usuarios no Admin, solo de su empresa
      if (userRole !== 'Admin' && userEmpresaId) {
        params.empresaId = userEmpresaId;
      }
      
      const result = await dispositivosService.getDispositivos(params);
      
      // Asegurar que los datos son arrays
      const dispositivosArray = Array.isArray(result.dispositivos) ? result.dispositivos : 
                                Array.isArray(result) ? result : 
                                [];
      
      setDispositivos(dispositivosArray);
      setTotal(result.total || dispositivosArray.length);
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.mensaje || 
                       err.message || 
                       'Error al cargar dispositivos';
      setError(errorMsg);
      setDispositivos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await dispositivosService.createDispositivo(data);
      setShowForm(false);
      loadDispositivos();
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      await dispositivosService.updateDispositivo(id, data);
      setEditingDispositivo(null);
      loadDispositivos();
    } catch (err: any) {
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este dispositivo?')) return;
    
    try {
      await dispositivosService.deleteDispositivo(id);
      loadDispositivos();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al eliminar dispositivo');
    }
  };

  const handleToggleActivo = async (id: number, activo: boolean) => {
    try {
      await dispositivosService.toggleActivo(id, activo);
      loadDispositivos();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cambiar estado');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', {
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

  const formatIMEI = (imei: string | undefined) => {
    if (!imei) return 'IMEI no disponible';
    
    const cleanImei = imei.toString().trim().replace(/\D/g, '');
    
    if (cleanImei.length <= 15) return cleanImei;
    
    if (cleanImei.length === 15) {
      return `${cleanImei.substring(0, 6)}-${cleanImei.substring(6, 12)}-${cleanImei.substring(12, 15)}`;
    }
    
    const parts = [];
    for (let i = 0; i < cleanImei.length; i += 4) {
      parts.push(cleanImei.substring(i, i + 4));
    }
    return parts.join('-');
  };

  if (loading && dispositivos.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Cargando dispositivos...</p>
      </div>
    );
  }

  return (
    <div style={styles.container} ref={containerRef}>
      {/* Header */}
      {showHeader && (
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <div>
              <h1 style={styles.title}>
                <span role="img" aria-label="dispositivos">📱</span>
                Dispositivos Registrados
              </h1>
              <div style={styles.subtitle}>
                <span>
                  {personaId 
                    ? 'Dispositivos asignados a esta persona'
                    : 'Gestión de dispositivos móviles'}
                </span>
                <span style={styles.countBadge}>
                  {total} {total === 1 ? 'dispositivo' : 'dispositivos'}
                </span>
              </div>
            </div>
          </div>
          
          <div style={styles.headerActions}>
            {/* Barra de búsqueda */}
            <div style={styles.searchContainer}>
              <form onSubmit={handleSearch} style={styles.searchBox}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por IMEI, persona o empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
                {searchTerm && (
                  <button 
                    type="button"
                    style={styles.clearSearch}
                    onClick={() => setSearchTerm('')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ef4444';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ×
                  </button>
                )}
              </form>
            </div>
            
            {/* Botones de acción */}
            <div style={styles.actionButtons}>
              {(userRole === 'Admin') && (
                <button
                  onClick={() => setShowForm(true)}
                  style={{...styles.btn, ...styles.btnPrimary}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 25px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = styles.btnPrimary.boxShadow;
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{fontSize: '20px'}}>+</span>
                  Nuevo Dispositivo
                </button>
              )}
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{...styles.btn, ...styles.btnSecondary}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = styles.btnSecondary.boxShadow;
                }}
              >
                {showFilters ? '👁️ Ocultar filtros' : '🔧 Mostrar filtros'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <div style={styles.filtersPanel}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <span>🏢</span>
              Empresa
            </label>
            <select
              value={filters.empresaId || 0}
              onChange={(e) => setFilters({...filters, empresaId: parseInt(e.target.value), page: 1})}
              style={styles.filterSelect}
              disabled={userRole !== 'Admin' || !!personaId}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value={0}>Todas las empresas</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <span>⚡</span>
              Estado
            </label>
            <select
              value={filters.activo ? 'true' : 'false'}
              onChange={(e) => setFilters({...filters, activo: e.target.value === 'true', page: 1})}
              style={styles.filterSelect}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="true">✅ Activos</option>
              <option value="false">⏸️ Inactivos</option>
              <option value="">📋 Todos</option>
            </select>
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <span>📊</span>
              Mostrar por página
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value), page: 1})}
              style={styles.filterSelect}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value={10}>10 dispositivos</option>
              <option value={20}>20 dispositivos</option>
              <option value={50}>50 dispositivos</option>
              <option value={100}>100 dispositivos</option>
            </select>
          </div>
          
          <button
            onClick={() => setFilters({
              empresaId: userEmpresaId || 0,
              activo: true,
              page: 1,
              limit: 20
            })}
            style={styles.clearFiltersBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#1d4ed8';
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#3b82f6';
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            <span>🗑️</span>
            Limpiar todos los filtros
          </button>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div style={styles.errorMessage}>
          <span style={{fontSize: '24px'}}>⚠️</span>
          <span style={{flex: 1}}>{error}</span>
          <button 
            style={styles.errorClose}
            onClick={() => setError('')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Formularios modales */}
      {(showForm || editingDispositivo) && (
        <DispositivoForm
          dispositivo={editingDispositivo}
          onSubmit={editingDispositivo ? 
            (data) => handleUpdate(editingDispositivo.id, data) : 
            handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingDispositivo(null);
          }}
          title={editingDispositivo ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}
          empresas={empresas}
          userRole={userRole}
          userEmpresaId={userEmpresaId}
        />
      )}

      {/* Modal de detalle */}
      {selectedDispositivo && (
        <DispositivoDetail
          dispositivo={selectedDispositivo}
          onClose={() => setSelectedDispositivo(null)}
          onEdit={() => {
            setSelectedDispositivo(null);
            setEditingDispositivo(selectedDispositivo);
          }}
          userRole={userRole}
        />
      )}

      {/* Tabla de dispositivos */}
      <div style={styles.tableContainer}>
        {dispositivos.length > 0 ? (
          <>
            <div style={styles.tableInfo}>
              <span>
                Mostrando <strong>{dispositivos.length}</strong> de <strong>{total}</strong> dispositivos
                {debouncedSearchTerm && ` • Buscando: "${debouncedSearchTerm}"`}
              </span>
              <span style={{color: '#3b82f6', fontWeight: 600}}>
                Página {filters.page}
              </span>
            </div>
            
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.tableHeaderCell}>ID</th>
                    <th style={styles.tableHeaderCell}>IMEI</th>
                    <th style={styles.tableHeaderCell}>Persona</th>
                    <th style={styles.tableHeaderCell}>Empresa</th>
                    <th style={styles.tableHeaderCell}>Fecha Registro</th>
                    <th style={styles.tableHeaderCell}>Estado</th>
                    <th style={{...styles.tableHeaderCell, minWidth: '140px'}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {dispositivos.map((dispositivo) => (
                    <tr 
                      key={dispositivo.id}
                      style={{
                        ...styles.tableRow,
                        cursor: onDispositivoSelect ? 'pointer' : 'default',
                        background: !dispositivo.activo ? 'rgba(254, 242, 242, 0.3)' : 'transparent'
                      }}
                      onClick={() => {
                        if (onDispositivoSelect) {
                          onDispositivoSelect(dispositivo.id);
                        } else {
                          setSelectedDispositivo(dispositivo);
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = onDispositivoSelect 
                          ? 'rgba(59, 130, 246, 0.05)' 
                          : !dispositivo.activo 
                            ? 'rgba(254, 242, 242, 0.5)' 
                            : 'rgba(241, 245, 249, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = !dispositivo.activo 
                          ? 'rgba(254, 242, 242, 0.3)' 
                          : 'transparent';
                      }}
                    >
                      <td style={styles.tableCell}>
                        <span style={styles.idBadge}>#{dispositivo.id}</span>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.imeiDisplay}>
                          <div style={styles.imeiIcon}>📱</div>
                          <div>
                            <div style={styles.imeiNumber}>
                              {formatIMEI(dispositivo.imei)}
                              {!dispositivo.imei && (
                                <span style={styles.imeiError}>(No disponible)</span>
                              )}
                            </div>
                            {dispositivo.imei && (
                              <div style={styles.imeiHint}>
                                {dispositivo.imei.toString().replace(/\D/g, '').length} dígitos
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.personaInfo}>
                          <div style={styles.personaIcon}>👤</div>
                          <div>
                            <div style={styles.personaName}>
                              {dispositivo.personaNombre || 'Sin persona asignada'}
                            </div>
                            {dispositivo.personaId && (
                              <div style={styles.personaId}>ID: {dispositivo.personaId}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.empresaInfo}>
                          <div style={styles.empresaIcon}>🏢</div>
                          <div style={styles.empresaName}>
                            {dispositivo.empresaNombre || 'Sin empresa'}
                          </div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.fechaContainer}>
                          <div style={styles.fechaIcon}>📅</div>
                          <div style={styles.fechaText}>
                            {formatDate(dispositivo.fechaRegistro)}
                          </div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={{
                          ...styles.estadoBadge,
                          ...(dispositivo.activo ? styles.estadoBadgeActive : styles.estadoBadgeInactive)
                        }}>
                          <div style={{
                            ...styles.estadoDot,
                            ...(dispositivo.activo ? styles.estadoDotActive : styles.estadoDotInactive)
                          }}></div>
                          {dispositivo.activo ? 'Activo' : 'Inactivo'}
                        </div>
                      </td>

                      {/* ── COLUMNA DE ACCIONES REORGANIZADA ── */}
                      <td style={{...styles.tableCell, padding: '12px 16px'}} onClick={(e) => e.stopPropagation()}>
                        {userRole === 'Admin' ? (
                          /* Admin: Ver + Editar arriba | Activar/Desact + Eliminar abajo */
                          <div style={styles.actionsContainer}>
                            <div style={styles.actionsTopRow}>
                              <button
                                onClick={() => setSelectedDispositivo(dispositivo)}
                                style={{...styles.btnAction, ...styles.btnView}}
                                title="Ver detalles"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = styles.btnView.background;
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                👁️ Ver
                              </button>
                              <button
                                onClick={() => setEditingDispositivo(dispositivo)}
                                style={{...styles.btnAction, ...styles.btnEdit}}
                                title="Editar dispositivo"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = styles.btnEdit.background;
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                ✏️ Editar
                              </button>
                            </div>
                            <div style={styles.actionsBottomRow}>
                              <button
                                onClick={() => handleToggleActivo(dispositivo.id, !dispositivo.activo)}
                                style={{
                                  ...styles.btnAction,
                                  ...(dispositivo.activo ? styles.btnToggleDeactivate : styles.btnToggleActivate)
                                }}
                                title={dispositivo.activo ? 'Desactivar' : 'Activar'}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.25)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                {dispositivo.activo ? '⏸️ Desact.' : '▶️ Activar'}
                              </button>
                              <button
                                onClick={() => handleDelete(dispositivo.id)}
                                style={{...styles.btnAction, ...styles.btnDelete}}
                                title="Eliminar dispositivo"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = styles.btnDelete.background;
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                🗑️ Eliminar
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* No admin: solo botón Ver centrado */
                          <button
                            onClick={() => setSelectedDispositivo(dispositivo)}
                            style={{
                              ...styles.btnAction,
                              ...styles.btnView,
                              width: '100%'
                            }}
                            title="Ver detalles"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = styles.btnView.background;
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            👁️ Ver detalles
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {total > filters.limit && (
              <div style={styles.pagination}>
                <button
                  onClick={() => setFilters({...filters, page: Math.max(1, filters.page - 1)})}
                  disabled={filters.page === 1}
                  style={{
                    ...styles.btnPagination,
                    opacity: filters.page === 1 ? 0.5 : 1,
                    cursor: filters.page === 1 ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (filters.page !== 1) {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.color = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filters.page !== 1) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.color = '#475569';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  ← Anterior
                </button>
                
                <div style={styles.pageInfo}>
                  Página <strong>{filters.page}</strong> de <strong>{Math.ceil(total / filters.limit)}</strong>
                  <span style={styles.totalInfo}>({total} total)</span>
                </div>
                
                <button
                  onClick={() => setFilters({...filters, page: filters.page + 1})}
                  disabled={filters.page >= Math.ceil(total / filters.limit)}
                  style={{
                    ...styles.btnPagination,
                    opacity: filters.page >= Math.ceil(total / filters.limit) ? 0.5 : 1,
                    cursor: filters.page >= Math.ceil(total / filters.limit) ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (filters.page < Math.ceil(total / filters.limit)) {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.color = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filters.page < Math.ceil(total / filters.limit)) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.color = '#475569';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyContent}>
              <div style={styles.emptyIcon}>📱</div>
              <h3 style={styles.emptyTitle}>No hay dispositivos</h3>
              <p style={styles.emptyText}>
                {debouncedSearchTerm 
                  ? `No se encontraron dispositivos que coincidan con "${debouncedSearchTerm}"`
                  : 'Aún no hay dispositivos registrados en el sistema.'}
              </p>
              {(userRole === 'Admin') && !debouncedSearchTerm && (
                <button
                  onClick={() => setShowForm(true)}
                  style={{...styles.btn, ...styles.btnPrimary}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 25px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = styles.btnPrimary.boxShadow;
                  }}
                >
                  <span style={{fontSize: '20px'}}>+</span>
                  Registrar primer dispositivo
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Estilos CSS globales para este componente */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Scrollbar personalizada */
          div[style*="overflowX: auto"]::-webkit-scrollbar {
            height: 10px;
            background: #f1f5f9;
            border-radius: 10px;
          }

          div[style*="overflowX: auto"]::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }

          div[style*="overflowX: auto"]::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
            border: 2px solid #f1f5f9;
          }

          div[style*="overflowX: auto"]::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }

          /* Mejoras responsive */
          @media (max-width: 768px) {
            .dispositivos-header {
              padding: 20px;
            }
            
            .dispositivos-title {
              font-size: 24px;
            }
            
            .header-actions {
              flex-direction: column;
              gap: 15px;
            }
            
            .search-box {
              min-width: 100%;
            }
            
            .action-buttons {
              flex-direction: column;
              width: 100%;
            }
            
            .action-buttons button {
              width: 100%;
              justify-content: center;
            }
            
            .filters-panel {
              grid-template-columns: 1fr;
              padding: 20px;
            }
            
            .dispositivos-table th,
            .dispositivos-table td {
              padding: 12px 15px;
            }
            
            .pagination {
              flex-direction: column;
              gap: 15px;
              align-items: stretch;
            }
            
            .btn-pagination {
              width: 100%;
            }
          }

          @media (max-width: 480px) {
            .dispositivos-container {
              padding: 15px;
            }
            
            .dispositivos-header h1 {
              font-size: 20px;
            }
            
            .dispositivos-header .subtitle {
              font-size: 13px;
            }
            
            .count-badge {
              padding: 4px 10px;
              font-size: 12px;
            }
            
            .btn {
              padding: 12px 20px;
              font-size: 14px;
            }
            
            .dispositivos-table {
              min-width: 700px;
            }
          }

          /* Animaciones */
          .fade-in {
            animation: fadeIn 0.3s ease-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .slide-in {
            animation: slideIn 0.3s ease-out;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          /* Focus styles para accesibilidad */
          button:focus-visible,
          input:focus-visible,
          select:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
            border-radius: 4px;
          }

          /* Estados de carga */
          .loading {
            position: relative;
            pointer-events: none;
          }

          .loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin: -10px 0 0 -10px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default DispositivosList;