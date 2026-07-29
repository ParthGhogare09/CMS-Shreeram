import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit, Save, X, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import { useCMS } from '../context/CMSContext';

const Settings = () => {
  const { owners, saveOwnersAction, currentOwner } = useCMS();

  // ─── Add Owner Modal ─────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', displayName: '', password: '' });
  const [addShowPw, setAddShowPw] = useState(false);
  const [addMsg, setAddMsg] = useState('');

  // ─── Edit Owner Modal ────────────────────────────────────────────────────────
  const [editIndex, setEditIndex] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', displayName: '', password: '' });
  const [editShowPw, setEditShowPw] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  // ─── Delete confirmation ─────────────────────────────────────────────────────
  const [deleteIdx, setDeleteIdx] = useState(null);

  const [globalMsg, setGlobalMsg] = useState('');

  const flash = (setter, msg, ms = 2500) => {
    setter(msg);
    setTimeout(() => setter(''), ms);
  };

  // ── Add ─────────────────────────────────────────────────────────────────────
  const handleAddSubmit = (e) => {
    e.preventDefault();
    const { username, displayName, password } = addForm;
    if (!username.trim() || !displayName.trim() || !password.trim()) {
      flash(setAddMsg, 'All fields are required.');
      return;
    }
    if (owners.find(o => o.username.toLowerCase() === username.trim().toLowerCase())) {
      flash(setAddMsg, 'Username already exists. Choose a different one.');
      return;
    }
    const updated = [...owners, { username: username.trim(), displayName: displayName.trim(), password: password.trim() }];
    saveOwnersAction(updated);
    setAddForm({ username: '', displayName: '', password: '' });
    setShowAddModal(false);
    flash(setGlobalMsg, `✓ Owner "${displayName.trim()}" added successfully.`);
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const openEdit = (idx) => {
    setEditIndex(idx);
    setEditForm({ ...owners[idx] });
    setEditMsg('');
    setEditShowPw(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const { username, displayName, password } = editForm;
    if (!username.trim() || !displayName.trim() || !password.trim()) {
      flash(setEditMsg, 'All fields are required.');
      return;
    }
    const duplicate = owners.find((o, i) => i !== editIndex && o.username.toLowerCase() === username.trim().toLowerCase());
    if (duplicate) {
      flash(setEditMsg, 'Username already taken by another owner.');
      return;
    }
    const updated = owners.map((o, i) =>
      i === editIndex ? { username: username.trim(), displayName: displayName.trim(), password: password.trim() } : o
    );
    saveOwnersAction(updated);
    setEditIndex(null);
    flash(setGlobalMsg, `✓ Owner "${displayName.trim()}" updated.`);
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = (idx) => {
    if (owners.length <= 1) {
      flash(setGlobalMsg, '⚠ Cannot delete the last owner account.');
      return;
    }
    const updated = owners.filter((_, i) => i !== idx);
    saveOwnersAction(updated);
    setDeleteIdx(null);
    flash(setGlobalMsg, '✓ Owner removed.');
  };

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: '0.875rem',
    boxSizing: 'border-box'
  };

  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' };

  return (
    <div className="settings-container">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Global message */}
      {globalMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          background: globalMsg.startsWith('⚠') ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
          border: `1px solid ${globalMsg.startsWith('⚠') ? '#f59e0b' : '#10b981'}`,
          color: globalMsg.startsWith('⚠') ? '#d97706' : '#10b981',
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          {globalMsg}
        </div>
      )}

      <div style={{ maxWidth: '860px' }}>
        {/* ── Owner Accounts Card ─────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldCheck size={24} color="var(--color-primary)" />
              <h2 className="card-title" style={{ margin: 0 }}>Owner Accounts</h2>
            </div>
            <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }} onClick={() => { setShowAddModal(true); setAddMsg(''); }}>
              <Plus size={15} /> Add Owner
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>Display Name</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>Username</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>Password</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((owner, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)', background: owner.displayName === currentOwner ? 'rgba(249,115,22,0.06)' : 'transparent' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--color-text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #f97316, #ea580c)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.65rem', color: '#fff', flexShrink: 0
                        }}>
                          {owner.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        {owner.displayName}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      <code style={{ background: 'rgba(0,0,0,0.08)', padding: '2px 7px', borderRadius: '4px', fontSize: '0.82rem' }}>{owner.username}</code>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', letterSpacing: '2px' }}>{'•'.repeat(Math.min(owner.password.length, 8))}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {owner.displayName === currentOwner
                        ? <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>● Active</span>
                        : <span style={{ background: 'rgba(156,163,175,0.15)', color: 'var(--color-text-secondary)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>Inactive</span>
                      }
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => openEdit(idx)}
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          className="btn"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                          onClick={() => setDeleteIdx(idx)}
                          disabled={owners.length <= 1}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
            <KeyRound size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Credentials are stored locally in the browser. All owners can log in from the login screen with their own username & password.
          </p>
        </div>
      </div>

      {/* ══ Add Owner Modal ══════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> Add New Owner
              </h3>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {addMsg && <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.82rem', border: '1px solid rgba(239,68,68,0.3)' }}>{addMsg}</div>}

              <div>
                <label style={labelStyle}>Display Name</label>
                <input style={inputStyle} type="text" required placeholder="e.g. Ramesh Patil" value={addForm.displayName} onChange={e => setAddForm({ ...addForm, displayName: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input style={inputStyle} type="text" required placeholder="e.g. ramesh" value={addForm.username} onChange={e => setAddForm({ ...addForm, username: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, paddingRight: '2.5rem' }} type={addShowPw ? 'text' : 'password'} required placeholder="Set a secure password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} />
                  <button type="button" onClick={() => setAddShowPw(!addShowPw)} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                    {addShowPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={15} /> Add Owner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Edit Owner Modal ═════════════════════════════════════════════════════ */}
      {editIndex !== null && (
        <div className="modal-overlay" onClick={() => setEditIndex(null)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit size={18} /> Edit Owner
              </h3>
              <button className="icon-btn" onClick={() => setEditIndex(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editMsg && <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.82rem', border: '1px solid rgba(239,68,68,0.3)' }}>{editMsg}</div>}

              <div>
                <label style={labelStyle}>Display Name</label>
                <input style={inputStyle} type="text" required value={editForm.displayName} onChange={e => setEditForm({ ...editForm, displayName: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input style={inputStyle} type="text" required value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, paddingRight: '2.5rem' }} type={editShowPw ? 'text' : 'password'} required value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} />
                  <button type="button" onClick={() => setEditShowPw(!editShowPw)} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                    {editShowPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditIndex(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={15} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Delete Confirmation Modal ════════════════════════════════════════════ */}
      {deleteIdx !== null && (
        <div className="modal-overlay" onClick={() => setDeleteIdx(null)}>
          <div className="modal-content" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={18} /> Remove Owner
              </h3>
              <button className="icon-btn" onClick={() => setDeleteIdx(null)}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                Are you sure you want to remove <strong>{owners[deleteIdx]?.displayName}</strong>? They will no longer be able to log in.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={() => setDeleteIdx(null)}>Cancel</button>
                <button
                  className="btn"
                  style={{ background: '#ef4444', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleDelete(deleteIdx)}
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
