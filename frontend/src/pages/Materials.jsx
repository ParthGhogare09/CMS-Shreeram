import React, { useState } from 'react';
import { Package, Truck, AlertTriangle, Plus, Search, Trash2, Edit, Download, Filter, X, RotateCcw } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { formatDate } from '../utils';
import { exportToExcel } from '../utils/exportToExcel';
import SkeletonLoader from '../components/SkeletonLoader';
import SearchWithSuggestions from '../components/SearchWithSuggestions';
import FilterModal from '../components/FilterModal';

const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;
const formatMaterialId = (id) => `M${String(id || '').slice(-3).padStart(3, '0')}`;

const normalizeTitleCase = (str) => {
  if (!str) return '';
  return str.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const Materials = () => {
  const {
    materials,
    usageLogs,
    projects,
    loading,
    saveMaterialAction,
    deleteMaterialAction,
    logMaterialUsageAction,
    deleteMaterialUsageAction
  } = useCMS();

  // Tab & Expanded details state
  const [activeTab, setActiveTab] = useState('stock');
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);

  // Modals state
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showEditMaterial, setShowEditMaterial] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState({ id: '', name: '', stock: '', unit: 'Bags', purchaseAmount: '', date: new Date().toISOString().split('T')[0] });

  const [showAddUsage, setShowAddUsage] = useState(false);
  const [showEditUsage, setShowEditUsage] = useState(false);
  const [currentUsage, setCurrentUsage] = useState({ id: '', material: '', project: '', quantity: '', unit: '', date: new Date().toISOString().split('T')[0], distributionRate: '' });

  const [materialSearch, setMaterialSearch] = useState('');
  const [usageSearch, setUsageSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [usageProjectFilter, setUsageProjectFilter] = useState('All');
  const [showStockFilterModal, setShowStockFilterModal] = useState(false);
  const [showUsageFilterModal, setShowUsageFilterModal] = useState(false);

  // Handlers for Material Stock
  const handleSaveMaterial = (e) => {
    e.preventDefault();
    if (Number(currentMaterial.stock) < 0) {
      alert('Stock Available cannot be negative.');
      return;
    }
    if (Number(currentMaterial.purchaseAmount) < 0) {
      alert('Purchase Rate cannot be negative.');
      return;
    }
    saveMaterialAction({
      id: showEditMaterial ? currentMaterial.id : undefined,
      name: currentMaterial.name,
      stock: Number(currentMaterial.stock),
      unit: normalizeTitleCase(currentMaterial.unit),
      purchaseAmount: Number(currentMaterial.purchaseAmount),
      date: currentMaterial.date
    });
    setShowAddMaterial(false);
    setShowEditMaterial(false);
    setCurrentMaterial({ id: '', name: '', stock: '', unit: 'Bags', purchaseAmount: '', date: new Date().toISOString().split('T')[0] });
  };

  // Handlers for Material Usage
  const handleSaveUsage = (e) => {
    e.preventDefault();
    const selectedMat = materials.find(m => m.name.toLowerCase() === (currentUsage.material || '').toLowerCase());
    const requestedQty = Number(currentUsage.quantity) || 0;
    const rate = Number(currentUsage.distributionRate) || 0;
    const stockAvailable = selectedMat ? selectedMat.stock : 0;

    if (requestedQty < 0) {
      alert('Quantity cannot be negative.');
      return;
    }
    if (rate < 0) {
      alert('Distribution Rate cannot be negative.');
      return;
    }

    if (!showEditUsage && (!selectedMat || stockAvailable <= 0)) {
      alert(`Material "${currentUsage.material}" is out of stock (Available: 0). Please add stock first before logging material usage.`);
      return;
    }

    if (!showEditUsage && requestedQty > stockAvailable) {
      alert(`Insufficient stock for "${currentUsage.material}". Available stock is ${stockAvailable} ${selectedMat ? selectedMat.unit : 'units'}, but you requested ${requestedQty}.`);
      return;
    }

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
    setCurrentUsage({ id: '', material: '', project: '', quantity: '', unit: '', date: new Date().toISOString().split('T')[0], distributionRate: '' });
  };

  if (loading) {
    return <SkeletonLoader type="table" rows={6} />;
  }

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(materialSearch.toLowerCase());
    let matchesStock = true;
    if (stockStatusFilter === 'Low Stock') matchesStock = m.stock > 0 && m.stock < 50;
    if (stockStatusFilter === 'In Stock') matchesStock = m.stock >= 50;
    if (stockStatusFilter === 'Out of Stock') matchesStock = m.stock <= 0;
    return matchesSearch && matchesStock;
  });

  const filteredUsageLogs = usageLogs.filter(log => {
    const matchesSearch = log.material.toLowerCase().includes(usageSearch.toLowerCase()) ||
                          log.project.toLowerCase().includes(usageSearch.toLowerCase());
    const matchesProject = usageProjectFilter === 'All' || log.project === usageProjectFilter;
    return matchesSearch && matchesProject;
  });

  return (
    <div className="materials-container">
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <h1 className="page-title">Material Management</h1>
        <div className="action-toolbar">
          <div className="action-toolbar-buttons">
            <button className="btn btn-primary" onClick={() => {
              setCurrentMaterial({ id: '', name: '', stock: '', unit: 'Bags', purchaseAmount: '', date: new Date().toISOString().split('T')[0] });
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
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid">
        <div className="summary-card" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}>
          <div className="summary-icon-box" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
            <Package size={22} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Total Items</h3>
            <div className="summary-value">{materials.length}</div>
          </div>
        </div>
        <div className="summary-card" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
          <div className="summary-icon-box" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Low Stock Alert</h3>
            <div className="summary-value" style={{ color: 'var(--color-warning)' }}>{materials.filter(m => m.stock > 0 && m.stock < (m.lowStockWarning || 50)).length}</div>
          </div>
        </div>
        <div className="summary-card" style={{ backgroundColor: '#f0fdf4', borderColor: '#d1fae5' }}>
          <div className="summary-icon-box" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
            <Package size={22} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Stock Value</h3>
            <div className="summary-value">
              {formatCurrency(materials.reduce((sum, m) => {
                const batches = m.batches || [];
                if (batches.length > 0) {
                  return sum + batches.reduce((bsum, b) => bsum + (b.quantityAvailable * b.purchaseRate), 0);
                }
                return sum + ((m.stock || 0) * (m.purchaseAmount || 0));
              }, 0))}
            </div>
          </div>
        </div>
        <div className="summary-card" style={{ backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }}>
          <div className="summary-icon-box" style={{ backgroundColor: '#f3e8ff', color: '#8b5cf6' }}>
            <Truck size={22} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Distributed Value</h3>
            <div className="summary-value" style={{ color: '#8b5cf6' }}>{formatCurrency(usageLogs.reduce((sum, u) => sum + (Number(u.distributionRate || 0) * Number(u.quantity || 0)), 0))}</div>
          </div>
        </div>
      </div>

      {/* Tab Nav Pills */}
      <div className="labour-nav-pills" style={{ marginBottom: '1.5rem', width: 'fit-content' }}>
        <button 
          className={`nav-pill ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('stock');
            setSelectedMaterialId(null);
          }}
        >
          <Package size={15} /> Raw Material Stock
        </button>
        <button 
          className={`nav-pill ${activeTab === 'usage' ? 'active' : ''}`}
          onClick={() => setActiveTab('usage')}
        >
          <Truck size={15} /> Usage Logs (Distributions)
        </button>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Search for Material Cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', maxWidth: '300px', width: '100%' }}>
            <Search size={16} color="var(--color-text-muted)" />
            <div style={{ flex: 1 }}>
              <SearchWithSuggestions 
                value={materialSearch}
                onChange={setMaterialSearch}
                placeholder="Search raw material cards..."
                suggestions={materials.map(m => m.name)}
              />
            </div>
          </div>

          {/* Material Stock Side Scrollable Cards */}
          <div className="side-scrollable-container">
            {filteredMaterials.map(mat => {
              const isExpanded = selectedMaterialId === (mat.id || mat._id);
              const isLowStock = mat.stock > 0 && mat.stock < (mat.lowStockWarning || 50);
              const isOutOfStock = mat.stock <= 0;
              const statusClass = isOutOfStock ? 'status-out-of-stock' : isLowStock ? 'status-low-stock' : 'status-in-stock';

              return (
                <div 
                  key={mat.id || mat._id}
                  className={`material-scroll-card ${statusClass} ${isExpanded ? 'active' : ''}`}
                  onClick={() => setSelectedMaterialId(isExpanded ? null : (mat.id || mat._id))}
                >
                  <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-main)' }} title={mat.name}>
                    {mat.name}
                  </h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginTop: 'auto' }}>
                    <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Package size={13} style={{ opacity: 0.7 }} /> Stock:
                    </span>
                    <span style={{ fontWeight: 800, color: isOutOfStock ? 'var(--color-danger)' : 'var(--color-text-main)' }}>
                      {mat.stock} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>{mat.unit}</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.15rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: isOutOfStock ? 'var(--color-danger)' : isLowStock ? 'var(--color-warning)' : 'var(--color-success)' }}>
                      {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                    </span>
                    {isExpanded && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)' }}>Selected</span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredMaterials.length === 0 && (
              <div className="card" style={{ flex: 1, textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', minWidth: '200px' }}>
                No materials found.
              </div>
            )}
          </div>

          {/* Expanded Card Detail Sub-panel */}
          {selectedMaterialId && (() => {
            const selectedMat = materials.find(m => (m.id || m._id) === selectedMaterialId);
            if (!selectedMat) return null;
            const batches = selectedMat.batches || [];
            
            return (
              <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem', border: '1px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{selectedMat.name} Detailed Batch Stocks</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Unit: {selectedMat.unit} | Total Stock Available: <strong style={{ color: 'var(--color-primary)' }}>{selectedMat.stock}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setCurrentMaterial({
                          ...selectedMat,
                          id: selectedMat.id || selectedMat._id,
                          stock: '', // Clear count so they add new batch rather than overwriting
                          date: new Date().toISOString().split('T')[0]
                        });
                        setShowEditMaterial(true);
                      }}
                    >
                      <Edit size={14} /> Edit Details
                    </button>
                    <button 
                      className="btn btn-secondary text-danger" 
                      style={{ color: '#ef4444' }}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete material "${selectedMat.name}"? This will delete all usage logs for this material.`)) {
                          deleteMaterialAction(selectedMat.id || selectedMat._id);
                          setSelectedMaterialId(null);
                        }
                      }}
                    >
                      <Trash2 size={14} /> Delete Material
                    </button>
                    <button className="btn btn-secondary" onClick={() => setSelectedMaterialId(null)}>Close Panel</button>
                  </div>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Batch #</th>
                        <th>Purchase Date</th>
                        <th>Purchase Rate (₹)</th>
                        <th>Purchased Quantity</th>
                        <th>Available Stock</th>
                        <th>Total Value (Available)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((b, idx) => (
                        <tr key={idx}>
                          <td data-label="Batch #">Batch {idx + 1}</td>
                          <td data-label="Purchase Date">{formatDate(b.purchaseDate)}</td>
                          <td data-label="Purchase Rate" style={{ fontWeight: 600 }}>₹{b.purchaseRate?.toLocaleString('en-IN') || 0}</td>
                          <td data-label="Purchased Qty">{b.quantityPurchased} {selectedMat.unit}</td>
                          <td data-label="Available Stock" style={{ fontWeight: 700, color: b.quantityAvailable > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{b.quantityAvailable} {selectedMat.unit}</td>
                          <td data-label="Total Value">₹{(b.quantityAvailable * b.purchaseRate).toLocaleString('en-IN')}</td>
                          <td data-label="Status">
                            <span className={`badge ${b.quantityAvailable <= 0 ? 'badge-pending' : b.quantityAvailable < b.quantityPurchased ? 'badge-planning' : 'badge-active'}`}>
                              {b.quantityAvailable <= 0 ? 'Exhausted' : b.quantityAvailable < b.quantityPurchased ? 'Deducted' : 'Unused'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {batches.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>
                            No batch details found. (Fallback Rate: ₹{selectedMat.purchaseAmount} | Available: {selectedMat.stock} {selectedMat.unit})
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* All Raw Materials Stock Grid Table */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>All Raw Materials Stock Summary</h3>
              <div className="action-toolbar">
                <div style={{ width: '180px' }}>
                  <SearchWithSuggestions 
                    value={materialSearch}
                    onChange={setMaterialSearch}
                    placeholder="Search stock..."
                    suggestions={materials.map(m => m.name)}
                  />
                </div>
                <div className="action-toolbar-buttons">
                  <button 
                    className={`btn btn-secondary ${stockStatusFilter !== 'All' ? 'btn-filter-active' : ''}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                    onClick={() => setShowStockFilterModal(true)}
                  >
                    <Filter size={14} /> Filter
                    {stockStatusFilter !== 'All' && <span className="filter-badge-dot" />}
                  </button>
                  {stockStatusFilter !== 'All' && (
                    <button 
                      className="btn btn-secondary text-danger" 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                      onClick={() => setStockStatusFilter('All')}
                      title="Reset Filters"
                    >
                      <RotateCcw size={13} /> Reset
                    </button>
                  )}
                  <button 
                    className="btn btn-secondary" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                    onClick={() => {
                      const exportData = filteredMaterials.map(mat => ({
                        'Material ID': formatMaterialId(mat.id || mat._id),
                        'Material Name': mat.name,
                        'Stock Available': mat.stock,
                        'Unit': mat.unit,
                        'Latest Purchase Rate (₹)': mat.purchaseAmount,
                        'Total Stock Value (₹)': mat.stock * mat.purchaseAmount
                      }));
                      exportToExcel(exportData, 'Materials_Stock_Report');
                    }}
                  >
                    <Download size={14} /> Export Excel
                  </button>
                </div>
              </div>
            </div>

            <FilterModal
              isOpen={showStockFilterModal}
              onClose={() => setShowStockFilterModal(false)}
              onReset={() => setStockStatusFilter('All')}
              title="Filter Stock Levels"
            >
              <div className="form-group">
                <label>Stock Level Status</label>
                <select value={stockStatusFilter} onChange={e => setStockStatusFilter(e.target.value)}>
                  <option value="All">All Stock Levels</option>
                  <option value="In Stock">In Stock (&ge; 50)</option>
                  <option value="Low Stock">Low Stock (&lt; 50)</option>
                  <option value="Out of Stock">Out of Stock (= 0)</option>
                </select>
              </div>
            </FilterModal>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Material ID</th>
                    <th>Name</th>
                    <th>Stock Available</th>
                    <th>Purchased Stock</th>
                    <th>Unit</th>
                    <th>Latest Purchase Rate (₹)</th>
                    <th>Total Value (Available)</th>
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
                        <td data-label="Material ID">{formatMaterialId(mat.id || mat._id)}</td>
                        <td data-label="Name" style={{ fontWeight: 600 }}>{mat.name}</td>
                        <td data-label="Stock Available">{mat.stock}</td>
                        <td data-label="Purchased Stock" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{purchasedStock}</td>
                        <td data-label="Unit">{mat.unit}</td>
                        <td data-label="Purchase Rate">₹{mat.purchaseAmount?.toLocaleString('en-IN') || 0}</td>
                        <td data-label="Total Purchase Amount" style={{ fontWeight: 600 }}>₹{((mat.stock || 0) * (mat.purchaseAmount || 0)).toLocaleString('en-IN')}</td>
                        <td data-label="Actions" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.45rem' }} 
                            title="Edit Stock Item"
                            onClick={() => {
                              setCurrentMaterial({
                                ...mat,
                                id: mat.id || mat._id,
                                stock: '', // Clear count so they add new batch rather than overwriting
                                date: new Date().toISOString().split('T')[0]
                              });
                              setShowEditMaterial(true);
                            }}
                          >
                            <Edit size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMaterials.length === 0 && (
                    <tr><td colSpan="8" style={{textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>No materials found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Tab 2: Usage Logs (Distributions) */
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Recent Usage Logs (Distributed to Sites)</h3>
            <div className="action-toolbar">
              <div style={{ width: '180px' }}>
                <SearchWithSuggestions 
                  value={usageSearch}
                  onChange={setUsageSearch}
                  placeholder="Search usage..."
                  suggestions={materials.map(m => m.name)}
                />
              </div>
              <div className="action-toolbar-buttons">
                <button 
                  className={`btn btn-secondary ${usageProjectFilter !== 'All' ? 'btn-filter-active' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  onClick={() => setShowUsageFilterModal(true)}
                >
                  <Filter size={14} /> Filter
                  {usageProjectFilter !== 'All' && <span className="filter-badge-dot" />}
                </button>
                {usageProjectFilter !== 'All' && (
                  <button 
                    className="btn btn-secondary text-danger" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                    onClick={() => setUsageProjectFilter('All')}
                    title="Reset Filters"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                )}
                <button 
                  className="btn btn-secondary" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                  onClick={() => {
                    const exportData = filteredUsageLogs.map(log => ({
                      'Log ID': formatMaterialId(log.id || log._id),
                      'Material': log.material,
                      'Site / Project': log.project,
                      'Quantity Distributed': log.quantity,
                      'Unit': log.unit,
                      'Distribution Rate (₹)': log.distributionRate,
                      'Total Distributed Amount (₹)': Number(log.distributionRate || 0) * Number(log.quantity || 0),
                      'Date of Distribution': log.date
                    }));
                    exportToExcel(exportData, 'Material_Usage_Logs');
                  }}
                >
                  <Download size={14} /> Export Excel
                </button>
              </div>
            </div>
          </div>

          <FilterModal
            isOpen={showUsageFilterModal}
            onClose={() => setShowUsageFilterModal(false)}
            onReset={() => setUsageProjectFilter('All')}
            title="Filter Usage Logs"
          >
            <div className="form-group">
              <label>Site / Project</label>
              <select value={usageProjectFilter} onChange={e => setUsageProjectFilter(e.target.value)}>
                <option value="All">All Sites / Projects</option>
                {projects.map(p => <option key={p.id || p._id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          </FilterModal>

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
                    <td data-label="Actions" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.45rem' }} 
                        title="Edit Usage Log"
                        onClick={() => {
                          setCurrentUsage(log);
                          setShowEditUsage(true);
                        }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary text-danger" 
                        style={{ padding: '0.35rem 0.45rem', color: '#ef4444' }} 
                        title="Delete Usage Log"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this material usage log? The stock level and finances will be adjusted back.")) {
                            deleteMaterialUsageAction(log.id || log._id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsageLogs.length === 0 && (
                  <tr><td colSpan="9" style={{textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>No usage logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Material Stock Modal */}
      {(showAddMaterial || showEditMaterial) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', margin: 0 }}>
                {showEditMaterial ? <><Edit size={18} color="var(--color-info)" /> Edit Material Stock Item</> : <><Plus size={18} color="var(--color-info)" /> Add Material Stock (New Purchase Batch)</>}
              </h2>
              <button className="btn-close" onClick={() => { setShowAddMaterial(false); setShowEditMaterial(false); }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveMaterial} className="modal-form">
              <div className="form-group">
                <label>Material Name</label>
                <input 
                  required 
                  type="text" 
                  list="all-materials-datalist"
                  value={currentMaterial.name} 
                  onChange={e => {
                    const matchedMat = materials.find(m => m.name.toLowerCase() === e.target.value.trim().toLowerCase());
                    setCurrentMaterial({
                      ...currentMaterial,
                      name: e.target.value,
                      unit: matchedMat ? matchedMat.unit : currentMaterial.unit,
                      purchaseAmount: matchedMat ? matchedMat.purchaseAmount : currentMaterial.purchaseAmount
                    });
                  }} 
                  placeholder="e.g. Cement" 
                  disabled={showEditMaterial}
                />
                <datalist id="all-materials-datalist">
                  {materials.map((m, idx) => (
                    <option key={idx} value={m.name}>{m.name} ({m.unit})</option>
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>{showEditMaterial ? 'Add Stock Quantity (Optional)' : 'Purchase Quantity'}</label>
                <input required={!showEditMaterial} type="number" min="0" value={currentMaterial.stock} onChange={e => setCurrentMaterial({...currentMaterial, stock: e.target.value})} placeholder={showEditMaterial ? "Leave empty or enter new stock quantity" : "e.g. 100"} />
              </div>
              <div className="form-group">
                <label>Unit of Measurement (Type or Select)</label>
                <input 
                  required 
                  type="text" 
                  list="material-unit-suggestions-list" 
                  value={currentMaterial.unit} 
                  onChange={e => setCurrentMaterial({...currentMaterial, unit: e.target.value})} 
                  placeholder="Select or type custom unit" 
                />
                <datalist id="material-unit-suggestions-list">
                  {Array.from(new Set(['Bags', 'Tons', 'Cubic Feet', 'Cum', 'Liters', 'Pieces', 'Kg', 'Boxes', 'Meters', 'Sq. Ft.', 'Trucks', 'Bundles', ...materials.map(m => m.unit)])).filter(Boolean).map((u, idx) => (
                    <option key={idx} value={u} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>Purchase Rate / Cost per Unit (₹)</label>
                <input required type="number" min="0" value={currentMaterial.purchaseAmount} onChange={e => setCurrentMaterial({...currentMaterial, purchaseAmount: e.target.value})} placeholder="e.g. 350" />
              </div>
              <div className="form-group">
                <label>Purchase Date</label>
                <input required type="date" value={currentMaterial.date} onChange={e => setCurrentMaterial({...currentMaterial, date: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddMaterial(false); setShowEditMaterial(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{showEditMaterial ? 'Save Material Details' : 'Add Stock Batch'}</button>
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
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', margin: 0 }}>
                {showEditUsage ? <><Edit size={18} color="var(--color-info)" /> Edit Material Usage Log</> : <><Truck size={18} color="var(--color-info)" /> Log Material Usage to Site</>}
              </h2>
              <button className="btn-close" onClick={() => { setShowAddUsage(false); setShowEditUsage(false); }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveUsage} className="modal-form">
              <div className="form-group">
                <label>Material Name</label>
                <input 
                  required 
                  type="text" 
                  list="material-names-list"
                  value={currentUsage.material} 
                  onChange={e => {
                    const matName = e.target.value;
                    const mat = materials.find(m => m.name.toLowerCase() === matName.toLowerCase());
                    setCurrentUsage({
                      ...currentUsage, 
                      material: matName, 
                      unit: mat ? mat.unit : currentUsage.unit, 
                      distributionRate: mat ? mat.purchaseAmount : currentUsage.distributionRate
                    });
                  }} 
                  placeholder="Type or select material..." 
                />
                <datalist id="material-names-list">
                  {materials.map((m, i) => (
                    <option key={i} value={m.name}>Stock: {m.stock} {m.unit} | Rate: ₹{m.purchaseAmount}</option>
                  ))}
                </datalist>
                {currentUsage.material && (() => {
                  const matched = materials.find(m => m.name.toLowerCase() === currentUsage.material.trim().toLowerCase());
                  return matched ? (
                    <span style={{ fontSize: '0.8rem', color: matched.stock > 0 ? '#10b981' : '#ef4444', marginTop: '0.35rem', display: 'block', fontWeight: 600 }}>
                      Available Stock: {matched.stock} {matched.unit} (Latest Rate: ₹{matched.purchaseAmount})
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.35rem', display: 'block' }}>
                      Material not found in stock. Add stock first before logging usage.
                    </span>
                  );
                })()}
              </div>

              {/* Batch Autofill Section */}
              {(() => {
                const matched = materials.find(m => m.name.toLowerCase() === (currentUsage.material || '').trim().toLowerCase());
                const activeBatches = matched ? (matched.batches || []).filter(b => b.quantityAvailable > 0) : [];
                if (activeBatches.length > 0) {
                  return (
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Select Available Batch Rate to Auto-Fill</label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {activeBatches.map((b, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)' }}
                            onClick={() => {
                              setCurrentUsage({
                                ...currentUsage,
                                distributionRate: b.purchaseRate,
                                quantity: Math.min(Number(currentUsage.quantity) || b.quantityAvailable, b.quantityAvailable)
                              });
                            }}
                          >
                            ₹{b.purchaseRate} ({b.quantityAvailable} {matched.unit} left)
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="form-group">
                <label>Site / Project</label>
                <input 
                  required 
                  type="text" 
                  list="materials-project-list"
                  value={currentUsage.project} 
                  onChange={e => setCurrentUsage({...currentUsage, project: e.target.value})} 
                  placeholder="Type or select project..." 
                />
                <datalist id="materials-project-list">
                  {projects.map((p, i) => <option key={i} value={p.name} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label>Quantity Distributed</label>
                <input required type="number" min="0" value={currentUsage.quantity} onChange={e => setCurrentUsage({...currentUsage, quantity: e.target.value})} placeholder="e.g. 50" />
              </div>
              <div className="form-group">
                <label>Distribution Rate / Rate (₹)</label>
                <input required type="number" min="0" value={currentUsage.distributionRate} onChange={e => setCurrentUsage({...currentUsage, distributionRate: e.target.value})} placeholder="e.g. 360" />
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
