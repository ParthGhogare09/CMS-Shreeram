import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Building2,
  LayoutDashboard, 
  Users, 
  Package, 
  CreditCard, 
  MapPin,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';

const Sidebar = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const { logoutAction, currentOwner } = useCMS();
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/' },
    { name: 'Labour Management', icon: <Users size={18} />, path: '/workers' },
    { name: 'Material Management', icon: <Package size={18} />, path: '/materials' },
    { name: 'Site Management', icon: <MapPin size={18} />, path: '/projects' },
    { name: 'Financial Management', icon: <CreditCard size={18} />, path: '/finance' },
    { name: 'Settings', icon: <Settings size={18} />, path: '/settings' },
  ];

  const formatWorkerId = (id) => id ? `W-${id.toString().slice(-5).toUpperCase()}` : '';

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{ flexDirection: 'row', padding: isCollapsed ? '0.75rem 0' : '0.5rem 1rem', gap: '0.75rem', height: '85px', justifyContent: isCollapsed ? 'center' : 'flex-start', position: 'relative' }}>
        <img 
          src="/logo.png" 
          alt="Shreeram Construction Logo" 
          style={{ 
            height: isCollapsed ? '52px' : '46px', 
            width: isCollapsed ? '52px' : 'auto',
            maxWidth: isCollapsed ? '52px' : '150px', 
            objectFit: 'contain', 
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '3px',
            boxShadow: isCollapsed ? '0 4px 12px rgba(0,0,0,0.4)' : 'none',
            flexShrink: 0 
          }} 
        />
        
        {!isCollapsed && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
            <h2 className="sidebar-title" style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: '1.2', color: '#ffffff', margin: 0 }}>SHREERAM</h2>
            <span className="sidebar-subtitle" style={{ fontSize: '0.68rem', color: '#ffab91', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'left', fontWeight: 600 }}>GOVT. CONTRACTOR</span>
          </div>
        )}

        {/* Floating Toggle Button (Desktop Only) */}
        <button 
          className="collapse-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          type="button"
          title={isCollapsed ? "Expand Navigation" : "Minimize Navigation"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Close button for mobile layout */}
        <button className="icon-btn mobile-close-btn" onClick={() => setIsOpen(false)}>
          <X size={24} color="#fff" />
        </button>
      </div>

      <nav className="sidebar-nav" style={{ padding: isCollapsed ? '0 0.5rem 1.5rem 0.5rem' : '0 1rem 1.5rem 1rem' }}>
        {menuItems.map((item, index) => (
          <NavLink 
            key={index} 
            to={item.path} 
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
            title={isCollapsed ? item.name : ''}
          >
            {item.icon}
            {!isCollapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
        
        <NavLink 
          to="/#logout" 
          className="nav-item nav-logout" 
          onClick={(e) => {
            e.preventDefault();
            logoutAction();
          }}
          style={{ marginTop: 'auto', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Logout</span>}
        </NavLink>

        {/* Current Owner Badge */}
        {!isCollapsed && currentOwner && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 0.9rem',
            marginTop: '0.5rem',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.12)'
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.7rem',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(249,115,22,0.4)'
            }}>
              {currentOwner.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentOwner}</p>
              <p style={{ margin: 0, fontSize: '0.62rem', color: '#ffab91' }}>Logged in</p>
            </div>
          </div>
        )}
        {isCollapsed && currentOwner && (
          <div title={currentOwner} style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.68rem', color: '#fff',
            margin: '0.5rem auto 0',
            boxShadow: '0 2px 8px rgba(249,115,22,0.4)'
          }}>
            {currentOwner.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
