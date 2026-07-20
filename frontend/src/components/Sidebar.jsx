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
  const { logoutAction } = useCMS();
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
      <div className="sidebar-header" style={{ flexDirection: 'row', padding: isCollapsed ? '0.5rem 0' : '0.5rem 1rem', gap: '0.75rem', height: '85px', justifyContent: isCollapsed ? 'center' : 'flex-start', position: 'relative' }}>
        <img 
          src="/logo.png" 
          alt="Shreeram Construction Logo" 
          style={{ 
            height: isCollapsed ? '42px' : '46px', 
            maxWidth: isCollapsed ? '42px' : '150px', 
            objectFit: 'contain', 
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            padding: '2px',
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
      </nav>
    </div>
  );
};

export default Sidebar;
