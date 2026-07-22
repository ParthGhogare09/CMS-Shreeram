import React from 'react';
import { Menu } from 'lucide-react';

const TopBar = ({ onMenuClick }) => {
  return (
    <div className="top-bar">
      <div className="top-bar-left" style={{ flex: 1, overflow: 'hidden' }}>
        <button className="icon-btn mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          <img src="/logo.png" alt="Shreeram Logo" style={{ height: '34px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '4px', padding: '2px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h1 className="top-bar-title" style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, lineHeight: 1.1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              Shreeram Construction
            </h1>
            <span className="top-bar-subtitle" style={{ fontSize: '0.68rem', color: 'var(--color-primary)', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              Government Contractor
            </span>
          </div>
        </div>
      </div>
      
      <div className="top-bar-right">
      </div>
    </div>
  );
};

export default TopBar;
