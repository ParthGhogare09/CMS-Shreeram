import React from 'react';
import { Menu, LogOut, Building2 } from 'lucide-react';

const TopBar = ({ onMenuClick }) => {
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button className="icon-btn mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img src="/logo.png" alt="Shreeram Logo" style={{ height: '36px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '4px', padding: '2px' }} />
          <h1 className="top-bar-title" style={{ fontSize: '1.05rem', fontWeight: 700 }}>Shreeram Construction & Government Contractor</h1>
        </div>
      </div>
      
      <div className="top-bar-right">
        <button className="btn" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', backgroundColor: 'transparent', fontWeight: 500, borderRadius: 'var(--border-radius-sm)' }}>
          <LogOut size={16} /> Logout
        </button>
        

      </div>
    </div>
  );
};

export default TopBar;
