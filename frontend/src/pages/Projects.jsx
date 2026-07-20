import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Trash2, Edit, Download, Filter } from 'lucide-react';
import { useCMS } from '../context/CMSContext';
import SkeletonLoader from '../components/SkeletonLoader';
import SearchWithSuggestions from '../components/SearchWithSuggestions';
import { exportToExcel } from '../utils/exportToExcel';
import FilterModal from '../components/FilterModal';

const formatRupee = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const Projects = () => {
  const navigate = useNavigate();
  const { projects, addProjectAction, updateProjectAction, deleteProjectAction, loading } = useCMS();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', client: '', budget: '', location: '', startDate: '', endDate: '' });

  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProject, setCurrentProject] = useState({ id: '', name: '', client: '', budget: '', location: '', startDate: '', endDate: '', status: 'Active' });
  const [projectSearch, setProjectSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);

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
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <h1 className="page-title">Manage Sites / Projects</h1>
        <div className="action-toolbar">
          <div style={{ width: '200px' }}>
            <SearchWithSuggestions 
              value={projectSearch}
              onChange={setProjectSearch}
              placeholder="Search project..."
              suggestions={projects.map(p => p.name)}
            />
          </div>
          <button 
            className={`btn btn-secondary ${statusFilter !== 'All' ? 'btn-filter-active' : ''}`} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            onClick={() => setShowFilterModal(true)}
          >
            <Filter size={14} /> Filter
            {statusFilter !== 'All' && <span className="filter-badge-dot" />}
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            onClick={() => {
              const exportData = filteredProjects.map(p => ({
                'Project ID': p.id || p._id,
                'Project Name': p.name,
                'Client Name': p.client,
                'Location': p.location || '-',
                'Total Budget (₹)': p.budget,
                'Amount Collected (₹)': p.collected || 0,
                'Amount Spent (₹)': p.spent || 0,
                'Status': p.status || 'Active',
                'Start Date': p.startDate || '-',
                'End Date': p.endDate || '-'
              }));
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
                    <td data-label="Actions" style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/projects/${project.id || project._id}`)}
                      >
                        View Details
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
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
                        <Edit size={14} /> Edit
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${project.name}"? This will delete all logs and finances for this project.`)) {
                            deleteProjectAction(project.id || project._id);
                          }
                        }}
                      >
                        <Trash2 size={14} /> Delete
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
              <h2>Add New Project</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <X size={20} />
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
              <h2>Edit Project</h2>
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
    </div>
  );
};

export default Projects;
