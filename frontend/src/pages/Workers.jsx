import React, { useState, useMemo } from 'react';
import { 
  Users, 
  ClipboardList, 
  Search, 
  Filter, 
  Calendar, 
  Plus, 
  X,
  Briefcase,
  DollarSign,
  UserCheck,
  Edit,
  Trash2,
  Download,
  RotateCcw
} from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import { formatDate } from '../utils';
import SkeletonLoader from '../components/SkeletonLoader';
import SearchWithSuggestions from '../components/SearchWithSuggestions';
import { exportToExcel } from '../utils/exportToExcel';
import FilterModal from '../components/FilterModal';

const formatWorkerId = (id) => id ? `W-${id.toString().slice(-5).toUpperCase()}` : '';
const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

const getAmountPaid = (log) => log.amountPaid !== undefined ? log.amountPaid : (log.paymentStatus === 'Paid' ? log.wage : 0);
const getAmountPending = (log) => Math.max(0, log.wage - getAmountPaid(log));

const Workers = () => {
  const [activeTab, setActiveTab] = useState('master');
  
  const {
    workers,
    dailyLogs,
    projects,
    loading,
    addWorkerAction,
    updateWorkerAction,
    deleteWorkerAction,
    addWorkerLogAction,
    updateWorkerLogAction,
    deleteWorkerLogAction
  } = useCMS();
  
  // Modals state for Worker
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showEditWorker, setShowEditWorker] = useState(false);
  const [currentWorker, setCurrentWorker] = useState({ id: '', name: '', role: 'Helper', wage: '', contact: '', status: 'Active' });

  // Modals state for Log
  const [showAddLog, setShowAddLog] = useState(false);
  const [showEditLog, setShowEditLog] = useState(false);
  const [currentLog, setCurrentLog] = useState({ id: '', date: '', workerId: '', workerName: '', project: '', status: 'Present', workTime: 'Full Day', paymentStatus: 'Pending', amountPaid: '' });

  // Daily Log state
  const [filterDate, setFilterDate] = useState('');
  const [filterProject, setFilterProject] = useState('');

  // Worker Lookup state
  const [searchId, setSearchId] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Project Filter state
  const [project, setProject] = useState('');

  // Monthly Summary state
  const [month, setMonth] = useState('2026-05');

  // Filter states
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [showMasterFilterModal, setShowMasterFilterModal] = useState(false);
  const [showLogFilterModal, setShowLogFilterModal] = useState(false);

  // Search suggestion states for tabs
  const [masterSearch, setMasterSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [summarySearch, setSummarySearch] = useState('');

  // Summary Stats
  const stats = useMemo(() => {
    const totalWorkers = workers.length;
    const activeWorkers = workers.filter(w => w.status === 'Active').length;
    const totalWagePaid = dailyLogs.reduce((sum, log) => sum + getAmountPaid(log), 0);
    const totalWageToPay = dailyLogs.reduce((sum, log) => sum + getAmountPending(log), 0);
    return { totalWorkers, activeWorkers, totalWagePaid, totalWageToPay };
  }, [workers, dailyLogs]);

  const handleAddWorker = (e) => {
    e.preventDefault();
    if (Number(currentWorker.wage) < 0) {
      alert('Daily Wage cannot be negative.');
      return;
    }
    addWorkerAction({
      name: currentWorker.name,
      role: currentWorker.role,
      wage: Number(currentWorker.wage),
      contact: currentWorker.contact,
      status: currentWorker.status
    });
    setShowAddWorker(false);
    setCurrentWorker({ id: '', name: '', role: 'Helper', wage: '', contact: '', status: 'Active' });
  };

  const handleEditWorker = (e) => {
    e.preventDefault();
    if (Number(currentWorker.wage) < 0) {
      alert('Daily Wage cannot be negative.');
      return;
    }
    updateWorkerAction(currentWorker.id, {
      name: currentWorker.name,
      role: currentWorker.role,
      wage: Number(currentWorker.wage),
      contact: currentWorker.contact,
      status: currentWorker.status
    });
    setShowEditWorker(false);
    setCurrentWorker({ id: '', name: '', role: 'Helper', wage: '', contact: '', status: 'Active' });
  };

  const handleSaveLog = (e) => {
    e.preventDefault();
    const worker = workers.find(w => 
      (currentLog.workerId && (w.id || w._id).toString() === currentLog.workerId.toString()) ||
      (currentLog.workerName && w.name.toLowerCase() === currentLog.workerName.trim().toLowerCase())
    );
    if (!worker) {
      alert('Please select or type a valid active worker from the list.');
      return;
    }

    let wageMultiplier = 1;
    if (currentLog.workTime === 'Half Day') wageMultiplier = 0.5;
    if (currentLog.workTime === 'Overtime') wageMultiplier = 1.5;
    if (currentLog.status === 'Absent' || currentLog.status === 'Leave') wageMultiplier = 0;

    const rate = worker.dailyWage || worker.wage;
    const wage = rate * wageMultiplier;

    let paidAmt = currentLog.amountPaid === '' ? 0 : Number(currentLog.amountPaid);
    if (paidAmt < 0) {
      alert('Amount Paid cannot be negative.');
      return;
    }
    if (paidAmt > wage) {
      alert(`Amount Paid (₹${paidAmt}) cannot exceed the total calculated wage (₹${wage}).`);
      return;
    }

    let finalStatus = currentLog.paymentStatus;
    
    // Auto-resolve partial/paid/pending statuses
    if (currentLog.paymentStatus === 'Paid' && paidAmt === 0 && currentLog.amountPaid === '') {
      paidAmt = wage;
      finalStatus = 'Paid';
    } else if (paidAmt > 0 && paidAmt < wage) {
      finalStatus = 'Partial';
    } else if (paidAmt >= wage && wage > 0) {
      finalStatus = 'Paid';
    } else if (paidAmt === 0) {
      finalStatus = 'Pending';
    }

    const logEntry = {
      date: currentLog.date,
      workerId: worker.id || worker._id,
      project: currentLog.project,
      status: currentLog.status,
      workTime: currentLog.workTime,
      paymentStatus: finalStatus,
      amountPaid: paidAmt
    };

    if (showEditLog) {
      updateWorkerLogAction(currentLog.id, logEntry);
      setShowEditLog(false);
    } else {
      addWorkerLogAction(logEntry);
      setShowAddLog(false);
    }
    setCurrentLog({ id: '', date: '', workerId: '', workerName: '', project: '', status: 'Present', workTime: 'Full Day', paymentStatus: 'Pending', amountPaid: '' });
  };

  if (loading) {
    return <SkeletonLoader type="table" rows={8} />;
  }

  // Tab 1: Worker Master
  const renderWorkerMaster = () => {
    const filteredWorkers = workers.filter(w => {
      const matchesSearch = w.name.toLowerCase().includes(masterSearch.toLowerCase()) ||
                            w.role.toLowerCase().includes(masterSearch.toLowerCase());
      const matchesRole = roleFilter === 'All' || w.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || w.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });

    const isMasterFiltered = roleFilter !== 'All' || statusFilter !== 'All';

    return (
      <div className="card">
        <div className="page-header" style={{ marginBottom: '1.25rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Worker Master List</h2>
          <div className="action-toolbar">
            <div style={{ width: '180px' }}>
              <SearchWithSuggestions 
                value={masterSearch}
                onChange={setMasterSearch}
                placeholder="Search worker or role..."
                suggestions={workers.map(w => w.name)}
              />
            </div>
            <div className="action-toolbar-buttons">
              <button 
                className={`btn btn-secondary ${isMasterFiltered ? 'btn-filter-active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                onClick={() => setShowMasterFilterModal(true)}
              >
                <Filter size={14} /> Filter
                {isMasterFiltered && <span className="filter-badge-dot" />}
              </button>
              {isMasterFiltered && (
                <button 
                  className="btn btn-secondary text-danger" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  onClick={() => { setRoleFilter('All'); setStatusFilter('All'); }}
                  title="Reset Filters"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
              <button 
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                onClick={() => {
                  const exportData = filteredWorkers.map(w => ({
                    'Worker ID': formatWorkerId(w.id || w._id),
                    'Name': w.name,
                    'Role': w.role,
                    'Daily Rate (₹)': w.dailyWage || w.wage,
                    'Contact': w.contactInfo || w.contact || '-',
                    'Status': w.status
                  }));
                  exportToExcel(exportData, 'Workers_Master_Report');
                }}
              >
                <Download size={14} /> Export Excel
              </button>
              <button className="btn btn-primary" onClick={() => {
                setCurrentWorker({ id: '', name: '', role: 'Helper', wage: '', contact: '', status: 'Active' });
                setShowAddWorker(true);
              }}>
                <Plus size={16} /> Add Worker
              </button>
            </div>
          </div>
        </div>

        <FilterModal
          isOpen={showMasterFilterModal}
          onClose={() => setShowMasterFilterModal(false)}
          onReset={() => {
            setRoleFilter('All');
            setStatusFilter('All');
          }}
          title="Filter Worker Master"
        >
          <div className="form-group">
            <label>Worker Role</label>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="Foreman">Foreman</option>
              <option value="Mason">Mason</option>
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="Helper">Helper</option>
            </select>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </FilterModal>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Daily Rate</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map(worker => (
                <tr key={worker.id || worker._id}>
                  <td data-label="ID">{formatWorkerId(worker.id || worker._id)}</td>
                  <td data-label="Name" style={{ fontWeight: 600 }}>{worker.name}</td>
                  <td data-label="Role">{worker.role}</td>
                  <td data-label="Daily Rate">{formatCurrency(worker.wage)}/day</td>
                  <td data-label="Contact">{worker.contact}</td>
                  <td data-label="Status">
                    <span className={`badge ${worker.status === 'Active' ? 'badge-active' : 'badge-completed'}`}>
                      {worker.status}
                    </span>
                  </td>
                  <td data-label="Actions" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.35rem 0.45rem' }} 
                      title="Edit Worker"
                      onClick={() => {
                        setCurrentWorker(worker);
                        setShowEditWorker(true);
                      }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="btn btn-secondary text-danger" 
                      style={{ padding: '0.35rem 0.45rem', color: '#ef4444' }} 
                      title="Delete Worker"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete worker "${worker.name}"? This will delete all attendance logs for this worker.`)) {
                          deleteWorkerAction(worker.id || worker._id);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredWorkers.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '1rem' }}>No workers found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDailyLog = () => {
    const filteredLogs = dailyLogs.filter(log => {
      const matchesDate = filterDate === '' || log.date === filterDate;
      const matchesProject = filterProject === '' || log.project === filterProject;
      const matchesSearch = logSearch === '' || log.name.toLowerCase().includes(logSearch.toLowerCase());
      const matchesPayment = paymentStatusFilter === 'All' || log.paymentStatus === paymentStatusFilter;
      return matchesDate && matchesProject && matchesSearch && matchesPayment;
    });

    const isLogFiltered = filterDate !== '' || filterProject !== '' || paymentStatusFilter !== 'All';

    return (
      <div className="card">
        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Daily Attendance Logs</h2>
          <div className="action-toolbar">
            <div style={{ width: '180px' }}>
              <SearchWithSuggestions 
                value={logSearch}
                onChange={setLogSearch}
                placeholder="Search by worker..."
                suggestions={workers.map(w => w.name)}
              />
            </div>
            <div className="action-toolbar-buttons">
              <button 
                className={`btn btn-secondary ${isLogFiltered ? 'btn-filter-active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                onClick={() => setShowLogFilterModal(true)}
              >
                <Filter size={14} /> Filter
                {isLogFiltered && <span className="filter-badge-dot" />}
              </button>
              {isLogFiltered && (
                <button 
                  className="btn btn-secondary text-danger" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  onClick={() => { setFilterDate(''); setFilterProject(''); setPaymentStatusFilter('All'); }}
                  title="Reset Filters"
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
              <button 
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                onClick={() => {
                  const exportData = filteredLogs.map(log => ({
                    'Date': formatDate(log.date),
                    'Worker Name': log.name,
                    'Project': log.project || '-',
                    'Attendance Status': log.status,
                    'Work Time': log.workTime,
                    'Daily Rate (₹)': log.rate || log.wageAtTime,
                    'Calculated Wage (₹)': log.wage || log.wageAtTime,
                    'Paid (₹)': getAmountPaid(log),
                    'Pending (₹)': getAmountPending(log),
                    'Payment Status': log.paymentStatus
                  }));
                  exportToExcel(exportData, 'Daily_Attendance_Logs');
                }}
              >
                <Download size={14} /> Export Excel
              </button>
              <button className="btn btn-primary" onClick={() => {
                setCurrentLog({ id: '', date: '', workerId: '', workerName: '', project: '', status: 'Present', workTime: 'Full Day', paymentStatus: 'Pending', amountPaid: '' });
                setShowAddLog(true);
              }}>
                <Plus size={16} /> Add New Data
              </button>
            </div>
          </div>
        </div>

        <FilterModal
          isOpen={showLogFilterModal}
          onClose={() => setShowLogFilterModal(false)}
          onReset={() => {
            setFilterDate('');
            setFilterProject('');
            setPaymentStatusFilter('All');
          }}
          title="Filter Daily Attendance Logs"
        >
          <div className="form-group">
            <label>Filter Date</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Project Site</label>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id || p._id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Payment Status</label>
            <select value={paymentStatusFilter} onChange={e => setPaymentStatusFilter(e.target.value)}>
              <option value="All">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
        </FilterModal>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Worker</th>
                <th>Project</th>
                <th>Status</th>
                <th>Time</th>
                <th>Rate</th>
                <th>Calculated Wage</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td data-label="Date">{formatDate(log.date)}</td>
                  <td data-label="Worker">
                    <div style={{ fontWeight: 600 }}>{log.name} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({formatWorkerId(log.workerId)})</span></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{log.role}</div>
                  </td>
                  <td data-label="Project">{log.project}</td>
                  <td data-label="Status">
                    <span className={`badge ${log.status === 'Present' ? 'badge-active' : 'badge-danger'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td data-label="Time">{log.workTime}</td>
                  <td data-label="Rate">{formatCurrency(log.rate)}</td>
                  <td data-label="Calculated Wage" style={{ fontWeight: 600 }}>{formatCurrency(log.wage)}</td>
                  <td data-label="Paid" style={{ color: 'var(--color-success)', fontWeight: 500 }}>{formatCurrency(getAmountPaid(log))}</td>
                  <td data-label="Pending" style={{ color: 'var(--color-danger)', fontWeight: 500 }}>{formatCurrency(getAmountPending(log))}</td>
                  <td data-label="Payment Status">
                    <span className={`badge ${log.paymentStatus === 'Paid' ? 'badge-active' : log.paymentStatus === 'Partial' ? 'badge-planning' : 'badge-pending'}`}>
                      {log.paymentStatus}
                    </span>
                  </td>
                  <td data-label="Actions" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.35rem 0.45rem' }} 
                      title="Edit Attendance Log"
                      onClick={() => {
                        const w = workers.find(work => (work.id || work._id).toString() === (log.workerId || log.worker || '').toString());
                        setCurrentLog({ ...log, workerName: log.name || (w ? w.name : ''), workerId: log.workerId || (w ? w.id || w._id : ''), amountPaid: getAmountPaid(log) });
                        setShowEditLog(true);
                      }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="btn btn-secondary text-danger" 
                      style={{ padding: '0.35rem 0.45rem', color: '#ef4444' }} 
                      title="Delete Attendance Log"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this attendance log?")) {
                          deleteWorkerLogAction(log.id || log._id);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No logs found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Tab 3: Worker Lookup
  const renderWorkerLookup = () => {
    const handleSearch = () => {
      const w = workers.find(w => 
        w.name.toLowerCase().includes(searchId.toLowerCase()) || 
        formatWorkerId(w.id || w._id).toLowerCase() === searchId.toLowerCase() || 
        String(w.id || w._id).toLowerCase() === searchId.toLowerCase()
      );
      setSelectedWorker(w || null);
    };

    const workerLogs = selectedWorker ? dailyLogs.filter(l => (l.workerId || '').toString() === (selectedWorker.id || selectedWorker._id || '').toString()) : [];
    const totalDays = workerLogs.filter(l => l.status === 'Present').reduce((sum, l) => sum + (l.workTime === 'Full Day' ? 1 : l.workTime === 'Half Day' ? 0.5 : l.workTime === 'Overtime' ? 1.5 : 0), 0);
    const totalEarnings = workerLogs.reduce((sum, l) => sum + l.wage, 0);
    const wagePaid = workerLogs.reduce((sum, l) => sum + getAmountPaid(l), 0);
    const remainingWage = workerLogs.reduce((sum, l) => sum + getAmountPending(l), 0);

    return (
      <div className="card">
        <h2 className="card-title">Worker Lookup</h2>
        <div className="labour-filter-bar" style={{ marginBottom: '2rem' }}>
          <Search size={18} color="var(--color-text-muted)" />
          <div style={{ width: '300px' }}>
            <SearchWithSuggestions 
              value={searchId}
              onChange={setSearchId}
              placeholder="Search by ID (e.g. W001) or Name..."
              suggestions={workers.map(w => w.name)}
              onSelect={(name) => {
                setSearchId(name);
                const w = workers.find(w => w.name.toLowerCase() === name.toLowerCase());
                setSelectedWorker(w || null);
              }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        </div>

        {selectedWorker && (
          <>
            <div className="worker-profile-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="worker-profile-avatar">
                  {selectedWorker.name.charAt(0)}
                </div>
                <div className="worker-profile-details">
                  <div className="detail-group">
                    <span className="detail-label">Worker ID</span>
                    <span className="detail-value">{formatWorkerId(selectedWorker.id || selectedWorker._id)}</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Full Name</span>
                    <span className="detail-value">{selectedWorker.name}</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Role & Rate</span>
                    <span className="detail-value">{selectedWorker.role} - {formatCurrency(selectedWorker.wage)}/day</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Status</span>
                    <span className={`badge ${selectedWorker.status === 'Active' ? 'badge-active' : 'badge-completed'}`} style={{ width: 'fit-content' }}>
                      {selectedWorker.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', margin: 0, gap: '1rem' }}>
                <div className="summary-card" style={{ padding: '1rem', marginBottom: 0, backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}>
                  <div className="summary-content">
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Days</h4>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{totalDays}</div>
                  </div>
                </div>
                <div className="summary-card" style={{ padding: '1rem', marginBottom: 0, backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
                  <div className="summary-content">
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Earnings</h4>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{formatCurrency(totalEarnings)}</div>
                  </div>
                </div>
                <div className="summary-card" style={{ padding: '1rem', marginBottom: 0, backgroundColor: '#f0fdf4', borderColor: '#d1fae5' }}>
                  <div className="summary-content">
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Wage Paid</h4>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{formatCurrency(wagePaid)}</div>
                  </div>
                </div>
                <div className="summary-card" style={{ padding: '1rem', marginBottom: 0, backgroundColor: '#fef2f2', borderColor: '#fee2e2' }}>
                  <div className="summary-content">
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Remaining Wage</h4>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>{formatCurrency(remainingWage)}</div>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '2rem' }}>Work History</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Time Worked</th>
                    <th>Wage</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workerLogs.map(log => (
                    <tr key={log.id}>
                      <td data-label="Date">{formatDate(log.date)}</td>
                      <td data-label="Project">{log.project}</td>
                      <td data-label="Time Worked">{log.workTime}</td>
                      <td data-label="Wage" style={{ fontWeight: 600 }}>{formatCurrency(log.wage)}</td>
                      <td data-label="Paid" style={{ color: 'var(--color-success)' }}>{formatCurrency(getAmountPaid(log))}</td>
                      <td data-label="Pending" style={{ color: 'var(--color-danger)' }}>{formatCurrency(getAmountPending(log))}</td>
                      <td data-label="Status">
                        <span className={`badge ${log.paymentStatus === 'Paid' ? 'badge-active' : log.paymentStatus === 'Partial' ? 'badge-planning' : 'badge-pending'}`}>
                          {log.paymentStatus}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => {
                          setCurrentLog({ ...log, amountPaid: getAmountPaid(log) });
                          setShowEditLog(true);
                        }}>
                          <Edit size={14} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {workerLogs.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '1rem' }}>No history found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  // Tab 4: Project Filter
  const renderProjectFilter = () => {
    const selectedProj = projects.find(p => p.name === project);
    const projectLogs = project 
      ? dailyLogs.filter(l => 
          l.project === project && 
          (projectSearch === '' || l.name.toLowerCase().includes(projectSearch.toLowerCase()))
        ) 
      : [];
    
    const totalDays = projectLogs.filter(l => l.status === 'Present').reduce((sum, l) => sum + (l.workTime === 'Full Day' ? 1 : l.workTime === 'Half Day' ? 0.5 : l.workTime === 'Overtime' ? 1.5 : 0), 0);
    const uniqueWorkers = new Set(projectLogs.map(l => l.workerId)).size;
    const totalWage = projectLogs.reduce((sum, log) => sum + log.wage, 0);
    const wagePaid = projectLogs.reduce((sum, log) => sum + getAmountPaid(log), 0);
    const wageToPay = projectLogs.reduce((sum, log) => sum + getAmountPending(log), 0);

    return (
      <div className="card">
        <h2 className="card-title">Project Labour Cost</h2>
        <div className="labour-filter-bar">
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Briefcase size={18} color="var(--color-text-muted)" />
            <select value={project} onChange={e => setProject(e.target.value)}>
              <option value="">Select a Project...</option>
              {projects.map(p => <option key={p.id || p._id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          {project && (
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', width: '250px'}}>
              <Search size={18} color="var(--color-text-muted)" />
              <SearchWithSuggestions 
                value={projectSearch}
                onChange={setProjectSearch}
                placeholder="Search by worker name..."
                suggestions={workers.map(w => w.name)}
              />
            </div>
          )}
        </div>

        {project && selectedProj && (
          <>
            <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--color-bg-base)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedProj.name}</h3>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Project ID: PRJ-{String(selectedProj.id || selectedProj._id || '').slice(-3).padStart(3, '0')}</div>
                </div>
                <span className={`badge ${selectedProj.status === 'Active' ? 'badge-active' : 'badge-completed'}`}>
                  {selectedProj.status}
                </span>
              </div>
              
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: 0 }}>
                 <div className="summary-card" style={{ padding: '1rem', marginBottom: 0, backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}>
                  <div className="summary-content">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Total Days</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{totalDays}</div>
                  </div>
                </div>
                <div className="summary-card" style={{ padding: '1rem', marginBottom: 0, backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }}>
                  <div className="summary-content">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Total Workers</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{uniqueWorkers}</div>
                  </div>
                </div>
                <div className="summary-card" style={{ padding: '1rem', marginBottom: 0, backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
                  <div className="summary-content">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Total Wage</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(totalWage)}</div>
                  </div>
                </div>
                <div className="summary-card" style={{ padding: '1rem', marginBottom: 0, backgroundColor: '#f0fdf4', borderColor: '#d1fae5' }}>
                  <div className="summary-content">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Wage Paid</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{formatCurrency(wagePaid)}</div>
                  </div>
                </div>
                <div className="summary-card" style={{ padding: '1rem', marginBottom: 0, backgroundColor: '#fef2f2', borderColor: '#fee2e2' }}>
                  <div className="summary-content">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Wage to Pay</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>{formatCurrency(wageToPay)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="table-container" style={{ marginTop: '1.5rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Worker Name</th>
                    <th>Time Worked</th>
                    <th>Wage Incurred</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projectLogs.sort((a, b) => new Date(a.date) - new Date(b.date)).map(log => (
                    <tr key={log.id || log._id}>
                      <td data-label="Date">{formatDate(log.date)}</td>
                      <td data-label="Worker">
                        <div style={{ fontWeight: 600 }}>{log.name} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({formatWorkerId(log.workerId)})</span></div>
                      </td>
                      <td data-label="Time Worked">{log.workTime}</td>
                      <td data-label="Wage Incurred" style={{ fontWeight: 600 }}>{formatCurrency(log.wage)}</td>
                      <td data-label="Paid" style={{ color: 'var(--color-success)' }}>{formatCurrency(getAmountPaid(log))}</td>
                      <td data-label="Pending" style={{ color: 'var(--color-danger)' }}>{formatCurrency(getAmountPending(log))}</td>
                      <td data-label="Status">
                        <span className={`badge ${log.paymentStatus === 'Paid' ? 'badge-active' : log.paymentStatus === 'Partial' ? 'badge-planning' : 'badge-pending'}`}>
                          {log.paymentStatus}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => {
                          setCurrentLog({ ...log, amountPaid: getAmountPaid(log) });
                          setShowEditLog(true);
                        }}>
                          <Edit size={14} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {projectLogs.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '1rem' }}>No logs for this project.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  // Tab 5: Monthly Summary
  const renderMonthlySummary = () => {
    // Group logs by worker ID for the selected month
    const monthlyLogs = dailyLogs.filter(l => l.month === month);
    const summaryMap = {};
    
    monthlyLogs.forEach(log => {
      if (!summaryMap[log.workerId]) {
        summaryMap[log.workerId] = {
          id: log.workerId,
          name: log.name,
          role: log.role,
          daysWorked: 0,
          totalWage: 0,
          wagePaid: 0,
          wagePending: 0
        };
      }
      if (log.status === 'Present') {
        summaryMap[log.workerId].daysWorked += (log.workTime === 'Full Day' ? 1 : log.workTime === 'Half Day' ? 0.5 : log.workTime === 'Overtime' ? 1.5 : 0);
      }
      summaryMap[log.workerId].totalWage += log.wage;
      summaryMap[log.workerId].wagePaid += getAmountPaid(log);
      summaryMap[log.workerId].wagePending += getAmountPending(log);
    });

    const summaryData = Object.values(summaryMap).filter(data => 
      summarySearch === '' || data.name.toLowerCase().includes(summarySearch.toLowerCase())
    );

    return (
      <div className="card">
        <h2 className="card-title">Monthly Summary</h2>
        <div className="labour-filter-bar">
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Calendar size={18} color="var(--color-text-muted)" />
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', width: '250px'}}>
            <Search size={18} color="var(--color-text-muted)" />
            <SearchWithSuggestions 
              value={summarySearch}
              onChange={setSummarySearch}
              placeholder="Search by worker name..."
              suggestions={workers.map(w => w.name)}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Worker ID</th>
                <th>Name</th>
                <th>Total Days Worked</th>
                <th>Total Earned</th>
                <th>Paid</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map(data => (
                <tr key={data.id}>
                  <td data-label="Worker ID">{formatWorkerId(data.id)}</td>
                  <td data-label="Name" style={{ fontWeight: 600 }}>{data.name}</td>
                  <td data-label="Total Days Worked">{data.daysWorked} Days</td>
                  <td data-label="Total Earned" style={{ fontWeight: 600 }}>{formatCurrency(data.totalWage)}</td>
                  <td data-label="Paid" style={{ color: 'var(--color-success)' }}>{formatCurrency(data.wagePaid)}</td>
                  <td data-label="Pending" style={{ color: 'var(--color-danger)' }}>{formatCurrency(data.wagePending)}</td>
                </tr>
              ))}
              {summaryData.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No records for this month.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><h3>Loading Labour Data...</h3></div>;
  }

  return (
    <div className="labour-dashboard">
      <div className="page-header" style={{ marginBottom: '0.5rem' }}>
        <h1 className="page-title">Labour Management</h1>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid">
        <div className="summary-card" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}>
          <div className="summary-icon-box" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
            <Users size={24} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Total Workers</h3>
            <div className="summary-value">{stats.totalWorkers}</div>
          </div>
        </div>
        <div className="summary-card" style={{ backgroundColor: '#f0fdf4', borderColor: '#d1fae5' }}>
          <div className="summary-icon-box" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
            <UserCheck size={24} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Active Workers</h3>
            <div className="summary-value">{stats.activeWorkers}</div>
          </div>
        </div>
        <div className="summary-card" style={{ backgroundColor: '#f0fdf4', borderColor: '#d1fae5' }}>
          <div className="summary-icon-box" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
            <DollarSign size={24} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Total Wage Paid</h3>
            <div className="summary-value">{formatCurrency(stats.totalWagePaid)}</div>
          </div>
        </div>
        <div className="summary-card" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
          <div className="summary-icon-box" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
            <DollarSign size={24} />
          </div>
          <div className="summary-content">
            <h3 className="summary-title">Total Wage to Pay</h3>
            <div className="summary-value">{formatCurrency(stats.totalWageToPay)}</div>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="labour-nav-pills">
        <button className={`nav-pill ${activeTab === 'master' ? 'active' : ''}`} onClick={() => setActiveTab('master')}>
          <Users size={16} /> Worker Master
        </button>
        <button className={`nav-pill ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <ClipboardList size={16} /> Daily Log
        </button>
        <button className={`nav-pill ${activeTab === 'lookup' ? 'active' : ''}`} onClick={() => setActiveTab('lookup')}>
          <Search size={16} /> Worker Lookup
        </button>
        <button className={`nav-pill ${activeTab === 'project' ? 'active' : ''}`} onClick={() => setActiveTab('project')}>
          <Filter size={16} /> Project Filter
        </button>
        <button className={`nav-pill ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          <Calendar size={16} /> Monthly Summary
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'master' && renderWorkerMaster()}
        {activeTab === 'logs' && renderDailyLog()}
        {activeTab === 'lookup' && renderWorkerLookup()}
        {activeTab === 'project' && renderProjectFilter()}
        {activeTab === 'summary' && renderMonthlySummary()}
      </div>

      {/* Modals rendered globally to be accessible from any tab */}
      {(showAddWorker || showEditWorker) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', margin: 0 }}>
                {showEditWorker ? <><Edit size={18} color="var(--color-info)" /> Edit Worker Details</> : <><Plus size={18} color="var(--color-info)" /> Add New Worker</>}
              </h2>
              <button className="btn-close" onClick={() => {
                setShowAddWorker(false);
                setShowEditWorker(false);
              }}>
                <X size={18} />
              </button>
            </div>
            <form className="modal-form" onSubmit={showEditWorker ? handleEditWorker : handleAddWorker}>
              <div className="form-group">
                <label>Full Name</label>
                <input required type="text" value={currentWorker.name} onChange={e => setCurrentWorker({...currentWorker, name: e.target.value})} placeholder="e.g. Rajesh Kumar" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={currentWorker.role} onChange={e => setCurrentWorker({...currentWorker, role: e.target.value})}>
                  <option value="Foreman">Foreman</option>
                  <option value="Mason">Mason</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Helper">Helper</option>
                </select>
              </div>
              <div className="form-group">
                <label>Daily Wage (₹)</label>
                <input required type="number" min="0" value={currentWorker.wage} onChange={e => setCurrentWorker({...currentWorker, wage: e.target.value})} placeholder="e.g. 1000" />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input required type="text" value={currentWorker.contact} onChange={e => setCurrentWorker({...currentWorker, contact: e.target.value})} placeholder="e.g. 9876543210" />
              </div>
              {showEditWorker && (
                <div className="form-group">
                  <label>Status</label>
                  <select value={currentWorker.status} onChange={e => setCurrentWorker({...currentWorker, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAddWorker(false);
                  setShowEditWorker(false);
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{showEditWorker ? 'Save Changes' : 'Save Worker'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(showAddLog || showEditLog) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', margin: 0 }}>
                {showEditLog ? <><Edit size={18} color="var(--color-info)" /> Edit Daily Attendance Log</> : <><Plus size={18} color="var(--color-info)" /> Add Daily Attendance Log</>}
              </h2>
              <button className="btn-close" onClick={() => {
                setShowAddLog(false);
                setShowEditLog(false);
              }}>
                <X size={18} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSaveLog}>
              <div className="form-group">
                <label>Labour Name</label>
                <input 
                  required 
                  type="text" 
                  list="daily-log-workers-list"
                  value={currentLog.workerName || ''} 
                  onChange={e => {
                    const val = e.target.value;
                    const found = workers.find(w => 
                      w.name.toLowerCase() === val.toLowerCase() || 
                      `${w.name} (${formatWorkerId(w.id || w._id)})`.toLowerCase() === val.toLowerCase()
                    );
                    setCurrentLog({
                      ...currentLog,
                      workerName: val,
                      workerId: found ? (found.id || found._id) : currentLog.workerId
                    });
                  }} 
                  placeholder="Type to search or select labour name..." 
                />
                <datalist id="daily-log-workers-list">
                  {workers.filter(w => w.status === 'Active' || (currentLog.workerId && (w.id || w._id).toString() === currentLog.workerId.toString())).map((w, i) => (
                    <option key={i} value={w.name}>{formatWorkerId(w.id || w._id)} - {w.role} (Daily Wage: ₹{w.dailyWage || w.wage})</option>
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input required type="date" value={currentLog.date} onChange={e => setCurrentLog({...currentLog, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Project Name</label>
                <input required type="text" list="worker-project-list" value={currentLog.project} onChange={e => setCurrentLog({...currentLog, project: e.target.value})} placeholder="Type or select project..." />
                <datalist id="worker-project-list">
                  {projects.map((p, i) => <option key={i} value={p.name} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label>Attendance Status</label>
                <select value={currentLog.status} onChange={e => setCurrentLog({...currentLog, status: e.target.value})}>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              {currentLog.status === 'Present' && (
                <div className="form-group">
                  <label>Work Time</label>
                  <select value={currentLog.workTime} onChange={e => setCurrentLog({...currentLog, workTime: e.target.value})}>
                    <option value="Full Day">Full Day</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Overtime">Overtime</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Payment Status</label>
                <select value={currentLog.paymentStatus} onChange={e => setCurrentLog({...currentLog, paymentStatus: e.target.value})}>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount Paid (₹)</label>
                <input type="number" min="0" value={currentLog.amountPaid} onChange={e => setCurrentLog({...currentLog, amountPaid: e.target.value})} placeholder="Enter amount paid (optional)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Leave empty to auto-calculate based on Payment Status. Cannot exceed total wage.
                </span>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAddLog(false);
                  setShowEditLog(false);
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{showEditLog ? 'Save Changes' : 'Save Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;
