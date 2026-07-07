import React, { useState } from 'react';
import { Package, Truck, Plus, X, Edit } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { formatDate } from '../utils';
import SkeletonLoader from '../components/SkeletonLoader';
import SearchWithSuggestions from '../components/SearchWithSuggestions';

const Materials = () => {
  const {
    materials,
    usageLogs,
    projects,
    loading,
    saveMaterialAction,
    logMaterialUsageAction
  } = useCMS();

  // Modals state
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showEditMaterial, setShowEditMaterial] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState({ id: '', name: '', stock: '', unit: 'Bags', purchaseAmount: '' });

  const [showAddUsage, setShowAddUsage] = useState(false);
  const [showEditUsage, setShowEditUsage] = useState(false);
  const [currentUsage, setCurrentUsage] = useState({ id: '', material: '', project: '', quantity: '', unit: '', date: '', distributionRate: '' });

  // Search states
  const [materialSearch, setMaterialSearch] = useState('');
  const [usageSearch, setUsageSearch] = useState('');

  // Handlers for Material Stock
  const handleSaveMaterial = (e) => {
    e.preventDefault();
    saveMaterialAction({
      id: showEditMaterial ? currentMaterial.id : undefined,
      name: currentMaterial.name,
      stock: Number(currentMaterial.stock),
      unit: currentMaterial.unit,
      purchaseAmount: Number(currentMaterial.purchaseAmount)
    });
    setShowAddMaterial(false);
    setShowEditMaterial(false);
    setCurrentMaterial({ id: '', name: '', stock: '', unit: 'Bags', purchaseAmount: '' });
  };

  // Handlers for Material Usage
  const handleSaveUsage = (e) => {
    e.preventDefault();
    const selectedMat = materials.find(m => m.name === currentUsage.material);
    const unit = currentUsage.unit || (selectedMat ? selectedMat.unit : 'Units');

    logMaterialUsageAction({
      id: showEditUsage ? currentUsage.id : undefined,
      material: currentUsage.material,
      project: currentUsage.project,
      quantity: Number(currentUsage.quantity),
      unit: unit,
      distributionRate: Number(currentUsage.distributionRate),
      date: currentUsage.date
    });
    setShowAddUsage(false);
    setShowEditUsage(false);
    setCurrentUsage({ id: '', material: '', project: '', quantity: '', unit: '', date: '', distributionRate: '' });
  };

  if (loading) {
    return <SkeletonLoader type="table" rows={6} />;
  }

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  const filteredUsageLogs = usageLogs.filter(log => 
    log.material.toLowerCase().includes(usageSearch.toLowerCase()) ||
    log.project.toLowerCase().includes(usageSearch.toLowerCase())
  );

  return (
    <div className="materials-container">
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <h1 className="page-title">Material Management</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ width: '200px' }}>
            <SearchWithSuggestions 
              value={materialSearch}
              onChange={setMaterialSearch}
              placeholder="Search stock..."
              suggestions={materials.map(m => m.name)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => {
            setCurrentMaterial({ id: '', name: '', stock: '', unit: 'Bags', purchaseAmount: '' });
            setShowAddMaterial(true);
          }}>
            <Plus size={16} /> Add Stock
          </button>
          <button className="btn btn-secondary" onClick={() => {
            setCurrentUsage({ id: '', material: '', project: '', quantity: '', unit: '', date: new Date().toISOString().split('T')[0], distributionRate: '' });
            setShowAddUsage(true);
          }}>
            <Truck size={16} /> Log Usage
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>All Raw Materials Stock</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Material ID</th>
                <th>Name</th>
                <th>Stock Available</th>
                <th>Purchased Stock</th>
                <th>Unit</th>
                <th>Purchase Rate (₹)</th>
                <th>Total Purchase Amount (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map(mat => {
                const usages = usageLogs.filter(u => u.material === mat.name);
                const distQty = usages.reduce((sum, u) => sum + Number(u.quantity || 0), 0);
                const purchasedStock = (mat.stock || 0) + distQty;

                return (
                  <tr key={mat.id || mat._id}>
                    <td data-label="Material ID">M{String(mat.id || mat._id || '').slice(-3).padStart(3, '0')}</td>
                    <td data-label="Name" style={{ fontWeight: 600 }}>{mat.name}</td>
                    <td data-label="Stock Available">{mat.stock}</td>
                    <td data-label="Purchased Stock" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{purchasedStock}</td>
                    <td data-label="Unit">{mat.unit}</td>
                    <td data-label="Purchase Rate">₹{mat.purchaseAmount?.toLocaleString('en-IN') || 0}</td>
                    <td data-label="Total Purchase Amount" style={{ fontWeight: 600 }}>₹{((mat.stock || 0) * (mat.purchaseAmount || 0)).toLocaleString('en-IN')}</td>
                    <td data-label="Actions">
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => {
                        setCurrentMaterial(mat);
                        setShowEditMaterial(true);
                      }}>
                        <Edit size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredMaterials.length === 0 && (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '1rem'}}>No materials found matching search query.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Recent Usage Logs (Distributed to Sites)</h3>
          <div style={{ width: '220px' }}>
            <SearchWithSuggestions 
              value={usageSearch}
              onChange={setUsageSearch}
              placeholder="Search usage..."
              suggestions={materials.map(m => m.name)}
            />
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Material</th>
                <th>Site / Project</th>
                <th>Quantity Distributed</th>
                <th>Unit</th>
                <th>Distribution Rate (₹)</th>
                <th>Total Distributed Amount (₹)</th>
                <th>Date of Distribution</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsageLogs.sort((a,b) => new Date(b.date) - new Date(a.date)).map(log => (
                <tr key={log.id || log._id}>
                  <td data-label="Log ID">L{String(log.id || log._id || '').slice(-3).padStart(3, '0')}</td>
                  <td data-label="Material" style={{ fontWeight: 600 }}>{log.material}</td>
                  <td data-label="Project">{log.project}</td>
                  <td data-label="Quantity" style={{ color: '#ef4444' }}>-{log.quantity}</td>
                  <td data-label="Unit">{log.unit}</td>
                  <td data-label="Distribution Rate">₹{log.distributionRate?.toLocaleString('en-IN') || 0}</td>
                  <td data-label="Total Distributed Amount" style={{ fontWeight: 600 }}>₹{((log.quantity || 0) * (log.distributionRate || 0)).toLocaleString('en-IN')}</td>
                  <td data-label="Date">{formatDate(log.date)}</td>
                  <td data-label="Actions">
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => {
                      setCurrentUsage(log);
                      setShowEditUsage(true);
                    }}>
                      <Edit size={14} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsageLogs.length === 0 && (
                <tr><td colSpan="9" style={{textAlign: 'center', padding: '1rem'}}>No usage logs found matching search query.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Stock Modal */}
      {(showAddMaterial || showEditMaterial) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{showEditMaterial ? 'Edit Material Stock' : 'Add Material Stock'}</h2>
              <button className="btn-close" onClick={() => { setShowAddMaterial(false); setShowEditMaterial(false); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveMaterial} className="modal-form">
              <div className="form-group">
                <label>Material Name</label>
                <input required type="text" value={currentMaterial.name} onChange={e => setCurrentMaterial({...currentMaterial, name: e.target.value})} placeholder="e.g. Cement" />
              </div>
              <div className="form-group">
                <label>Stock Available</label>
                <input required type="number" value={currentMaterial.stock} onChange={e => setCurrentMaterial({...currentMaterial, stock: e.target.value})} placeholder="e.g. 100" />
              </div>
              <div className="form-group">
                <label>Unit (Indian Context)</label>
                <select value={currentMaterial.unit} onChange={e => setCurrentMaterial({...currentMaterial, unit: e.target.value})}>
                  <option value="Bags">Bags</option>
                  <option value="Tons">Tons</option>
                  <option value="Pallets">Pallets</option>
                  <option value="Cubic Feet">Cubic Feet</option>
                  <option value="Liters">Liters</option>
                  <option value="Pieces">Pieces</option>
                  <option value="Kg">Kg</option>
                </select>
              </div>
              <div className="form-group">
                <label>Purchase Rate (₹)</label>
                <input required type="number" value={currentMaterial.purchaseAmount} onChange={e => setCurrentMaterial({...currentMaterial, purchaseAmount: e.target.value})} placeholder="e.g. 350" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddMaterial(false); setShowEditMaterial(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{showEditMaterial ? 'Update Material' : 'Save Material'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usage Log Modal */}
      {(showAddUsage || showEditUsage) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{showEditUsage ? 'Edit Usage Log' : 'Add Usage Log'}</h2>
              <button className="btn-close" onClick={() => { setShowAddUsage(false); setShowEditUsage(false); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveUsage} className="modal-form">
              <div className="form-group">
                <label>Material</label>
                <select required value={currentUsage.material} onChange={e => {
                  const matName = e.target.value;
                  const mat = materials.find(m => m.name === matName);
                  setCurrentUsage({...currentUsage, material: matName, unit: mat ? mat.unit : currentUsage.unit, distributionRate: mat ? mat.purchaseAmount : currentUsage.distributionRate});
                }}>
                  <option value="">Select Material...</option>
                  {materials.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  <option value="Other">Other...</option>
                </select>
              </div>
              {currentUsage.material === 'Other' && (
                <div className="form-group">
                  <label>Custom Material Name</label>
                  <input required type="text" onChange={e => setCurrentUsage({...currentUsage, material: e.target.value})} placeholder="Enter material name..." />
                </div>
              )}
              <div className="form-group">
                <label>Site / Project</label>
                <select required value={currentUsage.project} onChange={e => setCurrentUsage({...currentUsage, project: e.target.value})}>
                  <option value="">Select Project...</option>
                  {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity Distributed</label>
                <input required type="number" value={currentUsage.quantity} onChange={e => setCurrentUsage({...currentUsage, quantity: e.target.value})} placeholder="e.g. 50" />
              </div>
              <div className="form-group">
                <label>Distribution Rate (₹)</label>
                <input required type="number" value={currentUsage.distributionRate} onChange={e => setCurrentUsage({...currentUsage, distributionRate: e.target.value})} placeholder="e.g. 360" />
              </div>
              <div className="form-group">
                <label>Date of Distribution</label>
                <input required type="date" value={currentUsage.date} onChange={e => setCurrentUsage({...currentUsage, date: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddUsage(false); setShowEditUsage(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{showEditUsage ? 'Update Log' : 'Save Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;
