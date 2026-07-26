import React, { useState } from 'react';
import { Plus, X, Trash2, ArrowUpRight, Clock, CheckCircle, Download, Filter, RotateCcw, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoBase64Raw } from '../utils/logoBase64';
import { useCMS } from '../context/CMSContext';
import { formatDate } from '../utils';
import SkeletonLoader from '../components/SkeletonLoader';
import SearchWithSuggestions from '../components/SearchWithSuggestions';
import { exportToExcel } from '../utils/exportToExcel';
import FilterModal from '../components/FilterModal';

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

  // Search and Filter states
  const [incomeSearch, setIncomeSearch] = useState('');
  const [labourSearch, setLabourSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('All');
  const [showIncomeFilterModal, setShowIncomeFilterModal] = useState(false);

  // Add Income Handler
  const handleAddIncome = (e) => {
    e.preventDefault();
    if (Number(newIncome.amount) < 0) {
      alert('Amount Received cannot be negative.');
      return;
    }
    addIncomeAction({
      project: newIncome.project,
      amount: Number(newIncome.amount),
      paymentType: newIncome.paymentType,
      date: newIncome.date
    });
    setShowAddIncome(false);
    setNewIncome({ project: '', amount: '', paymentType: 'Bank Transfer', date: new Date().toISOString().split('T')[0] });
  };

  // Bill PDF generator for a specific project
  const generateBillPdf = async (projectName) => {
    const projectIncomes = incomes
      .filter(i => i.project === projectName)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const proj = projects.find(p => p.name === projectName);
    const totalBudget = proj ? (proj.budget || 0) : 0;
    const totalCollected = projectIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);
    const amountToReceive = Math.max(0, totalBudget - totalCollected);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const orange    = [245, 130, 32];
    const darkBlue  = [30, 45, 80];
    const darkColor = [25, 25, 35];
    const white     = [255, 255, 255];
    const lightBg   = [248, 250, 253];

    // ── Header: white bg with logo ──
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, 42, 'F');
    doc.setFillColor(...orange);
    doc.rect(0, 0, 5, 42, 'F');

    const logoB64 = await getLogoBase64Raw();
    if (logoB64) {
      doc.addImage(logoB64, 'JPEG', 8, 3, 36, 36);
    }

    const textX = logoB64 ? 48 : 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...darkColor);
    doc.text('SHREERAM CONSTRUCTION', textX, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 70, 20);
    doc.text('Civil Construction & Government Contractor', textX, 18);

    const rightX = pageW - 12;
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 80);
    doc.text('Mob: +91 7720900336', rightX, 10, { align: 'right' });
    doc.text('GST: 27CZPPG0505C1ZR', rightX, 15, { align: 'right' });
    doc.text('Email: shreeramconstruction1111@gmail.com', rightX, 20, { align: 'right' });
    doc.text('A/P SHINGAVE (PARGAON), AMBEGAON,', rightX, 25, { align: 'right' });
    doc.text('PUNE - 412406', rightX, 30, { align: 'right' });

    doc.setDrawColor(...orange);
    doc.setLineWidth(1);
    doc.line(0, 42, pageW, 42);

    // ── Document Title ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...darkColor);
    doc.text('INCOME RECEIPT', pageW / 2, 52, { align: 'center' });
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.5);
    doc.line(pageW / 2 - 30, 54, pageW / 2 + 30, 54);

    // ── Project Info Box ──
    doc.setFillColor(...lightBg);
    doc.roundedRect(12, 58, pageW - 24, 36, 3, 3, 'F');
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, 58, pageW - 24, 36, 3, 3, 'S');

    const col1 = 18, col2 = pageW / 2 + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    doc.text('Project / Site:', col1, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(projectName, col1 + 30, 66);
    if (proj) {
      doc.setFont('helvetica', 'bold');
      doc.text('Client:', col1, 73);
      doc.setFont('helvetica', 'normal');
      doc.text(proj.client || '-', col1 + 30, 73);
      doc.setFont('helvetica', 'bold');
      doc.text('Location:', col1, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(proj.location || '-', col1 + 30, 80);
    }
    doc.setFont('helvetica', 'bold');
    doc.text('Generated:', col2, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), col2 + 25, 66);
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', col2, 73);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(amountToReceive <= 0 ? 16 : 239, amountToReceive <= 0 ? 185 : 68, amountToReceive <= 0 ? 129 : 68);
    doc.text(amountToReceive <= 0 ? 'FULLY COLLECTED' : 'PARTIALLY COLLECTED', col2 + 25, 73);
    doc.setTextColor(...darkColor);


    // Payments Table
    let runningBalance = totalBudget;
    const tableBody = projectIncomes.map((inc, idx) => {
      runningBalance -= Number(inc.amount || 0);
      return [
        idx + 1,
        new Date(inc.date).toLocaleDateString('en-IN'),
        inc.paymentType || '-',
        'Rs. ' + Number(inc.amount || 0).toLocaleString('en-IN'),
        'Rs. ' + Math.max(0, runningBalance).toLocaleString('en-IN')
      ];
    });

    autoTable(doc, {
      startY: 100,
      head: [['#', 'Date', 'Payment Type', 'Amount Received', 'Balance Remaining']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 45, 80], textColor: 255, fontStyle: 'bold', fontSize: 9, halign: 'center' },
      bodyStyles: { fontSize: 8.5, textColor: darkColor },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 3: { halign: 'right', textColor: [16, 185, 129] }, 4: { halign: 'right' } },
      margin: { left: 12, right: 12 }
    });

    // Summary box
    const finalY = doc.lastAutoTable.finalY + 8;
    const summaryH = 42;
    doc.setFillColor(...orange);
    doc.roundedRect(12, finalY, pageW - 24, summaryH, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('FINANCIAL SUMMARY', 18, finalY + 9);
    const col1x = 18, col2x = pageW / 2 + 4;
    doc.setFontSize(9);
    const summaryRows = [
      ['Total Budget',    'Rs. ' + totalBudget.toLocaleString('en-IN'),    col1x, finalY + 20],
      ['Total Collected', 'Rs. ' + totalCollected.toLocaleString('en-IN'), col1x, finalY + 32],
      ['Remaining',       'Rs. ' + amountToReceive.toLocaleString('en-IN'), col2x, finalY + 20],
      ['No. of Payments', String(projectIncomes.length),                    col2x, finalY + 32]
    ];
    summaryRows.forEach(([label, val, x, y]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 230, 180);
      doc.text(label + ':', x, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(val, x + 35, y);
    });

    // Footer
    const pgH = doc.internal.pageSize.getHeight();
    doc.setFillColor(...orange);
    doc.rect(0, pgH - 12, pageW, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('Shreeram Construction | Mob: +91 7720900336 | shreeramconstruction1111@gmail.com | GST: 27CZPPG0505C1ZR', pageW / 2, pgH - 5, { align: 'center' });

    doc.save(`Income_Bill_${projectName.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) {
    return <SkeletonLoader type="table" rows={7} />;
  }

  const { totalBudget = 0, totalRevenue = 0, totalLaborPending = 0, totalLaborPaid = 0, totalMaterialSpent = 0, activeProjects = 0, totalProjects = 0 } = stats;

  const filteredIncomes = incomes.filter(inc => {
    const matchesSearch = inc.project.toLowerCase().includes(incomeSearch.toLowerCase());
    const matchesPaymentType = paymentTypeFilter === 'All' || inc.paymentType === paymentTypeFilter;
    return matchesSearch && matchesPaymentType;
  });

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
        <div className="card stat-card" style={{ backgroundColor: '#f0fdf4', borderColor: '#d1fae5' }}>
          <div className="stat-content">
            <h3>Active Sites</h3>
            <div className="value text-success">{activeProjects || projects.filter(p => p.status === 'Active').length}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>of {totalProjects || projects.length} total</div>
          </div>
        </div>
      </div>

      {/* SITE FINANCE TABLE */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Site Payments Received (Income)</h3>
          <div className="action-toolbar">
            <div style={{ width: '180px' }}>
              <SearchWithSuggestions 
                value={incomeSearch}
                onChange={setIncomeSearch}
                placeholder="Search site..."
                suggestions={projects.map(p => p.name)}
              />
            </div>
            <div className="action-toolbar-buttons">
              <button 
                className={`btn btn-secondary ${paymentTypeFilter !== 'All' ? 'btn-filter-active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                onClick={() => setShowIncomeFilterModal(true)}
              >
                <Filter size={14} /> Filter
                {paymentTypeFilter !== 'All' && <span className="filter-badge-dot" />}
              </button>
              {paymentTypeFilter !== 'All' && (
                <button 
                  className="btn btn-secondary text-danger" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  onClick={() => setPaymentTypeFilter('All')}
                  title="Reset Filters"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
              <button 
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                onClick={() => {
                  // Group incomes by project
                  const projectMap = {};
                  filteredIncomes.forEach(inc => {
                    if (!projectMap[inc.project]) projectMap[inc.project] = { totalCollected: 0, count: 0 };
                    projectMap[inc.project].totalCollected += Number(inc.amount || 0);
                    projectMap[inc.project].count++;
                  });
                  const exportData = filteredIncomes.map(inc => ({
                    'Date': formatDate(inc.date),
                    'Site / Project': inc.project,
                    'Payment Type': inc.paymentType,
                    'Amount Received (Rs.)': Number(inc.amount || 0)
                  }));
                  exportToExcel(exportData, 'Site_Income_Report');
                }}
              >
                <Download size={14} /> Export Excel
              </button>
              <button className="btn btn-primary" onClick={() => setShowAddIncome(true)}>
                <Plus size={16} /> Add Income
              </button>
            </div>
          </div>
        </div>

        <FilterModal
          isOpen={showIncomeFilterModal}
          onClose={() => setShowIncomeFilterModal(false)}
          onReset={() => setPaymentTypeFilter('All')}
          title="Filter Site Income"
        >
          <div className="form-group">
            <label>Payment Method</label>
            <select value={paymentTypeFilter} onChange={e => setPaymentTypeFilter(e.target.value)}>
              <option value="All">All Payment Types</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </FilterModal>
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
                  <td data-label="Actions" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Download Bill PDF"
                      onClick={() => generateBillPdf(inc.project)}
                    >
                      <FileText size={13} /> Bill
                    </button>
                    <button 
                      className="btn btn-secondary text-danger" 
                      style={{ padding: '0.35rem 0.45rem', color: '#ef4444' }}
                      title="Delete Payment"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this incoming payment record?")) {
                          deleteFinanceAction(inc.id || inc._id);
                        }
                      }}
                    >
                      <Trash2 size={14} />
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Labour Finance Summary</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '180px' }}>
              <SearchWithSuggestions 
                value={labourSearch}
                onChange={setLabourSearch}
                placeholder="Search worker..."
                suggestions={labourStats.map(w => w.name)}
              />
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              onClick={() => {
                const exportData = filteredLabourStats.map(w => ({
                  'Worker Name': w.name,
                  'Total Wage Incurred (Rs.)': Number(w.incurred || 0),
                  'Amount Paid (Rs.)': Number(w.paid || 0),
                  'Amount Pending (Rs.)': Number(w.pending || 0),
                  'Status': (w.pending || 0) > 0 ? 'Pending' : 'Clear'
                }));
                exportToExcel(exportData, 'Labour_Finance_Summary');
              }}
            >
              <Download size={14} /> Export Excel
            </button>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Material Finance Overview</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '180px' }}>
              <SearchWithSuggestions 
                value={materialSearch}
                onChange={setMaterialSearch}
                placeholder="Search material..."
                suggestions={materialStats.map(m => m.name)}
              />
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              onClick={() => {
                const exportData = filteredMaterialStats.map(m => ({
                  'Material Name': m.name,
                  'Purchase Date': m.purchaseDate === 'Historic' ? 'Historic' : formatDate(m.purchaseDate),
                  'Purchased Qty': Number(m.purchasedQty || 0),
                  'Unit': m.unit || '-',
                  'Total Purchase Cost (Rs.)': Number(m.purchaseValue || 0),
                  'Distributed Qty': Number(m.distQty || 0),
                  'Distributed Value (Rs.)': Number(m.distValue || 0),
                  'Profit / Difference (Rs.)': Number(m.profit || 0)
                }));
                exportToExcel(exportData, 'Material_Finance_Overview');
              }}
            >
              <Download size={14} /> Export Excel
            </button>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Batch / Material</th>
                <th>Purchase Date</th>
                <th>Total Purchase Cost (₹)</th>
                <th>Total Distributed Amount (₹)</th>
                <th>Profit / Difference (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterialStats.map((mat, idx) => (
                <tr key={idx}>
                  <td data-label="Material" style={{ fontWeight: 600 }}>{mat.name}</td>
                  <td data-label="Purchase Date">{mat.purchaseDate === 'Historic' ? 'Historic' : formatDate(mat.purchaseDate)}</td>
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
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '1rem'}}>No material data available.</td></tr>
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
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', margin: 0 }}>
                <Plus size={18} color="var(--color-info)" /> Add Site Payment Income
              </h2>
              <button className="btn-close" onClick={() => setShowAddIncome(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddIncome} className="modal-form">
              <div className="form-group">
                <label>Site / Project Name</label>
                <input 
                  type="text" 
                  required 
                  list="finance-project-list"
                  value={newIncome.project} 
                  onChange={e => setNewIncome({...newIncome, project: e.target.value})} 
                  placeholder="Type or select site..."
                />
                <datalist id="finance-project-list">
                  {projects.map((p, i) => <option key={i} value={p.name} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label>Amount Received (₹)</label>
                <input 
                  type="number" 
                  min="0"
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
