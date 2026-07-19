import React, { useState } from 'react';
import { DollarSign, Plus, X, ArrowUpRight, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { formatDate } from '../utils';
import SkeletonLoader from '../components/SkeletonLoader';
import SearchWithSuggestions from '../components/SearchWithSuggestions';

const formatRupee = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const Finance = () => {
  const {
    finances,
    projects,
    loading,
    addIncomeAction,
    deleteFinanceAction
  } = useCMS();

  const { incomes = [], stats = {}, labourStats = [], materialStats = [] } = finances;
  
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [newIncome, setNewIncome] = useState({ project: '', amount: '', paymentType: 'Bank Transfer', date: new Date().toISOString().split('T')[0] });

  // Search states
  const [incomeSearch, setIncomeSearch] = useState('');
  const [labourSearch, setLabourSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');

  // Add Income Handler
  const handleAddIncome = (e) => {
    e.preventDefault();
    addIncomeAction({
      project: newIncome.project,
      amount: Number(newIncome.amount),
      paymentType: newIncome.paymentType,
      date: newIncome.date
    });
    setShowAddIncome(false);
    setNewIncome({ project: '', amount: '', paymentType: 'Bank Transfer', date: new Date().toISOString().split('T')[0] });
  };

  if (loading) {
    return <SkeletonLoader type="table" rows={7} />;
  }

  const { totalBudget = 0, totalRevenue = 0, totalLaborPending = 0, totalLaborPaid = 0, totalMaterialSpent = 0 } = stats;

  const filteredIncomes = incomes.filter(inc => 
    inc.project.toLowerCase().includes(incomeSearch.toLowerCase())
  );

  const filteredLabourStats = labourStats.filter(worker => 
    worker.name.toLowerCase().includes(labourSearch.toLowerCase())
  );

  const filteredMaterialStats = materialStats.filter(mat => 
    mat.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  return (
    <div className="finance-container">
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <h1 className="page-title">Financial Management</h1>
      </div>

      {/* OVERALL ONGOING SITES FINANCE CARDS */}
      <div className="dashboard-grid">
        <div className="card stat-card" style={{ backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }}>
          <div className="stat-content">
            <h3>Total Budget Value</h3>
            <div className="value">{formatRupee(totalBudget)}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#f0fdf4', borderColor: '#d1fae5' }}>
          <div className="stat-content">
            <h3>Revenue Collected</h3>
            <div className="value text-success">{formatRupee(totalRevenue)}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}>
          <div className="stat-content">
            <h3>Material Purchase Spent</h3>
            <div className="value text-info">{formatRupee(totalMaterialSpent)}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#fef2f2', borderColor: '#fee2e2' }}>
          <div className="stat-content">
            <h3>Labor Wages Paid</h3>
            <div className="value text-success">{formatRupee(totalLaborPaid)}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
          <div className="stat-content">
            <h3>Labor Wages Pending</h3>
            <div className="value text-danger">{formatRupee(totalLaborPending)}</div>
          </div>
        </div>
      </div>

      {/* SITE FINANCE TABLE */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Site Finance (Revenue Received)</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '200px' }}>
              <SearchWithSuggestions 
                value={incomeSearch}
                onChange={setIncomeSearch}
                placeholder="Search project..."
                suggestions={projects.map(p => p.name)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddIncome(true)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
              <Plus size={16} /> Add Incoming Amount
            </button>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Site / Project</th>
                <th>Payment Type</th>
                <th>Amount Received (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncomes.map((inc) => (
                <tr key={inc.id || inc._id}>
                  <td data-label="Date">{formatDate(inc.date)}</td>
                  <td data-label="Site" style={{ fontWeight: 600 }}>{inc.project}</td>
                  <td data-label="Payment Type">
                    <span className="badge" style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--border-color)' }}>
                      {inc.paymentType}
                    </span>
                  </td>
                  <td data-label="Amount Received" className="text-success" style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ArrowUpRight size={16} /> {formatRupee(inc.amount)}
                    </div>
                  </td>
                  <td data-label="Actions">
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this incoming payment record?")) {
                          deleteFinanceAction(inc.id || inc._id);
                        }
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredIncomes.length === 0 && (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '1rem'}}>No incoming payments found matching search query.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LABOUR FINANCE TABLE */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Labour Finance Summary</h3>
          <div style={{ width: '220px' }}>
            <SearchWithSuggestions 
              value={labourSearch}
              onChange={setLabourSearch}
              placeholder="Search worker..."
              suggestions={labourStats.map(w => w.name)}
            />
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Worker Name</th>
                <th>Total Wage Incurred (₹)</th>
                <th>Amount Paid (₹)</th>
                <th>Amount Pending (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLabourStats.map((worker, idx) => (
                <tr key={idx}>
                  <td data-label="Worker Name" style={{ fontWeight: 600 }}>{worker.name}</td>
                  <td data-label="Wage Incurred">{formatRupee(worker.incurred)}</td>
                  <td data-label="Amount Paid" className="text-success">{formatRupee(worker.paid)}</td>
                  <td data-label="Amount Pending" className="text-danger">{formatRupee(worker.pending)}</td>
                  <td data-label="Status">
                    {worker.pending > 0 ? (
                      <span className="badge badge-pending" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                        <Clock size={12} /> Pending
                      </span>
                    ) : (
                      <span className="badge badge-active" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                        <CheckCircle size={12} /> Clear
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLabourStats.length === 0 && (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '1rem'}}>No labour data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MATERIAL FINANCE TABLE */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Material Finance Overview</h3>
          <div style={{ width: '220px' }}>
            <SearchWithSuggestions 
              value={materialSearch}
              onChange={setMaterialSearch}
              placeholder="Search material..."
              suggestions={materialStats.map(m => m.name)}
            />
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Total Purchase Cost (₹)</th>
                <th>Total Distributed Amount (₹)</th>
                <th>Profit / Difference (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterialStats.map((mat, idx) => (
                <tr key={idx}>
                  <td data-label="Material" style={{ fontWeight: 600 }}>{mat.name}</td>
                  <td data-label="Purchase Cost">
                    {formatRupee(mat.purchaseValue)}
                    <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>{mat.purchasedQty} {mat.unit}</div>
                  </td>
                  <td data-label="Distributed Amount" className="text-success">
                    {formatRupee(mat.distValue)}
                    <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>{mat.distQty} {mat.unit}</div>
                  </td>
                  <td data-label="Difference">
                    <span style={{ color: mat.profit >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {mat.profit >= 0 ? '+' : ''}{formatRupee(mat.profit)}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredMaterialStats.length === 0 && (
                <tr><td colSpan="4" style={{textAlign: 'center', padding: '1rem'}}>No material data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD INCOME MODAL */}
      {showAddIncome && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Site Income</h2>
              <button className="btn-close" onClick={() => setShowAddIncome(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddIncome} className="modal-form">
              <div className="form-group">
                <label>Site / Project</label>
                <select required value={newIncome.project} onChange={e => setNewIncome({...newIncome, project: e.target.value})}>
                  <option value="">Select Site...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount Received (₹)</label>
                <input 
                  type="number" 
                  required 
                  value={newIncome.amount} 
                  onChange={e => setNewIncome({...newIncome, amount: e.target.value})} 
                  placeholder="e.g. 50000"
                />
              </div>
              <div className="form-group">
                <label>Payment Type</label>
                <select required value={newIncome.paymentType} onChange={e => setNewIncome({...newIncome, paymentType: e.target.value})}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  required 
                  value={newIncome.date} 
                  onChange={e => setNewIncome({...newIncome, date: e.target.value})} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddIncome(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Income</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
