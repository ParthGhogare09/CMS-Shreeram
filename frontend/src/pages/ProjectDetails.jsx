import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Edit, Trash2 } from 'lucide-react';
import { getProjectDetails } from '../api';
import { useCMS } from '../context/CMSContext';
import { MOCK_PROJECTS, PROJECT_LOGS } from '../mockData';
import { formatDate } from '../utils';
import SkeletonLoader from '../components/SkeletonLoader';
import SearchWithSuggestions from '../components/SearchWithSuggestions';

const formatRupee = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = id;
  
  const { 
    materials,
    addProjectLogAction,
    updateProjectAction,
    deleteWorkerLogAction,
    deleteMaterialUsageAction,
    deleteFinanceAction
  } = useCMS();
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProject, setCurrentProject] = useState({ id: '', name: '', client: '', budget: '', location: '', startDate: '', endDate: '', status: 'Active' });
  const [project, setProject] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [entryType, setEntryType] = useState('Labor'); // Labor, Material, Transportation, Rental, Miscellaneous
  const [formData, setFormData] = useState({ 
    name: '', role: '', cost: '', quantity: '', unit: 'Units', days: '', date: new Date().toISOString().split('T')[0],
    amountPaid: '', distributionRate: ''
  });

  // Search states
  const [laborSearch, setLaborSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');

  const fetchProjectDetails = () => {
    getProjectDetails(projectId)
      .then(res => {
        setProject(res.data);
        setLogs(res.data.logs || []);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Backend offline, loading mock details for project:', err.message);
        const fallbackProject = MOCK_PROJECTS.find(p => p.id.toString() === projectId.toString() || p._id?.toString() === projectId.toString());
        setProject(fallbackProject || null);
        setLogs(PROJECT_LOGS.filter(log => log.projectId.toString() === projectId.toString()));
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  if (loading) {
    return <SkeletonLoader type="detail" />;
  }

  if (!project) {
    return <div className="page-header"><h1 className="page-title text-danger">Project Not Found</h1></div>;
  }

  const handleAddData = (e) => {
    e.preventDefault();

    if (entryType === 'Material') {
      const selectedMat = materials.find(m => m.name.toLowerCase() === formData.name.trim().toLowerCase());
      const stockAvailable = selectedMat ? selectedMat.stock : 0;
      const requestedQty = Number(formData.quantity) || 0;

      if (!selectedMat || stockAvailable <= 0) {
        alert(`Material "${formData.name}" is out of stock (Available: 0). Please add stock in Material Management first before logging usage.`);
        return;
      }

      if (requestedQty > stockAvailable) {
        alert(`Insufficient stock for "${formData.name}". Available stock is ${stockAvailable} ${selectedMat.unit}, but you requested ${requestedQty}.`);
        return;
      }
    }

    const costNum = Number(formData.cost);
    
    // For Material & Misc, total cost might be quantity * distributionRate
    let finalCost = costNum;
    if ((entryType === 'Material' || entryType === 'Miscellaneous') && formData.distributionRate && formData.quantity) {
       finalCost = Number(formData.distributionRate) * Number(formData.quantity);
    } else if (entryType === 'Miscellaneous' && !formData.quantity) {
       finalCost = costNum; // Direct cost for Misc
    }

    const newLog = {
      projectId,
      type: entryType,
      name: formData.name,
      cost: finalCost,
      date: formData.date,
      ...(entryType === 'Labor' && { role: formData.role, days: Number(formData.days), amountPaid: formData.amountPaid === '' ? finalCost : Number(formData.amountPaid) }),
      ...(entryType === 'Material' && { quantity: Number(formData.quantity), unit: formData.unit, distributionRate: Number(formData.distributionRate || 0) }),
      ...(entryType === 'Miscellaneous' && { quantity: Number(formData.quantity || 1), unit: formData.unit || 'Lumpsum', distributionRate: Number(formData.distributionRate || costNum) }),
      ...(entryType === 'Rental' && { days: Number(formData.days) }),
    };
    
    addProjectLogAction(projectId, newLog)
      .then(() => {
        fetchProjectDetails();
        setShowModal(false);
        setFormData({ name: '', role: '', cost: '', quantity: '', unit: 'Units', days: '', date: new Date().toISOString().split('T')[0], amountPaid: '', distributionRate: '' });
      });
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
    updateProjectAction(currentProject.id, updatedProj).then(() => {
      fetchProjectDetails();
      setShowEditModal(false);
    });
  };

  const rawLaborLogs = logs.filter(l => {
    if (l.type !== 'Labor') return false;
    const nameLower = (l.name || '').toLowerCase();
    if (nameLower.startsWith('labor wage') || nameLower.includes('labor wage:') || nameLower.includes('labor payout')) {
      return false;
    }
    return true;
  });
  const seenLabor = new Set();
  const laborLogs = [];
  for (const log of rawLaborLogs) {
    const key = `${(log.name || '').toLowerCase()}_${log.date}`;
    if (!seenLabor.has(key)) {
      seenLabor.add(key);
      laborLogs.push(log);
    }
  }
  const materialLogs = logs.filter(l => l.type === 'Material' || l.type === 'Miscellaneous');
  const otherLogs = logs.filter(l => l.type === 'Transportation' || l.type === 'Rental');

  const filteredLaborLogs = laborLogs.filter(log => 
    log.name.toLowerCase().includes(laborSearch.toLowerCase())
  );

  const filteredMaterialLogs = materialLogs.filter(log => 
    log.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  // Aggregating spent stats based on local logs
  const laborSpent = laborLogs.reduce((acc, curr) => acc + curr.cost, 0);
  const materialSpent = materialLogs.reduce((acc, curr) => acc + curr.cost, 0);
  const otherSpent = otherLogs.reduce((acc, curr) => acc + curr.cost, 0);
  const totalLocalSpent = laborSpent + materialSpent + otherSpent;
  
  // Calculate unique working days from labor logs
  const workingDays = new Set(laborLogs.map(l => l.date)).size;
  const toReceive = project.budget - (project.collected || 0);

  return (
    <div className="project-details-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-close" onClick={() => navigate('/projects')} style={{ background: 'var(--color-bg-surface)', padding: '0.5rem', borderRadius: '50%' }}>
            <ArrowLeft size={20} color="#fff" />
          </button>
          <h1 className="page-title">{project.name} <span style={{fontSize:'1rem', color:'#A0A0A0'}}>({project.client})</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => {
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
          }}>
            <Edit size={16} /> Edit Project
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Data
          </button>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="card stat-card" style={{ backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }}>
          <div className="stat-content">
            <h3>Budget</h3>
            <div className="value">{formatRupee(project.budget)}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#f0fdf4', borderColor: '#d1fae5' }}>
          <div className="stat-content">
            <h3>Amount Received</h3>
            <div className="value text-success">{formatRupee(project.collected || 0)}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#fef2f2', borderColor: '#fee2e2' }}>
          <div className="stat-content">
            <h3>Amount Spent</h3>
            <div className="value text-danger">{formatRupee(totalLocalSpent)}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
          <div className="stat-content">
            <h3>Amount to Receive</h3>
            <div className="value" style={{ color: '#FDB813' }}>{formatRupee(toReceive)}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}>
          <div className="stat-content">
            <h3>Labour Cost</h3>
            <div className="value">{formatRupee(laborSpent)}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}>
          <div className="stat-content">
            <h3>Material & Misc Cost</h3>
            <div className="value">{formatRupee(materialSpent)}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }}>
          <div className="stat-content">
            <h3>Working Days</h3>
            <div className="value" style={{ color: '#8b5cf6' }}>{workingDays}</div>
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ marginTop: '2rem', gridTemplateColumns: '1fr' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Labour Details</h3>
            <div style={{ width: '220px' }}>
              <SearchWithSuggestions 
                value={laborSearch}
                onChange={setLaborSearch}
                placeholder="Search worker..."
                suggestions={laborLogs.map(l => l.name)}
              />
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Worker Name</th>
                  <th>Time Worked</th>
                  <th>Wage Incurred (₹)</th>
                  <th>Paid (₹)</th>
                  <th>Pending (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLaborLogs.map((log) => {
                  const paid = log.amountPaid ?? log.cost;
                  const pending = log.cost - paid;
                  const status = pending <= 0 ? 'Paid' : 'Pending';
                  return (
                    <tr key={log.id || log._id}>
                      <td data-label="Date">{formatDate(log.date)}</td>
                      <td data-label="Worker Name" style={{ fontWeight: 600 }}>{log.name}</td>
                      <td data-label="Time Worked">{log.days || 1} Days</td>
                      <td data-label="Wage Incurred" className="text-danger">{formatRupee(log.cost)}</td>
                      <td data-label="Paid" className="text-success">{formatRupee(paid)}</td>
                      <td data-label="Pending" className="text-danger">{formatRupee(pending)}</td>
                      <td data-label="Status">
                        <span className={`badge ${status === 'Paid' ? 'badge-active' : 'badge-pending'}`}>
                          {status}
                        </span>
                      </td>
                      <td data-label="Actions" style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                          <Edit size={14} /> Edit
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this labor entry?")) {
                              deleteWorkerLogAction(log.id || log._id).then(() => fetchProjectDetails());
                            }
                          }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredLaborLogs.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: '1rem' }}>No labor found matching search query.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Material & Miscellaneous Usage</h3>
            <div style={{ width: '220px' }}>
              <SearchWithSuggestions 
                value={materialSearch}
                onChange={setMaterialSearch}
                placeholder="Search item..."
                suggestions={materialLogs.map(l => l.name)}
              />
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Material / Item</th>
                  <th>Quantity Distributed</th>
                  <th>Unit</th>
                  <th>Distribution Rate (₹)</th>
                  <th>Total Distributed Amount (₹)</th>
                  <th>Date of Distribution</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterialLogs.map((log) => {
                  // Fallback for older mock data
                  const qty = log.quantity || 1;
                  const unit = log.unit || (log.quantity && typeof log.quantity === 'string' ? log.quantity.replace(/[0-9.]/g, '').trim() : 'Units');
                  const numericQty = parseFloat(qty) || 1;
                  const rate = log.distributionRate ?? (log.cost / numericQty);

                  return (
                    <tr key={log.id || log._id}>
                      <td data-label="Log ID">L{String(log.id || log._id || '').slice(-3).padStart(3, '0')}</td>
                      <td data-label="Material" style={{ fontWeight: 600 }}>
                        {log.name} {log.type === 'Miscellaneous' ? <span style={{fontSize:'0.8rem', color:'#f59e0b'}}>(Misc)</span> : ''}
                      </td>
                      <td data-label="Quantity Distributed">{parseFloat(qty)}</td>
                      <td data-label="Unit">{unit}</td>
                      <td data-label="Distribution Rate">{formatRupee(rate)}</td>
                      <td data-label="Total Distributed Amount" className="text-danger" style={{ fontWeight: 600 }}>{formatRupee(log.cost)}</td>
                      <td data-label="Date of Distribution">{formatDate(log.date)}</td>
                      <td data-label="Actions" style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                          <Edit size={14} /> Edit
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete this ${log.type.toLowerCase()} entry?`)) {
                              const action = log.type === 'Material' 
                                ? deleteMaterialUsageAction(log.id || log._id) 
                                : deleteFinanceAction(log.id || log._id);
                              
                              action.then(() => fetchProjectDetails());
                            }
                          }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredMaterialLogs.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: '1rem' }}>No materials found matching search query.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Project Data</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddData} className="modal-form">
              <div className="form-group">
                <label>Type of Entry</label>
                <select value={entryType} onChange={e => setEntryType(e.target.value)}>
                  <option value="Labor">Labor / Worker</option>
                  <option value="Material">Material Usage</option>
                  <option value="Miscellaneous">Miscellaneous Amount</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Rental">Equipment Rental</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Date</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>

              {entryType === 'Labor' && (
                <>
                  <div className="form-group">
                    <label>Worker Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <input type="text" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="e.g. Mason" />
                  </div>
                  <div className="form-group">
                    <label>Time Worked (Days)</label>
                    <input type="number" step="0.5" required value={formData.days} onChange={e => setFormData({...formData, days: e.target.value})} placeholder="e.g. 1" />
                  </div>
                  <div className="form-group">
                    <label>Wage Incurred (₹)</label>
                    <input type="number" required value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} placeholder="e.g. 800" />
                  </div>
                  <div className="form-group">
                    <label>Amount Paid (₹)</label>
                    <input type="number" value={formData.amountPaid} onChange={e => setFormData({...formData, amountPaid: e.target.value})} placeholder="Leave blank if fully paid" />
                  </div>
                </>
              )}

              {entryType === 'Material' && (
                <>
                  <div className="form-group">
                    <label>Material Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Cement" />
                  </div>
                  <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label>Quantity Distributed</label>
                      <input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="e.g. 50" style={{ width: '100%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Unit</label>
                      <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} style={{ width: '100%' }}>
                        <option value="Bags">Bags</option>
                        <option value="Tons">Tons</option>
                        <option value="Pallets">Pallets</option>
                        <option value="Cubic Feet">Cubic Feet</option>
                        <option value="Liters">Liters</option>
                        <option value="Pieces">Pieces</option>
                        <option value="Kg">Kg</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Distribution Rate (₹)</label>
                    <input type="number" required value={formData.distributionRate} onChange={e => setFormData({...formData, distributionRate: e.target.value})} placeholder="e.g. 350" />
                  </div>
                </>
              )}

              {entryType === 'Miscellaneous' && (
                <>
                  <div className="form-group">
                    <label>Expense Name / Description</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Site Cleaning" />
                  </div>
                  <div className="form-group">
                    <label>Amount Spent (₹)</label>
                    <input type="number" required value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} placeholder="e.g. 2000" />
                  </div>
                </>
              )}

              {entryType === 'Transportation' && (
                <div className="form-group">
                  <label>Vehicle / Service</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Dump Truck Delivery" />
                </div>
              )}

              {entryType === 'Rental' && (
                <>
                  <div className="form-group">
                    <label>Equipment Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Crane" />
                  </div>
                  <div className="form-group">
                    <label>Days Rented</label>
                    <input type="number" required value={formData.days} onChange={e => setFormData({...formData, days: e.target.value})} />
                  </div>
                </>
              )}

              {(entryType === 'Transportation' || entryType === 'Rental') && (
                <div className="form-group">
                  <label>Total Cost (₹)</label>
                  <input type="number" required value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} />
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Project Details</h2>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
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
                  value={currentProject.client} 
                  onChange={e => setCurrentProject({...currentProject, client: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Location / Site Address</label>
                <input 
                  type="text" 
                  required 
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
    </div>
  );
};

export default ProjectDetails;
