import axios from 'axios';

const API = axios.create({
  baseURL: typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://cms-shreeram.onrender.com/api'
});

export const getDashboardStats = () => API.get('/dashboard');

export const getProjects = () => API.get('/projects');
export const getProjectDetails = (id) => API.get(`/projects/${id}`);
export const createProject = (projectData) => API.post('/projects', projectData);
export const updateProject = (id, projectData) => API.put(`/projects/${id}`, projectData);
export const addProjectLog = (projectId, logData) => API.post(`/projects/${projectId}/logs`, logData);

export const getWorkers = () => API.get('/workers');
export const createWorker = (workerData) => API.post('/workers', workerData);
export const updateWorker = (id, workerData) => API.put(`/workers/${id}`, workerData);
export const getWorkerLogs = () => API.get('/workers/logs');
export const createWorkerLog = (logData) => API.post('/workers/logs', logData);
export const updateWorkerLog = (id, logData) => API.put(`/workers/logs/${id}`, logData);
export const addWorkerAdvance = (id, amount) => API.post(`/workers/${id}/advance`, { amount });
export const payWorkerWages = (id) => API.post(`/workers/${id}/pay-wages`);

export const getMaterials = () => API.get('/materials');
export const saveMaterial = (materialData) => API.post('/materials', materialData);
export const editMaterialBatch = (materialId, batchIndex, batchData) => API.put(`/materials/${materialId}/batches/${batchIndex}`, batchData);
export const deleteMaterialBatch = (materialId, batchIndex) => API.delete(`/materials/${materialId}/batches/${batchIndex}`);
export const getMaterialUsage = () => API.get('/materials/usage');
export const logMaterialUsage = (usageData) => API.post('/materials/usage', usageData);

export const getFinances = () => API.get('/finances');
export const addIncome = (incomeData) => API.post('/finances', incomeData);
export const updateIncome = (id, incomeData) => API.put(`/finances/${id}`, incomeData);

export const deleteProject = (id, mode = 'soft') => API.delete(`/projects/${id}?mode=${mode}`);
export const deleteWorker = (id, mode = 'soft') => API.delete(`/workers/${id}?mode=${mode}`);
export const deleteWorkerLog = (id) => API.delete(`/workers/logs/${id}`);
export const deleteMaterial = (id, mode = 'soft') => API.delete(`/materials/${id}?mode=${mode}`);
export const deleteMaterialUsage = (id) => API.delete(`/materials/usage/${id}`);
export const deleteFinance = (id) => API.delete(`/finances/${id}`);

export default API;
