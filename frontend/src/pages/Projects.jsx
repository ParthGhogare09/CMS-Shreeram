import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Trash2, Edit, Download, Filter, RotateCcw, Briefcase, CheckCircle, IndianRupee, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoBase64Raw } from '../utils/logoBase64';
import { useCMS } from '../context/CMSContext';
import SkeletonLoader from '../components/SkeletonLoader';
import SearchWithSuggestions from '../components/SearchWithSuggestions';
import { exportToExcel } from '../utils/exportToExcel';
import FilterModal from '../components/FilterModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const formatRupee = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const Projects = () => {
  const navigate = useNavigate();
  const { projects, finances, addProjectAction, updateProjectAction, deleteProjectAction, loading } = useCMS();
  const incomes = (finances && finances.incomes) ? finances.incomes : [];
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', client: '', budget: '', location: '', startDate: '', endDate: '' });

  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProject, setCurrentProject] = useState({ id: '', name: '', client: '', budget: '', location: '', startDate: '', endDate: '', status: 'Active' });
  const [projectSearch, setProjectSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  const handleAddProject = (e) => {
    e.preventDefault();
    const newProj = {
      name: formData.name,
      client: formData.client,
      budget: Number(formData.budget),
      location: formData.location,
      startDate: formData.startDate,
      endDate: formData.endDate
    };
    addProjectAction(newProj);
    setShowModal(false);
    setFormData({ name: '', client: '', budget: '', location: '', startDate: '', endDate: '' });
  };

  const handleEditProject = (e) => {
    e.preventDefault();
    const updatedProj = {
      name: currentProject.name,
      client: currentProject.client,
      budget: Number(currentProject.budget),
      location: currentProject.location,
      startDate: currentProject.startDate,
      endDate: currentProject.endDate,
      status: currentProject.status
    };
    updateProjectAction(currentProject.id, updatedProj);
    setShowEditModal(false);
  };

  // ── Project Bill PDF Generator ──────────────────────────────────────────────
  const generateProjectBillPdf = async (project) => {
    const projectIncomes = incomes
      .filter(i => i.project === project.name)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalBudget    = Number(project.budget || 0);
    const totalCollected = projectIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalRemaining = Math.max(0, totalBudget - totalCollected);

    const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // ── Brand colours ──
    const orange   = [245, 130, 32];
    const darkBlue = [30, 45, 80];
    const dark     = [25, 25, 35];
    const white    = [255, 255, 255];
    const lightBg  = [248, 250, 253];

    // ── Header: white background with logo ──
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, 42, 'F');

    // Left orange accent stripe
    doc.setFillColor(...orange);
    doc.rect(0, 0, 5, 42, 'F');

    // Logo (left side)
    const logoB64 = await getLogoBase64Raw();
    if (logoB64) {
      doc.addImage(logoB64, 'JPEG', 8, 3, 36, 36);
    }

    // Company name & tagline (right of logo)
    const textX = logoB64 ? 48 : 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...dark);
    doc.text('SHREERAM CONSTRUCTION', textX, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 70, 20);
    doc.text('Civil Construction & Government Contractor', textX, 18);

    // Contact info — right side of header
    const rightX = pageW - 12;
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 80);
    doc.text('Mob: +91 7720900336', rightX, 10, { align: 'right' });
    doc.text('GST: 27CZPPG0505C1ZR',  rightX, 15, { align: 'right' });
    doc.text('Email: shreeramconstruction1111@gmail.com', rightX, 20, { align: 'right' });
    doc.text('A/P SHINGAVE (PARGAON), AMBEGAON,', rightX, 25, { align: 'right' });
    doc.text('PUNE - 412406', rightX, 30, { align: 'right' });

    // Orange divider line below header
    doc.setDrawColor(...orange);
    doc.setLineWidth(1);
    doc.line(0, 42, pageW, 42);

    // ── Document Title ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...dark);
    doc.text('SITE INCOME BILL', pageW / 2, 52, { align: 'center' });

    // Underline the title
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.5);
    doc.line(pageW / 2 - 32, 54, pageW / 2 + 32, 54);

    // ── Project Info Box ──
    doc.setFillColor(...lightBg);
    doc.roundedRect(12, 58, pageW - 24, 36, 3, 3, 'F');
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, 58, pageW - 24, 36, 3, 3, 'S');

    const col1 = 18, col2 = pageW / 2 + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...dark);

    // Left column
    doc.text('Project / Site:', col1, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(project.name, col1 + 30, 66);

    doc.setFont('helvetica', 'bold');
    doc.text('Client:', col1, 73);
    doc.setFont('helvetica', 'normal');
    doc.text(project.client || '-', col1 + 30, 73);

    doc.setFont('helvetica', 'bold');
    doc.text('Location:', col1, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(project.location || '-', col1 + 30, 80);

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', col1, 87);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(project.status === 'Active' ? 16 : 100, project.status === 'Active' ? 185 : 100, project.status === 'Active' ? 129 : 100);
    doc.text(project.status || 'Active', col1 + 30, 87);
    doc.setTextColor(...dark);

    // Right column
    doc.setFont('helvetica', 'bold');
    doc.text('Bill Date:', col2, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), col2 + 25, 66);

    if (project.startDate) {
      doc.setFont('helvetica', 'bold');
      doc.text('Start Date:', col2, 73);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(project.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), col2 + 25, 73);
    }
    if (project.endDate) {
      doc.setFont('helvetica', 'bold');
      doc.text('End Date:', col2, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(project.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), col2 + 25, 80);
    }

    // ── Payments Table ──
    let runningCollected = 0;
    const tableBody = projectIncomes.map((inc, idx) => {
      runningCollected += Number(inc.amount || 0);
      const remaining = Math.max(0, totalBudget - runningCollected);
      return [
        idx + 1,
        new Date(inc.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        inc.paymentType || '-',
        'Rs. ' + totalBudget.toLocaleString('en-IN'),
        'Rs. ' + Number(inc.amount || 0).toLocaleString('en-IN'),
        'Rs. ' + remaining.toLocaleString('en-IN')
      ];
    });

    if (tableBody.length === 0) {
      tableBody.push(['-', 'No payments recorded yet', '-',
        'Rs. ' + totalBudget.toLocaleString('en-IN'), 'Rs. 0',
        'Rs. ' + totalBudget.toLocaleString('en-IN')]);
    }

    autoTable(doc, {
      startY: 100,
      head: [['#', 'Date', 'Payment Type', 'Total Budget', 'Amount Received', 'Remaining Amount']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: darkBlue,
        textColor: white,
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center'
      },
      bodyStyles: { fontSize: 8, textColor: dark },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 28 },
        2: { cellWidth: 28 },
        3: { halign: 'right' },
        4: { halign: 'right', textColor: [16, 185, 129] },
        5: { halign: 'right', textColor: totalRemaining > 0 ? [239, 68, 68] : [16, 185, 129] }
      },
      margin: { left: 12, right: 12 }
    });

    // ── Summary Box ──
    const finalY = doc.lastAutoTable.finalY + 8;
    const summaryH = 42;

    // Orange background summary
    doc.setFillColor(...orange);
    doc.roundedRect(12, finalY, pageW - 24, summaryH, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...white);
    doc.text('FINANCIAL SUMMARY', 18, finalY + 9);

    // Summary grid (2x2)
    const summaryItems = [
      ['Total Budget',    'Rs. ' + totalBudget.toLocaleString('en-IN'),    col1,   finalY + 20],
      ['Total Collected', 'Rs. ' + totalCollected.toLocaleString('en-IN'), col1,   finalY + 32],
      ['Remaining',       'Rs. ' + totalRemaining.toLocaleString('en-IN'), col2,   finalY + 20],
      ['No. of Payments', String(projectIncomes.length),                    col2,   finalY + 32]
    ];

    doc.setFontSize(8.5);
    summaryItems.forEach(([label, val, x, y]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 230, 180);
      doc.text(label + ':', x, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...white);
      doc.text(val, x + 35, y);
    });

    // ── Signature / Declaration ──
    const sigY = finalY + summaryH + 14;
    if (sigY + 28 < pageH - 16) {
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.3);
      doc.line(12, sigY, pageW - 12, sigY);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 120);
      doc.text('This is a computer-generated bill. No signature required.', pageW / 2, sigY + 7, { align: 'center' });
      // Signature line
      doc.setDrawColor(100);
      doc.setLineWidth(0.3);
      doc.line(pageW - 60, sigY + 22, pageW - 14, sigY + 22);
      doc.setFont('helvetica', 'normal');
      doc.text('Authorised Signatory', pageW - 37, sigY + 27, { align: 'center' });
    }

    // ── Footer ──
    doc.setFillColor(...orange);
    doc.rect(0, pageH - 12, pageW, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...white);
    doc.text('Shreeram Construction | Mob: +91 7720900336 | shreeramconstruction1111@gmail.com | GST: 27CZPPG0505C1ZR', pageW / 2, pageH - 5, { align: 'center' });

    doc.save(`Site_Bill_${project.name.replace(/\s+/g, '_')}.pdf`);
  };
  // ────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return <SkeletonLoader type="table" rows={6} />;
  }

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
                          p.client.toLowerCase().includes(projectSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="projects-container">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1 className="page-title">Manage Sites / Projects</h1>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="summary-card" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}>
          <div className="summary-icon-box" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
            <Briefcase size={22} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Total Projects</h3>
            <div className="summary-value">{projects.length}</div>
          </div>
        </div>
        <div className="summary-card" style={{ backgroundColor: '#f0fdf4', borderColor: '#d1fae5' }}>
          <div className="summary-icon-box" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
            <CheckCircle size={22} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Active Sites</h3>
            <div className="summary-value">{projects.filter(p => p.status === 'Active').length}</div>
          </div>
        </div>
        <div className="summary-card" style={{ backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }}>
          <div className="summary-icon-box" style={{ backgroundColor: '#f3e8ff', color: '#8b5cf6' }}>
            <IndianRupee size={22} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Total Budget</h3>
            <div className="summary-value" style={{ color: '#8b5cf6' }}>{formatRupee(projects.reduce((sum, p) => sum + Number(p.budget || 0), 0))}</div>
          </div>
        </div>
        <div className="summary-card" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
          <div className="summary-icon-box" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
            <IndianRupee size={22} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Total Spent</h3>
            <div className="summary-value" style={{ color: 'var(--color-warning)' }}>{formatRupee(projects.reduce((sum, p) => sum + Number(p.spent || 0), 0))}</div>
          </div>
        </div>
      </div>

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onReset={() => setStatusFilter('All')}
        title="Filter Projects"
      >
        <div className="form-group">
          <label>Project Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Planning">Planning</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </FilterModal>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>All Site Projects</h3>
          <div className="action-toolbar">
            <div style={{ width: '180px' }}>
              <SearchWithSuggestions 
                value={projectSearch}
                onChange={setProjectSearch}
                placeholder="Search project..."
                suggestions={projects.map(p => p.name)}
              />
            </div>
            <div className="action-toolbar-buttons">
              <button 
                className={`btn btn-secondary ${statusFilter !== 'All' ? 'btn-filter-active' : ''}`} 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                onClick={() => setShowFilterModal(true)}
              >
                <Filter size={14} /> Filter
                {statusFilter !== 'All' && <span className="filter-badge-dot" />}
              </button>
              {statusFilter !== 'All' && (
                <button 
                  className="btn btn-secondary text-danger" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  onClick={() => setStatusFilter('All')}
                  title="Reset Filters"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
              <button 
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                onClick={() => {
                  const exportData = filteredProjects.map(p => {
                    const toRec = Math.max(0, (p.budget || 0) - (p.collected || 0));
                    return {
                      'Project ID': p.id || p._id,
                      'Project Name': p.name,
                      'Client Name': p.client,
                      'Location': p.location || '-',
                      'Status': p.status || 'Active',
                      'Start Date': p.startDate || '-',
                      'End Date': p.endDate || '-',
                      'Total Budget (Rs.)': p.budget || 0,
                      'Amount Collected (Rs.)': p.collected || 0,
                      'Amount to Receive (Rs.)': toRec,
                      'Amount Spent (Rs.)': p.spent || 0
                    };
                  });
                  exportToExcel(exportData, 'Projects_Report');
                }}
              >
                <Download size={14} /> Export Excel
              </button>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} /> New Project
              </button>
            </div>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Client</th>
                <th>Budget</th>
                <th>Collected</th>
                <th>Spent</th>
                <th>To Receive</th>
                <th>Status</th>
                <th>Added By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const toReceive = project.budget - project.collected;
                return (
                  <tr key={project.id || project._id}>
                    <td data-label="Project Name" style={{ fontWeight: 600 }}>{project.name}</td>
                    <td data-label="Client">{project.client}</td>
                    <td data-label="Budget">{formatRupee(project.budget)}</td>
                    <td data-label="Collected" className="text-success">{formatRupee(project.collected)}</td>
                    <td data-label="Spent" className="text-danger">{formatRupee(project.spent)}</td>
                    <td data-label="To Receive" style={{ color: '#FDB813' }}>{formatRupee(toReceive)}</td>
                    <td data-label="Status">
                      <span className={`badge badge-${project.status.toLowerCase().replace(' ', '-')}`}>
                        {project.status}
                      </span>
                    </td>
                    <td data-label="Added By" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{project.addedBy || '—'}</td>
                    <td data-label="Actions" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => navigate(`/projects/${project.id || project._id}`)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Download Income Bill PDF"
                        onClick={() => generateProjectBillPdf(project)}
                      >
                        <FileText size={13} /> Bill
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.45rem' }}
                        title="Edit Project"
                        onClick={() => {
                          setCurrentProject({
                            id: project.id || project._id,
                            name: project.name,
                            client: project.client,
                            budget: project.budget,
                            location: project.location || '',
                            startDate: project.startDate || '',
                            endDate: project.endDate || '',
                            status: project.status || 'Active'
                          });
                          setShowEditModal(true);
                        }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary text-danger" 
                        style={{ padding: '0.35rem 0.45rem', color: '#ef4444' }}
                        title="Delete Project"
                        onClick={() => {
                          setDeleteTarget({ id: project.id || project._id, name: project.name });
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProjects.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '1rem' }}>No projects found matching search query.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', margin: 0 }}>
                <Plus size={18} color="var(--color-info)" /> Add New Site / Project
              </h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddProject} className="modal-form">
              <div className="form-group">
                <label>Project Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Client Name</label>
                <input 
                  type="text" 
                  required 
                  list="client-suggestions"
                  value={formData.client} 
                  onChange={e => setFormData({...formData, client: e.target.value})} 
                />
                <datalist id="client-suggestions">
                  {[...new Set(projects.map(p => p.client))].map((c, i) => <option key={i} value={c} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label>Location / Site Address</label>
                <input 
                  type="text" 
                  required 
                  list="location-suggestions"
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})} 
                />
                <datalist id="location-suggestions">
                  {[...new Set(projects.map(p => p.location).filter(Boolean))].map((l, i) => <option key={i} value={l} />)}
                </datalist>
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Expected End Date</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Total Budget (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  required 
                  value={formData.budget} 
                  onChange={e => setFormData({...formData, budget: e.target.value})} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', margin: 0 }}>
                <Edit size={18} color="var(--color-info)" /> Edit Site / Project Details
              </h2>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditProject} className="modal-form">
              <div className="form-group">
                <label>Project Name</label>
                <input 
                  type="text" 
                  required 
                  value={currentProject.name} 
                  onChange={e => setCurrentProject({...currentProject, name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Client Name</label>
                <input 
                  type="text" 
                  required 
                  list="client-suggestions"
                  value={currentProject.client} 
                  onChange={e => setCurrentProject({...currentProject, client: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Location / Site Address</label>
                <input 
                  type="text" 
                  required 
                  list="location-suggestions"
                  value={currentProject.location} 
                  onChange={e => setCurrentProject({...currentProject, location: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Project Status</label>
                <select 
                  value={currentProject.status} 
                  onChange={e => setCurrentProject({...currentProject, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Planning">Planning</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    value={currentProject.startDate} 
                    onChange={e => setCurrentProject({...currentProject, startDate: e.target.value})} 
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Expected End Date</label>
                  <input 
                    type="date" 
                    value={currentProject.endDate} 
                    onChange={e => setCurrentProject({...currentProject, endDate: e.target.value})} 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Total Budget (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  required 
                  value={currentProject.budget} 
                  onChange={e => setCurrentProject({...currentProject, budget: e.target.value})} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        onConfirm={(mode) => {
          if (deleteTarget) {
            deleteProjectAction(deleteTarget.id, mode);
          }
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        entityType="Project"
        entityName={deleteTarget?.name || ''}
      />
    </div>
  );
};

export default Projects;
