import React, {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { dispositivosService, Dispositivo } from '../../services/dispositivosService';
import { empresasService } from '../../services/empresasService';
import { 
  Smartphone, Search, Plus, Eye, Edit2, Trash2, Calendar, User, 
  Building2, Filter, Download, Play, Pause, ChevronLeft, ChevronRight, AlertTriangle, X 
} from 'lucide-react';
import './DispositivosList.css';

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

enum SortDirection { ASC = 'asc', DESC = 'desc', NONE = 'none' }
enum ViewMode      { Table = 'table', Grid = 'grid' }

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

interface Empresa { id: number; nombre: string; }

interface DispositivoFormData {
  imei: string;
  personaId?: number;
  empresaId?: number;
  activo?: boolean;
}

interface FiltersState {
  empresaId: number;
  activo: boolean;
  page: number;
  limit: number;
}

interface SortState {
  column: keyof Dispositivo | null;
  direction: SortDirection;
}

interface ColumnDef {
  key: keyof Dispositivo | 'acciones';
  label: string;
  sortable?: boolean;
}

export interface DispositivosListProps {
  userRole: string;
  userEmpresaId?: number;
  personaId?: number;
  modo?: 'embedded' | 'full';
  showHeader?: boolean;
  onDispositivoSelect?: (dispositivoId: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS   = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE   = 20;
const MAX_RETRY_ATTEMPTS  = 3;
const RETRY_DELAY_MS      = 1000;
const SKELETON_ROWS       = 5;

const TABLE_COLUMNS: ColumnDef[] = [
  { key: 'id',            label: 'ID',       sortable: true  },
  { key: 'imei',          label: 'IMEI',     sortable: true  },
  { key: 'personaNombre', label: 'Persona',  sortable: true  },
  { key: 'empresaNombre', label: 'Empresa',  sortable: true  },
  { key: 'fechaRegistro', label: 'Fecha',    sortable: true  },
  { key: 'activo',        label: 'Estado',   sortable: true  },
  { key: 'acciones',      label: 'Acciones', sortable: false },
];

const CSV_HEADERS = ['ID', 'IMEI', 'Persona', 'Empresa', 'Fecha Registro', 'Estado'];

const createDefaultFilters = (empresaId = 0): FiltersState => ({
  empresaId,
  activo: true,
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
});

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (dateString: string): string => {
  if (!dateString) return '—';
  try {
    const d = new Date(`${dateString.split('T')[0]}T00:00:00`);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

const formatIMEI = (imei: string | undefined): string => {
  if (!imei) return 'No disponible';
  const c = imei.replace(/\D/g, '');
  if (c.length !== 15) return c;
  return `${c.slice(0, 6)}-${c.slice(6, 12)}-${c.slice(12)}`;
};

const extractErrorMessage = (err: unknown, fallback = 'Ha ocurrido un error inesperado'): string => {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const rd = e.response as Record<string, unknown> | undefined;
    if (rd?.data && typeof rd.data === 'object') {
      const d = rd.data as Record<string, unknown>;
      if (typeof d.mensaje === 'string') return d.mensaje;
    }
    if (typeof e.message === 'string') return e.message;
  }
  return fallback;
};

const exportToCSV = (dispositivos: Dispositivo[], filename = 'dispositivos.csv'): void => {
  const rows = [
    CSV_HEADERS,
    ...dispositivos.map(d => [
      String(d.id), d.imei ?? '', d.personaNombre ?? 'Sin asignar',
      d.empresaNombre ?? '—', formatDate(d.fechaRegistro), d.activo ? 'Activo' : 'Inactivo',
    ]),
  ];
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
};

const sortDispositivos = (
  list: Dispositivo[],
  column: keyof Dispositivo | null,
  direction: SortDirection,
): Dispositivo[] => {
  if (!column || direction === SortDirection.NONE) return list;
  return [...list].sort((a, b) => {
    const cmp = String(a[column] ?? '').localeCompare(String(b[column] ?? ''), 'es', { numeric: true });
    return direction === SortDirection.ASC ? cmp : -cmp;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// FILTERS REDUCER
// ─────────────────────────────────────────────────────────────────────────────

type FiltersAction =
  | { type: 'SET_EMPRESA';    payload: number }
  | { type: 'SET_ACTIVO';     payload: boolean }
  | { type: 'SET_PAGE';       payload: number }
  | { type: 'SET_LIMIT';      payload: number }
  | { type: 'RESET';          payload: number }
  | { type: 'SET_SEARCH_PAGE' };

const filtersReducer = (state: FiltersState, action: FiltersAction): FiltersState => {
  switch (action.type) {
    case 'SET_EMPRESA':    return { ...state, empresaId: action.payload, page: 1 };
    case 'SET_ACTIVO':     return { ...state, activo:    action.payload, page: 1 };
    case 'SET_PAGE':       return { ...state, page:      action.payload };
    case 'SET_LIMIT':      return { ...state, limit:     action.payload, page: 1 };
    case 'RESET':          return createDefaultFilters(action.payload);
    case 'SET_SEARCH_PAGE':return { ...state, page: 1 };
    default:               return state;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM HOOK — useDispositivos
// ─────────────────────────────────────────────────────────────────────────────

const useDispositivos = ({
  userRole, userEmpresaId, personaId,
}: { userRole: string; userEmpresaId?: number; personaId?: number }) => {
  const isAdmin = userRole === 'Admin';

  const [filters, dispatchFilters] = useReducer(filtersReducer, createDefaultFilters(userEmpresaId));

  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [retryCount,   setRetryCount]   = useState(0);

  const empresasCacheRef = useRef<Empresa[] | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const [searchTerm,      setSearchTerm]      = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sort, setSort] = useState<SortState>({ column: null, direction: SortDirection.NONE });

  const [selectedDev,    setSelectedDev]    = useState<Dispositivo | null>(null);
  const [editingDev,     setEditingDev]     = useState<Dispositivo | null>(null);
  const [showForm,       setShowForm]       = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState<number | null>(null);
  const [selectedIds,    setSelectedIds]    = useState<Set<number>>(new Set());

  // ── Debounce ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      dispatchFilters({ type: 'SET_SEARCH_PAGE' });
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  // ── Empresas ─────────────────────────────────────────────────────────────
  const loadEmpresas = useCallback(async () => {
    if (!isAdmin && !userEmpresaId) return;
    if (empresasCacheRef.current) { setEmpresas(empresasCacheRef.current); return; }
    try {
      const data = await empresasService.getEmpresas();
      const arr: Empresa[] = Array.isArray(data) ? data : [];
      empresasCacheRef.current = arr;
      setEmpresas(arr);
    } catch { /* no crítico */ }
  }, [isAdmin, userEmpresaId]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);

  // ── Carga con retry ──────────────────────────────────────────────────────
  const loadDispositivos = useCallback(async (attempt = 0) => {
    try {
      setLoading(true); setError('');
      if (personaId) {
        const data = await dispositivosService.getDispositivosPorPersona(personaId);
        const arr = Array.isArray(data) ? (data as Dispositivo[]) : [];
        setDispositivos(arr); setTotal(arr.length); setRetryCount(0); return;
      }
      const params: Record<string, unknown> = { ...filters, search: debouncedSearch || undefined };
      if (!isAdmin && userEmpresaId) params.empresaId = userEmpresaId;
      const result = await dispositivosService.getDispositivos(params);
      const arr: Dispositivo[] = Array.isArray(result.dispositivos)
        ? result.dispositivos
        : Array.isArray(result) ? (result as Dispositivo[]) : [];
      setDispositivos(arr); setTotal(result.total || arr.length); setRetryCount(0);
    } catch (err) {
      if (attempt < MAX_RETRY_ATTEMPTS) {
        setTimeout(() => loadDispositivos(attempt + 1), RETRY_DELAY_MS * (attempt + 1));
        setRetryCount(attempt + 1);
      } else {
        setError(extractErrorMessage(err, 'Error al cargar dispositivos'));
        setDispositivos([]); setTotal(0); setRetryCount(0);
      }
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, personaId, debouncedSearch, isAdmin, userEmpresaId]);

  useEffect(() => { loadDispositivos(); }, [loadDispositivos]);

  // ── Memoizados ───────────────────────────────────────────────────────────
  const totalPages = useMemo(() => Math.ceil(total / filters.limit), [total, filters.limit]);

  const sortedDispositivos = useMemo(
    () => sortDispositivos(dispositivos, sort.column, sort.direction),
    [dispositivos, sort],
  );

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleCreate = useCallback(async (data: DispositivoFormData) => {
    await dispositivosService.createDispositivo(data);
    setShowForm(false); loadDispositivos();
  }, [loadDispositivos]);

  const handleUpdate = useCallback(async (id: number, data: DispositivoFormData) => {
    await dispositivosService.updateDispositivo(id, data);
    setEditingDev(null); loadDispositivos();
  }, [loadDispositivos]);

  const handleDeleteConfirm = useCallback(async (id: number) => {
    try {
      await dispositivosService.deleteDispositivo(id);
      setConfirmDelete(null); loadDispositivos();
    } catch (err) {
      setError(extractErrorMessage(err, 'Error al eliminar'));
      setConfirmDelete(null);
    }
  }, [loadDispositivos]);

  const handleToggle = useCallback(async (id: number, activo: boolean) => {
    try { await dispositivosService.toggleActivo(id, activo); loadDispositivos(); }
    catch (err) { setError(extractErrorMessage(err, 'Error al cambiar estado')); }
  }, [loadDispositivos]);

  // ── Ordenamiento ─────────────────────────────────────────────────────────
  const handleSort = useCallback((column: keyof Dispositivo) => {
    setSort(prev => {
      if (prev.column !== column) return { column, direction: SortDirection.ASC };
      if (prev.direction === SortDirection.ASC) return { column, direction: SortDirection.DESC };
      return { column: null, direction: SortDirection.NONE };
    });
  }, []);

  // ── Selección ────────────────────────────────────────────────────────────
  const toggleSelection = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.size === sortedDispositivos.length
        ? new Set()
        : new Set(sortedDispositivos.map(d => d.id)),
    );
  }, [sortedDispositivos]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  return {
    dispositivos: sortedDispositivos, total, loading, error, retryCount, empresas,
    filters, dispatchFilters,
    searchTerm, setSearchTerm, debouncedSearch,
    sort, handleSort,
    selectedDev, setSelectedDev, editingDev, setEditingDev,
    showForm, setShowForm, confirmDelete, setConfirmDelete,
    handleCreate, handleUpdate, handleDeleteConfirm, handleToggle,
    totalPages, selectedIds, toggleSelection, toggleSelectAll, clearSelection,
    isAdmin,
    clearError: () => setError(''),
    retry: () => loadDispositivos(),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── ActionBtn ────────────────────────────────────────────────────────────────
type ActionVariant = 'view' | 'edit' | 'deact' | 'activ' | 'del';
interface ActionBtnProps { variant: ActionVariant; onClick: () => void; label: string; icon: React.ReactNode; title?: string; }
const ActionBtn = memo<ActionBtnProps>(({ variant, onClick, label, icon, title }) => {
  const cssClass = variant === 'view' ? 'view' : variant === 'edit' ? 'edit' : variant === 'del' ? 'delete' : 'toggle';
  return (
    <button
      onClick={onClick}
      title={title ?? label}
      aria-label={label}
      className={`dispositivos-action-btn ${cssClass}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
});
ActionBtn.displayName = 'ActionBtn';

// ── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = memo(({ activo }: { activo: boolean }) => (
  <span 
    role="status" 
    aria-label={activo ? 'Activo' : 'Inactivo'} 
    className={`dispositivos-badge-status ${activo ? 'active' : 'inactive'}`}
  >
    <span aria-hidden className="dispositivos-status-dot" />
    {activo ? 'Activo' : 'Inactivo'}
  </span>
));
StatusBadge.displayName = 'StatusBadge';

// ── SkeletonRow ──────────────────────────────────────────────────────────────
const SkeletonRow = memo(() => (
  <tr className="dispositivos-table-row">
    {[70, 160, 140, 120, 100, 80, 200].map((w, i) => (
      <td key={i} className="dispositivos-table-td">
        <div style={{ height: '14px', borderRadius: '6px', background: 'var(--gray-200)', width: `${w}px`, animation: 'shimmer 2s infinite' }} />
      </td>
    ))}
  </tr>
));
SkeletonRow.displayName = 'SkeletonRow';

// ── ConfirmModal ─────────────────────────────────────────────────────────────
const ConfirmModal = memo(({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) => (
  <div role="dialog" aria-modal="true" aria-label="Confirmar eliminación"
    onClick={onCancel}
    style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}>
    <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '24px', padding: '36px', maxWidth: '440px', width: '90%', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--gray-200)', animation: 'slideUp 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: 'var(--danger)' }}>
        <AlertTriangle size={48} />
      </div>
      <h3 style={{ textAlign: 'center', margin: '0 0 12px', fontSize: '20px', fontWeight: 700, color: 'var(--gray-900)' }}>¿Confirmar eliminación?</h3>
      <p  style={{ textAlign: 'center', color: 'var(--gray-500)', margin: '0 0 28px', fontSize: '14px', lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button autoFocus onClick={onCancel} style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: 600, background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px solid var(--gray-200)', cursor: 'pointer', transition: 'all 0.2s' }}>Cancelar</button>
        <button          onClick={onConfirm} style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: 600, background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>Eliminar</button>
      </div>
    </div>
  </div>
));
ConfirmModal.displayName = 'ConfirmModal';

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH INPUT
// ─────────────────────────────────────────────────────────────────────────────
const SearchInput = memo(({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value), [onChange]);
  return (
    <div className="dispositivos-search-wrapper" role="search">
      <input
        type="search" aria-label="Buscar dispositivos"
        placeholder="Buscar por IMEI, persona o empresa..."
        value={value} onChange={handleChange}
        className="dispositivos-search-input"
      />
      <span aria-hidden className="dispositivos-search-icon">
        <Search size={18} />
      </span>
      {value && (
        <button 
          aria-label="Limpiar búsqueda" 
          onClick={() => onChange('')} 
          style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
});
SearchInput.displayName = 'SearchInput';

// ─────────────────────────────────────────────────────────────────────────────
// FILTERS PANEL
// ─────────────────────────────────────────────────────────────────────────────

const FiltersPanel = memo(({
  filters, dispatch, empresas, isAdmin, hasPersonaFilter, defaultEmpresaId,
}: {
  filters: FiltersState; dispatch: (a: FiltersAction) => void;
  empresas: Empresa[]; isAdmin: boolean; hasPersonaFilter: boolean; defaultEmpresaId: number;
}) => (
  <div role="group" aria-label="Filtros de búsqueda" className="dispositivos-filters-card">
    <div style={{ flex: 1 }}>
      <label htmlFor="fl-empresa" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '8px', display: 'block' }}>🏢 Empresa</label>
      <select id="fl-empresa" value={filters.empresaId} onChange={e => dispatch({ type: 'SET_EMPRESA', payload: +e.target.value })} disabled={!isAdmin || hasPersonaFilter} className="dispositivos-filter-select">
        <option value={0}>Todas las empresas</option>
        {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>
    </div>
    <div style={{ flex: 1 }}>
      <label htmlFor="fl-estado" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '8px', display: 'block' }}>⚡ Estado</label>
      <select id="fl-estado" value={String(filters.activo)} onChange={e => dispatch({ type: 'SET_ACTIVO', payload: e.target.value === 'true' })} className="dispositivos-filter-select">
        <option value="true">✅ Activos</option>
        <option value="false">⏸ Inactivos</option>
      </select>
    </div>
    <div style={{ flex: 1 }}>
      <label htmlFor="fl-limit" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '8px', display: 'block' }}>📊 Por página</label>
      <select id="fl-limit" value={filters.limit} onChange={e => dispatch({ type: 'SET_LIMIT', payload: +e.target.value })} className="dispositivos-filter-select">
        {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} dispositivos</option>)}
      </select>
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', height: '46px' }}>
      <button 
        onClick={() => dispatch({ type: 'RESET', payload: defaultEmpresaId })} 
        aria-label="Restablecer filtros" 
        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <Trash2 size={16} /> Limpiar filtros
      </button>
    </div>
  </div>
));
FiltersPanel.displayName = 'FiltersPanel';

// ─────────────────────────────────────────────────────────────────────────────
// SORT ICON
// ─────────────────────────────────────────────────────────────────────────────
const SortIcon = ({ column, sort }: { column: keyof Dispositivo; sort: SortState }) => {
  if (sort.column !== column) return <span style={{ opacity: 0.3, marginLeft: '6px' }}>⇅</span>;
  return <span style={{ marginLeft: '6px', color: 'var(--primary)' }}>{sort.direction === SortDirection.ASC ? '↑' : '↓'}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// DISPOSITIVOS TABLE
// ─────────────────────────────────────────────────────────────────────────────
interface TableProps {
  dispositivos: Dispositivo[]; loading: boolean; total: number;
  isAdmin: boolean; debouncedSearch: string; sort: SortState;
  selectedIds: Set<number>; page: number;
  onSort: (c: keyof Dispositivo) => void;
  onView: (d: Dispositivo) => void; onEdit: (d: Dispositivo) => void;
  onToggle: (id: number, a: boolean) => void; onDeleteRequest: (id: number) => void;
  onRowClick?: (d: Dispositivo) => void;
  onSelectAll: () => void; onToggleSelect: (id: number) => void;
}

const DispositivosTable = memo<TableProps>(({
  dispositivos, loading, total, isAdmin, debouncedSearch, sort,
  selectedIds, page, onSort, onView, onEdit, onToggle, onDeleteRequest,
  onRowClick, onSelectAll, onToggleSelect,
}) => {

  const handleKeyDown = useCallback((e: React.KeyboardEvent, dev: Dispositivo) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(dev); }
  }, [onView]);

  if (!loading && dispositivos.length === 0) return (
    <div className="dispositivos-empty-state">
      <div aria-hidden className="dispositivos-empty-icon">
        <Smartphone size={64} style={{ margin: '0 auto' }} />
      </div>
      <h3>No hay dispositivos</h3>
      <p>
        {debouncedSearch ? `No se encontraron resultados para "${debouncedSearch}"` : 'Aún no hay dispositivos registrados en el sistema.'}
      </p>
      {debouncedSearch && (
        <ul style={{ color: 'var(--gray-500)', fontSize: '13px', listStyle: 'none', padding: 0, lineHeight: 2 }}>
          <li>• Verifica que el IMEI esté completo (15 dígitos)</li>
          <li>• Prueba buscar por nombre de persona o empresa</li>
          <li>• Revisa el filtro de estado activo/inactivo</li>
        </ul>
      )}
    </div>
  );

  const allSelected = dispositivos.length > 0 && selectedIds.size === dispositivos.length;

  return (
    <>
      {dispositivos.length > 0 && (
        <div style={{ padding: '14px 22px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--gray-500)', fontWeight: 500 }}>
          <span aria-live="polite" role="status">
            Mostrando <strong style={{ color: 'var(--gray-900)' }}>{dispositivos.length}</strong> de <strong style={{ color: 'var(--gray-900)' }}>{total}</strong> dispositivos
            {debouncedSearch && <span> · buscando "<em>{debouncedSearch}</em>"</span>}
            {selectedIds.size > 0 && <span style={{ color: 'var(--primary)', marginLeft: '8px' }}>· {selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}</span>}
          </span>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Página {page}</span>
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table role="grid" aria-label="Lista de dispositivos" className="dispositivos-table">
          <thead>
            <tr style={{ background: 'var(--gray-50)' }}>
              {isAdmin && (
                <th style={{ padding: '14px 12px', borderBottom: '2px solid var(--gray-200)', width: '44px' }}>
                  <input type="checkbox" aria-label="Seleccionar todos" checked={allSelected} onChange={onSelectAll} style={{ cursor: 'pointer' }} />
                </th>
              )}
              {TABLE_COLUMNS.map(col => (
                <th key={col.key} scope="col"
                  className="dispositivos-table-th"
                  aria-sort={col.sortable && col.key !== 'acciones'
                    ? (sort.column === col.key ? (sort.direction === SortDirection.ASC ? 'ascending' : 'descending') : 'none')
                    : undefined}
                  onClick={col.sortable && col.key !== 'acciones' ? () => onSort(col.key as keyof Dispositivo) : undefined}
                  style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  {col.label}
                  {col.sortable && col.key !== 'acciones' && <SortIcon column={col.key as keyof Dispositivo} sort={sort} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => <SkeletonRow key={i} />)
              : dispositivos.map(dev => {
                  const isSelected = selectedIds.has(dev.id);
                  return (
                    <tr key={dev.id} role="row" tabIndex={0} aria-selected={isSelected}
                      className={`dispositivos-table-row ${dev.activo ? '' : 'inactive'}`}
                      onClick={() => onRowClick ? onRowClick(dev) : onView(dev)}
                      onKeyDown={e => handleKeyDown(e, dev)}
                      style={{ background: isSelected ? 'rgba(20, 40, 160, 0.08)' : undefined }}>
                      {isAdmin && (
                        <td className="dispositivos-table-td" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" aria-label={`Seleccionar dispositivo ${dev.imei}`} checked={isSelected} onChange={() => onToggleSelect(dev.id)} style={{ cursor: 'pointer' }} />
                        </td>
                      )}
                      <td className="dispositivos-table-td">
                        <span style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}>#{dev.id}</span>
                      </td>
                      <td className="dispositivos-table-td">
                        <div className="dispositivos-cell-profile">
                          <div className="dispositivos-cell-avatar">
                            <Smartphone size={18} />
                          </div>
                          <div>
                            <div className="dispositivos-imei-text">{formatIMEI(dev.imei)}</div>
                            {dev.imei && <div className="dispositivos-cell-sub">{dev.imei.replace(/\D/g, '').length} dígitos</div>}
                          </div>
                        </div>
                      </td>
                      <td className="dispositivos-table-td">
                        <div className="dispositivos-cell-profile">
                          <div className="dispositivos-cell-avatar" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                            <User size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{dev.personaNombre || 'Sin asignar'}</div>
                            {dev.personaId && <div className="dispositivos-cell-sub">ID: {dev.personaId}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="dispositivos-table-td">
                        <div className="dispositivos-cell-profile">
                          <div className="dispositivos-cell-avatar" style={{ background: 'rgba(114, 46, 209, 0.1)', color: '#722ed1' }}>
                            <Building2 size={18} />
                          </div>
                          <span style={{ fontWeight: 600 }}>{dev.empresaNombre || '—'}</span>
                        </div>
                      </td>
                      <td className="dispositivos-table-td">
                        <div className="dispositivos-cell-profile">
                          <div className="dispositivos-cell-avatar" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                            <Calendar size={18} />
                          </div>
                          <span>{formatDate(dev.fechaRegistro)}</span>
                        </div>
                      </td>
                      <td className="dispositivos-table-td"><StatusBadge activo={dev.activo} /></td>
                      <td className="dispositivos-table-td" onClick={e => e.stopPropagation()}>
                        {isAdmin ? (
                          <div className="dispositivos-actions-wrapper">
                            <ActionBtn variant="view"  icon={<Eye size={14} />} label="Ver"     title="Ver detalles"              onClick={() => onView(dev)} />
                            <ActionBtn variant="edit"  icon={<Edit2 size={14} />} label="Editar"  title="Editar dispositivo"        onClick={() => onEdit(dev)} />
                            <ActionBtn variant={dev.activo ? 'deact' : 'activ'} icon={dev.activo ? <Pause size={14} /> : <Play size={14} />} label={dev.activo ? 'Desact.' : 'Activar'} title={dev.activo ? 'Desactivar' : 'Activar'} onClick={() => onToggle(dev.id, !dev.activo)} />
                            <ActionBtn variant="del"   icon={<Trash2 size={14} />} label="Elim."   title="Eliminar permanentemente"  onClick={() => onDeleteRequest(dev.id)} />
                          </div>
                        ) : (
                          <ActionBtn variant="view" icon={<Eye size={14} />} label="Ver detalles" onClick={() => onView(dev)} />
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </>
  );
});
DispositivosTable.displayName = 'DispositivosTable';

// ─────────────────────────────────────────────────────────────────────────────
// GRID VIEW (vista tarjetas)
// ─────────────────────────────────────────────────────────────────────────────
interface GridViewProps {
  dispositivos: Dispositivo[]; isAdmin: boolean; selectedIds: Set<number>;
  onView: (d: Dispositivo) => void; onEdit: (d: Dispositivo) => void;
  onToggle: (id: number, a: boolean) => void; onDeleteRequest: (id: number) => void;
  onToggleSelect: (id: number) => void;
}

const DevCard = memo(({ dev, isAdmin, isSelected, onView, onEdit, onToggle, onDeleteRequest, onToggleSelect }: {
  dev: Dispositivo; isAdmin: boolean; isSelected: boolean;
  onView: (d: Dispositivo) => void; onEdit: (d: Dispositivo) => void;
  onToggle: (id: number, a: boolean) => void; onDeleteRequest: (id: number) => void;
  onToggleSelect: (id: number) => void;
}) => (
  <div onClick={() => onView(dev)} style={{ background: isSelected ? 'rgba(20, 40, 160, 0.04)' : '#fff', border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius-lg)', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(20, 40, 160, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Smartphone size={22} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <StatusBadge activo={dev.activo} />
        {isAdmin && <input type="checkbox" aria-label={`Seleccionar ${dev.imei}`} checked={isSelected} onChange={() => onToggleSelect(dev.id)} onClick={e => e.stopPropagation()} style={{ cursor: 'pointer' }} />}
      </div>
    </div>
    <div>
      <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>IMEI</div>
      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }}>{formatIMEI(dev.imei)}</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
      {[['Persona', dev.personaNombre || 'Sin asignar'], ['Empresa', dev.empresaNombre || '—'], ['Registro', formatDate(dev.fechaRegistro)], ['ID', `#${dev.id}`]].map(([label, value]) => (
        <div key={label}>
          <div style={{ color: 'var(--gray-400)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
          <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{value}</div>
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid var(--gray-200)', paddingTop: '12px' }} onClick={e => e.stopPropagation()}>
      <ActionBtn variant="view" icon={<Eye size={14} />} label="Ver" onClick={() => onView(dev)} />
      {isAdmin && <>
        <ActionBtn variant="edit"  icon={<Edit2 size={14} />} label="Editar" onClick={() => onEdit(dev)} />
        <ActionBtn variant={dev.activo ? 'deact' : 'activ'} icon={dev.activo ? <Pause size={14} /> : <Play size={14} />} label={dev.activo ? 'Desact.' : 'Activar'} onClick={() => onToggle(dev.id, !dev.activo)} />
        <ActionBtn variant="del"  icon={<Trash2 size={14} />} label="Elim."  onClick={() => onDeleteRequest(dev.id)} />
      </>}
    </div>
  </div>
));
DevCard.displayName = 'DevCard';

const GridView = memo<GridViewProps>(({ dispositivos, isAdmin, selectedIds, onView, onEdit, onToggle, onDeleteRequest, onToggleSelect }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px', padding: '20px' }}>
    {dispositivos.map(dev => (
      <DevCard key={dev.id} dev={dev} isAdmin={isAdmin} isSelected={selectedIds.has(dev.id)}
        onView={onView} onEdit={onEdit} onToggle={onToggle} onDeleteRequest={onDeleteRequest} onToggleSelect={onToggleSelect} />
    ))}
  </div>
));
GridView.displayName = 'GridView';

// ─────────────────────────────────────────────────────────────────────────────
// LAZY MODALS
// ─────────────────────────────────────────────────────────────────────────────
const DispositivoForm   = lazy(() => import('./DispositivoForm'));
const DispositivoDetail = lazy(() => import('./DispositivoDetail'));

const ModalFallback = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
    <div style={{ width: '44px', height: '44px', border: '3px solid rgba(20, 40, 160, 0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const DispositivosList: React.FC<DispositivosListProps> = ({
  userRole,
  userEmpresaId,
  personaId,
  modo = 'full',
  showHeader = true,
  onDispositivoSelect,
}) => {
  const {
    dispositivos, total, loading, error, retryCount, empresas,
    filters, dispatchFilters,
    searchTerm, setSearchTerm, debouncedSearch,
    sort, handleSort,
    selectedDev, setSelectedDev, editingDev, setEditingDev,
    showForm, setShowForm, confirmDelete, setConfirmDelete,
    handleCreate, handleUpdate, handleDeleteConfirm, handleToggle,
    totalPages, selectedIds, toggleSelection, toggleSelectAll, clearSelection,
    isAdmin, clearError, retry,
  } = useDispositivos({ userRole, userEmpresaId, personaId });

  const [viewMode,     setViewMode]     = useState<ViewMode>(ViewMode.Table);
  const [showFilters,  setShowFilters]  = useState(false);

  const handleRowClick = useCallback((dev: Dispositivo) => {
    onDispositivoSelect ? onDispositivoSelect(dev.id) : setSelectedDev(dev);
  }, [onDispositivoSelect, setSelectedDev]);

  const handleExportCSV = useCallback(() => exportToCSV(dispositivos, 'dispositivos.csv'), [dispositivos]);

  return (
    <div className="dispositivos-wrapper" style={{ padding: modo === 'embedded' ? 0 : undefined }}>
      
      {/* ── HEADER ── */}
      {showHeader && (
        <div className="dispositivos-header-card">
          <div className="dispositivos-header-info">
            <div className="dispositivos-header-icon">
              <Smartphone size={28} />
            </div>
            <div className="dispositivos-header-title">
              <h1>Dispositivos Registrados</h1>
              <p>{personaId ? 'Dispositivos asignados a esta persona' : 'Gestión de dispositivos móviles'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', zIndex: 2 }}>
            {/* Toggle vista tabla/tarjetas */}
            <div style={{ display: 'flex', border: '1px solid var(--gray-200)', borderRadius: '8px', overflow: 'hidden' }}>
              {([ViewMode.Table, ViewMode.Grid] as const).map((m, i) => (
                <button key={m} aria-label={m === ViewMode.Table ? 'Vista tabla' : 'Vista tarjetas'} aria-pressed={viewMode === m}
                  onClick={() => setViewMode(m)}
                  style={{ padding: '8px 12px', border: 'none', cursor: 'pointer', fontSize: '14px', background: viewMode === m ? 'rgba(20, 40, 160, 0.08)' : 'white', color: viewMode === m ? 'var(--primary)' : 'var(--gray-500)', borderLeft: i > 0 ? '1px solid var(--gray-200)' : undefined }}>
                  {m === ViewMode.Table ? '☰' : '⊞'}
                </button>
              ))}
            </div>

            {/* Exportar CSV */}
            <button 
              onClick={handleExportCSV} 
              className="dispositivos-btn dispositivos-btn-secondary"
            >
              <Download size={16} /> Exportar
            </button>

            {/* Filtros */}
            <button 
              onClick={() => setShowFilters(f => !f)}
              className="dispositivos-btn dispositivos-btn-secondary"
              style={{ background: showFilters ? 'rgba(20, 40, 160, 0.08)' : undefined, color: showFilters ? 'var(--primary)' : undefined, borderColor: showFilters ? 'var(--primary)' : undefined }}
            >
              <Filter size={16} /> {showFilters ? 'Ocultar filtros' : 'Filtros'}
            </button>

            {/* Nuevo dispositivo */}
            {isAdmin && (
              <button 
                onClick={() => setShowForm(true)}
                className="dispositivos-btn dispositivos-btn-primary"
              >
                <Plus size={18} /> Nuevo Dispositivo
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── ESTADÍSTICAS ── */}
      {showHeader && (
        <div className="dispositivos-stats-container">
          <div className="dispositivos-stat-pill">
            <div className="dispositivos-stat-value">{total}</div>
            <div>
              <div className="dispositivos-stat-label">Total</div>
              <div className="dispositivos-stat-text">Dispositivos registrados</div>
            </div>
          </div>
          <div className="dispositivos-stat-pill">
            <div className="dispositivos-stat-value">
              {dispositivos.filter(d => d.activo).length}
            </div>
            <div>
              <div className="dispositivos-stat-label">Activos</div>
              <div className="dispositivos-stat-text">Dispositivos en línea</div>
            </div>
          </div>
        </div>
      )}

      {/* ── BÚSQUEDA ── */}
      {showHeader && (
        <div style={{ marginBottom: '24px' }}>
          <SearchInput value={searchTerm} onChange={setSearchTerm} />
        </div>
      )}

      {/* ── FILTROS ── */}
      {showFilters && (
        <FiltersPanel filters={filters} dispatch={dispatchFilters} empresas={empresas}
          isAdmin={isAdmin} hasPersonaFilter={!!personaId} defaultEmpresaId={userEmpresaId ?? 0} />
      )}

      {/* ── RETRY NOTICE ── */}
      {retryCount > 0 && (
        <div role="status" aria-live="polite" style={{ background: '#fff7e6', border: '1px solid #ffd591', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', color: '#d46b08' }}>
          ⏳ Reintentando conexión… intento {retryCount}
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="dispositivos-error-banner" role="alert" aria-live="assertive">
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> {error}
          </span>
          <button aria-label="Reintentar" onClick={retry} style={{ marginRight: '12px', fontSize: '13px', fontWeight: 600 }}>Reintentar</button>
          <button aria-label="Cerrar error" onClick={clearError}><X size={18} /></button>
        </div>
      )}

      {/* ── BARRA SELECCIÓN MÚLTIPLE ── */}
      {isAdmin && selectedIds.size > 0 && (
        <div style={{ background: 'rgba(0, 123, 255, 0.08)', border: '1px solid rgba(0, 123, 255, 0.2)', borderRadius: '12px', padding: '12px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', animation: 'slideDown 0.2s ease' }}>
          <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}</span>
          <button onClick={clearSelection} style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancelar selección</button>
        </div>
      )}

      {/* ── TABLA / GRID ── */}
      <div className="dispositivos-table-card">
        {loading && dispositivos.length === 0 ? (
          <div className="dispositivos-loading">
            <div className="dispositivos-spinner" />
            <span>Cargando dispositivos...</span>
          </div>
        ) : (
          <>
            {viewMode === ViewMode.Table ? (
              <DispositivosTable
                dispositivos={dispositivos} loading={loading} total={total}
                isAdmin={isAdmin} debouncedSearch={debouncedSearch} sort={sort}
                selectedIds={selectedIds} page={filters.page}
                onSort={handleSort} onView={setSelectedDev} onEdit={setEditingDev}
                onToggle={handleToggle} onDeleteRequest={setConfirmDelete}
                onRowClick={onDispositivoSelect ? handleRowClick : undefined}
                onSelectAll={toggleSelectAll} onToggleSelect={toggleSelection}
              />
            ) : (
              <GridView dispositivos={dispositivos} isAdmin={isAdmin} selectedIds={selectedIds}
                onView={setSelectedDev} onEdit={setEditingDev} onToggle={handleToggle}
                onDeleteRequest={setConfirmDelete} onToggleSelect={toggleSelection} />
            )}

            {/* ── PAGINACIÓN ── */}
            {totalPages > 1 && (
              <div className="dispositivos-table-footer">
                <span>Página <strong>{filters.page}</strong> de <strong>{totalPages}</strong> ({total} total)</span>
                <div className="dispositivos-pagination" role="navigation" aria-label="Paginación">
                  <button 
                    disabled={filters.page === 1} 
                    onClick={() => dispatchFilters({ type: 'SET_PAGE', payload: filters.page - 1 })}
                    className="dispositivos-pagination-btn"
                  >
                    <ChevronLeft size={16} style={{ display: 'inline-block', verticalAlign: 'middle' }} /> Anterior
                  </button>
                  <button 
                    disabled={filters.page >= totalPages} 
                    onClick={() => dispatchFilters({ type: 'SET_PAGE', payload: filters.page + 1 })}
                    className="dispositivos-pagination-btn"
                  >
                    Siguiente <ChevronRight size={16} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODALES (lazy) ── */}
      {(showForm || editingDev) && (
        <Suspense fallback={<ModalFallback />}>
          <DispositivoForm
            dispositivo={editingDev}
            onSubmit={editingDev ? (d: DispositivoFormData) => handleUpdate(editingDev.id, d) : handleCreate}
            onCancel={() => { setShowForm(false); setEditingDev(null); }}
            title={editingDev ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}
            empresas={empresas} userRole={userRole} userEmpresaId={userEmpresaId}
          />
        </Suspense>
      )}

      {selectedDev && (
        <Suspense fallback={<ModalFallback />}>
          <DispositivoDetail
            dispositivo={selectedDev}
            onClose={() => setSelectedDev(null)}
            onEdit={() => { setSelectedDev(null); setEditingDev(selectedDev); }}
            userRole={userRole}
          />
        </Suspense>
      )}

      {/* ── CONFIRM DELETE ── */}
      {confirmDelete !== null && (
        <ConfirmModal
          message="Esta acción eliminará el dispositivo de forma permanente. ¿Deseas continuar?"
          onConfirm={() => handleDeleteConfirm(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default DispositivosList;
