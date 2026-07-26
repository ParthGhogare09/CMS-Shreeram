import React, { useState } from 'react';
import { AlertTriangle, Trash2, Archive, X } from 'lucide-react';

/**
 * DeleteConfirmModal — A reusable modal for safe record deletion.
 * Offers two modes: soft delete (preserve history) and hard delete (delete everything).
 * Requires typing "DELETE" to confirm.
 * 
 * Props:
 *   isOpen       - boolean, whether the modal is visible
 *   onClose      - function, called when cancelling
 *   onConfirm    - function(mode), called with 'soft' or 'hard' when confirmed
 *   entityType   - string, e.g. 'Worker', 'Material', 'Project'
 *   entityName   - string, the name of the entity being deleted
 */
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, entityType, entityName }) => {
  const [deleteMode, setDeleteMode] = useState('soft');
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const isConfirmEnabled = confirmText.trim().toUpperCase() === 'DELETE';

  const handleConfirm = () => {
    if (!isConfirmEnabled) return;
    onConfirm(deleteMode);
    setConfirmText('');
    setDeleteMode('soft');
  };

  const handleClose = () => {
    setConfirmText('');
    setDeleteMode('soft');
    onClose();
  };

  const softDeleteDescriptions = {
    Worker: 'Removes this worker from the active list. All attendance logs, wage records, and finance entries will be preserved for audit.',
    Material: 'Removes this material from the stock list. All usage/distribution logs and finance entries will be preserved for audit.',
    Project: 'Removes this site/project from the active list. All worker logs, material distributions, and finance records will be preserved for audit.'
  };

  const hardDeleteDescriptions = {
    Worker: 'Permanently deletes this worker AND all their attendance logs and wage records. This action cannot be undone.',
    Material: 'Permanently deletes this material AND all usage/distribution logs. This action cannot be undone.',
    Project: 'Permanently deletes this site/project AND all related worker logs, material usage, and finance records. This action cannot be undone.'
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content delete-confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', margin: 0, color: '#ef4444' }}>
            <Trash2 size={20} color="#ef4444" /> Delete {entityType}
          </h2>
          <button className="btn-close" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0.25rem 0 0.5rem 0' }}>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            You are about to delete <strong style={{ color: 'var(--color-text-main)' }}>"{entityName}"</strong>. Choose how you want to proceed:
          </p>

          {/* Delete Mode Options */}
          <div className="delete-mode-options">
            <label 
              className={`delete-mode-option ${deleteMode === 'soft' ? 'selected' : ''}`}
              onClick={() => setDeleteMode('soft')}
            >
              <input 
                type="radio" 
                name="deleteMode" 
                value="soft" 
                checked={deleteMode === 'soft'} 
                onChange={() => setDeleteMode('soft')}
              />
              <div className="delete-mode-option-content">
                <div className="delete-mode-option-header">
                  <Archive size={16} />
                  <strong>Remove Record Only</strong>
                  <span className="delete-mode-badge safe">Recommended</span>
                </div>
                <p>{softDeleteDescriptions[entityType] || 'Removes from active list. All transaction history preserved.'}</p>
              </div>
            </label>

            <label 
              className={`delete-mode-option danger ${deleteMode === 'hard' ? 'selected' : ''}`}
              onClick={() => setDeleteMode('hard')}
            >
              <input 
                type="radio" 
                name="deleteMode" 
                value="hard" 
                checked={deleteMode === 'hard'} 
                onChange={() => setDeleteMode('hard')}
              />
              <div className="delete-mode-option-content">
                <div className="delete-mode-option-header">
                  <AlertTriangle size={16} />
                  <strong>Delete Everything</strong>
                  <span className="delete-mode-badge danger">Permanent</span>
                </div>
                <p>{hardDeleteDescriptions[entityType] || 'Permanently deletes record and all associated data. Cannot be undone.'}</p>
              </div>
            </label>
          </div>

          {/* Type to Confirm */}
          <div className="delete-confirm-section">
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text-muted)' }}>
              Type <strong style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.9rem' }}>DELETE</strong> to confirm
            </label>
            <input 
              type="text"
              className="delete-confirm-input"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Type DELETE here..."
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          <button 
            type="button" 
            className={`btn ${deleteMode === 'hard' ? 'btn-danger-solid' : 'btn-warning-solid'}`}
            disabled={!isConfirmEnabled}
            onClick={handleConfirm}
            style={{ opacity: isConfirmEnabled ? 1 : 0.5, cursor: isConfirmEnabled ? 'pointer' : 'not-allowed' }}
          >
            <Trash2 size={14} />
            {deleteMode === 'hard' ? 'Delete Everything Permanently' : 'Remove Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
