// src/components/Layout/SidebarLayout.tsx
import React, { useState, useEffect, ReactNode, useRef } from 'react';
import samsungLogo from '../../assets/logo.jpg';

interface SidebarLayoutProps {
  children: ReactNode;
  user: any;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  roles: string[];
}

/* ─── Design tokens ─────────────────────────────────────────── */
const C = {
  blue1: '#0B1F6B',
  blue2: '#1428A0',
  blue3: '#1A4FCE',
  blue4: '#3B82F6',
  blueGlow: 'rgba(59,130,246,0.35)',
  white: '#FFFFFF',
  whiteAlpha10: 'rgba(255,255,255,0.10)',
  whiteAlpha15: 'rgba(255,255,255,0.15)',
  whiteAlpha20: 'rgba(255,255,255,0.20)',
  whiteAlpha60: 'rgba(255,255,255,0.60)',
  whiteAlpha80: 'rgba(255,255,255,0.80)',
  black20: 'rgba(0,0,0,0.20)',
  black30: 'rgba(0,0,0,0.30)',
  black40: 'rgba(0,0,0,0.40)',
  red: '#EF4444',
  redAlpha: 'rgba(239,68,68,0.15)',
  surface: '#F0F4FF',
  surfaceDeep: '#E6ECF8',
};

const grad = {
  sidebar: `linear-gradient(175deg, ${C.blue1} 0%, #0D2070 55%, #091859 100%)`,
  header: `linear-gradient(135deg, ${C.blue2} 0%, ${C.blue3} 100%)`,
  accent: `linear-gradient(135deg, ${C.blue3} 0%, ${C.blue4} 100%)`,
  avatar: `linear-gradient(135deg, ${C.blue3} 0%, #60A5FA 100%)`,
  badge: `linear-gradient(135deg, ${C.blue4} 0%, #818CF8 100%)`,
  badgeAdmin: `linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)`,
  main: `linear-gradient(145deg, #EEF2FF 0%, #F0F4FF 50%, #E6F0FF 100%)`,
  hamburger: `linear-gradient(135deg, ${C.blue2} 0%, ${C.blue4} 100%)`,
};

/* ─── Global styles injection (keyframes, scrollbar, etc.) ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'DM Sans', sans-serif; }

  @keyframes _fadeOverlay {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes _slideMenu {
    from { opacity: 0; transform: translateX(-14px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes _pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
    50%      { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
  }
  @keyframes _shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes _dot {
    0%,80%,100% { transform: scale(0.6); opacity:.4; }
    40%          { transform: scale(1);   opacity:1; }
  }

  .sl-sidebar-inner::-webkit-scrollbar { width: 4px; }
  .sl-sidebar-inner::-webkit-scrollbar-track { background: transparent; }
  .sl-sidebar-inner::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.18);
    border-radius: 4px;
  }

  /* staggered menu item animation */
  .sl-menu-item { animation: _slideMenu 0.35s cubic-bezier(.22,1,.36,1) both; }
  .sl-menu-item:nth-child(1)  { animation-delay: 0.04s; }
  .sl-menu-item:nth-child(2)  { animation-delay: 0.09s; }
  .sl-menu-item:nth-child(3)  { animation-delay: 0.14s; }
  .sl-menu-item:nth-child(4)  { animation-delay: 0.19s; }
  .sl-menu-item:nth-child(5)  { animation-delay: 0.24s; }
  .sl-menu-item:nth-child(6)  { animation-delay: 0.29s; }
  .sl-menu-item:nth-child(7)  { animation-delay: 0.34s; }

  .sl-menu-item:hover .sl-menu-icon { transform: scale(1.18) rotate(6deg) !important; }
  .sl-menu-item:hover { transform: translateX(5px) !important; }

  .sl-logout-btn:hover {
    background: ${C.red} !important;
    color: ${C.white} !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 24px rgba(239,68,68,0.4) !important;
  }
  .sl-logout-btn:hover .sl-logout-icon { transform: translateX(4px) scale(1.1) !important; }

  .sl-hamburger:hover {
    transform: scale(1.08) !important;
    box-shadow: 0 8px 28px rgba(20,40,160,0.55) !important;
  }

  .sl-avatar:hover { transform: scale(1.05) !important; }

  /* focus ring */
  .sl-menu-item:focus-visible,
  .sl-logout-btn:focus-visible,
  .sl-hamburger:focus-visible,
  .sl-close-btn:focus-visible {
    outline: 2px solid rgba(255,255,255,0.7);
    outline-offset: 2px;
  }
`;

/* ─── Component ──────────────────────────────────────────────── */
const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  user,
  currentPage,
  onPageChange,
  onLogout,
}) => {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [logoutHover, setLogoutHover] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  /* inject global CSS once */
  useEffect(() => {
    if (!styleRef.current) {
      const el = document.createElement('style');
      el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
      styleRef.current = el;
    }
    return () => { styleRef.current?.remove(); styleRef.current = null; };
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const role = user?.rol || 'Usuario';
    const all: MenuItem[] = [
      { id: 'inicio',       label: 'Inicio',        icon: '🏠', roles: ['Admin','Usuario'] },
      { id: 'empresas',     label: 'Empresas',       icon: '🏢', roles: ['Admin'] },
      { id: 'personas',     label: 'Personas',       icon: '👥', roles: ['Admin'] },
      { id: 'dispositivos', label: 'Dispositivos',   icon: '📲', roles: ['Admin'] },
      { id: 'verificacion', label: 'Verificar IMEI', icon: '🔍', roles: ['Admin','Usuario'] },
      { id: 'usuarios',     label: 'Usuarios',       icon: '👤', roles: ['Admin'] },
    ];
    setMenuItems(all.filter(i => i.roles.includes(role)));
  }, [user]);

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) { onLogout(); return; }
    window.location.href = `${window.location.origin}/#/login`;
  };

  const handlePageChange = (page: string) => {
    onPageChange(page);
    if (isMobile) setOpen(false);
  };

  const getRoleLabel = (r: string) =>
    ({ Admin: 'Administrador', Supervisor: 'Supervisor', Usuario: 'Usuario' }[r] ?? r);

  const SIDEBAR_W = isMobile ? 'min(88vw, 300px)' : '288px';
  const SIDEBAR_W_PX = 288;

  /* ── Styles ─────────────────────────────────────────────────── */
  const s = {
    /* layout wrapper */
    layout: {
      display: 'flex',
      minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif",
      background: grad.main,
      position: 'relative' as const,
      overflowX: 'hidden' as const,
    },

    /* overlay */
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      background: C.black40,
      backdropFilter: 'blur(6px)',
      zIndex: 998,
      animation: '_fadeOverlay 0.28s ease',
    },

    /* hamburger */
    hamburger: {
      position: 'fixed' as const,
      top: 20,
      left: 20,
      zIndex: 1100,
      width: 46,
      height: 46,
      background: grad.hamburger,
      color: C.white,
      border: 'none',
      borderRadius: 12,
      fontSize: 20,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 6px 20px rgba(20,40,160,0.4)`,
      transition: 'transform 0.25s, box-shadow 0.25s',
    },

    /* sidebar */
    sidebar: {
      width: SIDEBAR_W,
      height: '100vh',
      position: 'fixed' as const,
      left: 0,
      top: 0,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column' as const,
      background: grad.sidebar,
      boxShadow: `6px 0 40px ${C.black40}`,
      transition: 'transform 0.38s cubic-bezier(0.22,1,0.36,1)',
      transform: isMobile && !open ? 'translateX(-100%)' : 'translateX(0)',
      overflow: 'hidden',
    },

    /* decorative top bar */
    topBar: {
      height: 3,
      background: grad.accent,
      flexShrink: 0,
    },

    /* header */
    header: {
      padding: '22px 22px 20px',
      background: 'rgba(255,255,255,0.04)',
      borderBottom: `1px solid ${C.whiteAlpha10}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      position: 'relative' as const,
    },

    /* decorative dots bg */
    headerDots: {
      position: 'absolute' as const,
      inset: 0,
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
      backgroundSize: '18px 18px',
      pointerEvents: 'none' as const,
    },

    logoWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      zIndex: 1,
    },

    logoBox: {
      width: 46,
      height: 46,
      background: C.white,
      borderRadius: 12,
      padding: 7,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 4px 14px ${C.black30}`,
      flexShrink: 0,
    },

    logoImg: {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
    },

    logoText: {
      color: C.white,
      fontSize: 18,
      fontWeight: 700,
      fontFamily: "'Space Grotesk', sans-serif",
      letterSpacing: '0.3px',
      textShadow: '0 2px 8px rgba(0,0,0,0.3)',
      lineHeight: 1.1,
    },

    logoSub: {
      color: C.whiteAlpha60,
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '0.8px',
      textTransform: 'uppercase' as const,
    },

    closeBtn: {
      background: C.whiteAlpha15,
      border: `1px solid ${C.whiteAlpha20}`,
      color: C.white,
      width: 34,
      height: 34,
      borderRadius: 9,
      fontSize: 16,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.25s',
      zIndex: 1,
      backdropFilter: 'blur(8px)',
    },

    /* user info */
    userCard: {
      margin: '16px 16px 8px',
      padding: '16px',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 16,
      border: `1px solid ${C.whiteAlpha10}`,
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      flexShrink: 0,
    },

    avatar: {
      width: 50,
      height: 50,
      background: grad.avatar,
      borderRadius: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 21,
      fontWeight: 700,
      color: C.white,
      flexShrink: 0,
      boxShadow: `0 6px 18px ${C.black30}, 0 0 0 2px ${C.whiteAlpha15}`,
      transition: 'transform 0.25s',
      cursor: 'default',
      animation: '_pulse 3s infinite',
    },

    userName: {
      color: C.white,
      fontSize: 15,
      fontWeight: 600,
      marginBottom: 6,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    badge: (role: string) => ({
      display: 'inline-block',
      padding: '3px 10px',
      background: role === 'Admin' ? grad.badgeAdmin : grad.badge,
      color: C.white,
      fontSize: 10.5,
      fontWeight: 700,
      borderRadius: 20,
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }),

    /* divider */
    divider: {
      height: 1,
      background: C.whiteAlpha10,
      margin: '6px 16px 10px',
      flexShrink: 0,
    },

    /* section label */
    sectionLabel: {
      padding: '0 24px 8px',
      color: C.whiteAlpha60,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '1.2px',
      textTransform: 'uppercase' as const,
    },

    /* nav scroll area */
    nav: {
      flex: 1,
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
      padding: '4px 12px 12px',
    },

    /* menu item */
    menuItem: (id: string) => {
      const isActive = currentPage === id;
      const isHovered = hoveredItem === id;
      return {
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        width: '100%',
        padding: '13px 16px',
        marginBottom: 4,
        border: 'none',
        borderRadius: 13,
        cursor: 'pointer',
        fontSize: 14.5,
        fontWeight: isActive ? 700 : 500,
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: '0.1px',
        textAlign: 'left' as const,
        transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
        position: 'relative' as const,
        overflow: 'hidden',
        // ── WHITE card style ──
        background: isActive
          ? C.white
          : isHovered
          ? 'rgba(255,255,255,0.92)'
          : 'rgba(255,255,255,0.08)',
        color: isActive || isHovered ? C.blue2 : C.whiteAlpha80,
        boxShadow: isActive
          ? `0 6px 22px ${C.black30}, inset 0 1px 0 rgba(255,255,255,0.8)`
          : isHovered
          ? `0 4px 16px ${C.black20}`
          : 'none',
        transform: isHovered && !isActive ? 'translateX(5px)' : 'none',
      };
    },

    /* active left bar */
    activeBar: {
      position: 'absolute' as const,
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 3.5,
      height: '65%',
      background: grad.accent,
      borderRadius: '0 4px 4px 0',
      boxShadow: `0 0 12px ${C.blueGlow}`,
    },

    menuIcon: {
      fontSize: 19,
      minWidth: 22,
      textAlign: 'center' as const,
      transition: 'transform 0.25s',
      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
    },

    menuLabel: {
      flex: 1,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    /* active dot */
    activeDot: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: C.blue3,
      flexShrink: 0,
      boxShadow: `0 0 8px ${C.blueGlow}`,
    },

    /* empty state */
    emptyState: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      color: C.whiteAlpha60,
      fontSize: 14,
    },

    /* footer */
    footer: {
      padding: '12px 16px 20px',
      borderTop: `1px solid ${C.whiteAlpha10}`,
      flexShrink: 0,
    },

    footerHint: {
      color: C.whiteAlpha60,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.8px',
      textTransform: 'uppercase' as const,
      textAlign: 'center' as const,
      marginBottom: 10,
    },

    logoutBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      width: '100%',
      padding: '13px 20px',
      border: `1px solid rgba(239,68,68,0.3)`,
      background: C.redAlpha,
      color: '#FCA5A5',
      borderRadius: 13,
      cursor: 'pointer',
      fontSize: 14.5,
      fontWeight: 600,
      fontFamily: "'DM Sans', sans-serif",
      transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
      ...(logoutHover ? {
        background: C.red,
        color: C.white,
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
      } : {}),
    },

    logoutIcon: {
      fontSize: 17,
      transition: 'transform 0.25s',
      ...(logoutHover ? { transform: 'translateX(4px) scale(1.1)' } : {}),
    },

    /* main content */
    main: {
      flex: 1,
      marginLeft: isMobile ? 0 : SIDEBAR_W_PX,
      minHeight: '100vh',
      padding: isMobile ? '70px 20px 28px' : '36px',
      transition: 'margin-left 0.38s cubic-bezier(0.22,1,0.36,1)',
      width: isMobile ? '100%' : `calc(100% - ${SIDEBAR_W_PX}px)`,
      boxSizing: 'border-box' as const,
    },

    /* watermark */
    watermark: {
      textAlign: 'center' as const,
      padding: '0 16px 6px',
      color: 'rgba(255,255,255,0.12)',
      fontSize: 9.5,
      letterSpacing: '0.5px',
      fontWeight: 500,
    },
  };

  return (
    <div style={s.layout}>
      {/* overlay */}
      {isMobile && open && (
        <div style={s.overlay} onClick={() => setOpen(false)} />
      )}

      {/* hamburger */}
      {isMobile && (
        <button
          className="sl-hamburger"
          style={s.hamburger}
          onClick={() => setOpen(o => !o)}
          aria-label="Abrir menú"
        >
          {open ? '✕' : '☰'}
        </button>
      )}

      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        {/* top accent bar */}
        <div style={s.topBar} />

        {/* header */}
        <div style={s.header}>
          <div style={s.headerDots} />
          <div style={s.logoWrap}>
            <div style={s.logoBox}>
              <img src={samsungLogo} alt="Logo" style={s.logoImg} />
            </div>
            <div>
              <div style={s.logoText}>IMEI System</div>
              <div style={s.logoSub}>Samsung · Control</div>
            </div>
          </div>
          {isMobile && (
            <button
              className="sl-close-btn"
              style={s.closeBtn}
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              ✕
            </button>
          )}
        </div>

        {/* user card */}
        <div style={s.userCard}>
          <div className="sl-avatar" style={s.avatar}>
            {(user?.nombre || user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={s.userName}>
              {user?.nombre || user?.username || 'Usuario'}
            </div>
            <span style={s.badge(user?.rol || 'Usuario')}>
              {getRoleLabel(user?.rol || 'Usuario')}
            </span>
          </div>
        </div>

        <div style={s.divider} />
        <div style={s.sectionLabel}>Navegación</div>

        {/* nav */}
        <nav className="sl-sidebar-inner" style={s.nav}>
          {menuItems.length > 0 ? (
            menuItems.map(item => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  className="sl-menu-item"
                  style={s.menuItem(item.id)}
                  onClick={() => handlePageChange(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && <span style={s.activeBar} />}
                  <span className="sl-menu-icon" style={s.menuIcon}>
                    {item.icon}
                  </span>
                  <span style={s.menuLabel}>{item.label}</span>
                  {isActive && <span style={s.activeDot} />}
                </button>
              );
            })
          ) : (
            <div style={s.emptyState}>
              <span>🔒</span>
              <span>Sin permisos disponibles</span>
            </div>
          )}
        </nav>

        {/* footer */}
        <div style={s.footer}>
          <div style={s.footerHint}>Sesión activa</div>
          <button
            className="sl-logout-btn"
            style={s.logoutBtn}
            onClick={handleLogout}
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
          >
            <span className="sl-logout-icon" style={s.logoutIcon}>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>

        <div style={s.watermark}>IMEI System v2.0 · Samsung</div>
      </aside>

      {/* ── Main content ── */}
      <main style={s.main}>
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;