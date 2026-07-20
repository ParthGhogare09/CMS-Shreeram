import React from 'react';
import { X, RotateCcw, Check, Filter } from 'lucide-react';

const FilterModal = ({ isOpen, onClose, onReset, title = 'Filter Records', children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '420px', width: '90%' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{title}</h3>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close Filter">
            <X size={20} />
          </button>
        </div>

        <div className="modal-form" style={{ padding: '1rem 0' }}>
          {children}
        </div>

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            onClick={() => {
              if (onReset) onReset();
            }}
          >
            <RotateCcw size={14} /> Reset
          </button>
          
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            onClick={onClose}
          >
            <Check size={14} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
