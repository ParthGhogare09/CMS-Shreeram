import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export const getDashboardStats = () => API.get('/dashboard');

export const getProjects = () => API.get('/projects');
export const getProjectDetails = (id) => API.get(`/projects/${id}`);
export const createProject = (projectData) => API.post('/projects', projectData);
export const addProjectLog = (projectId, logData) => API.post(`/projects/${projectId}/logs`, logData);

export const getWorkers = () => API.get('/workers');
export const createWorker = (workerData) => API.post('/workers', workerData);
export const updateWorker = (id, workerData) => API.put(`/workers/${id}`, workerData);
export const getWorkerLogs = () => API.get('/workers/logs');
export const createWorkerLog = (logData) => API.post('/workers/logs', logData);
export const updateWorkerLog = (id, logData) => API.put(`/workers/logs/${id}`, logData);

export const getMaterials = () => API.get('/materials');
export const saveMaterial = (materialData) => API.post('/materials', materialData);
export const getMaterialUsage = () => API.get('/materials/usage');
export const logMaterialUsage = (usageData) => API.post('/materials/usage', usageData);

export const getFinances = () => API.get('/finances');
export const addIncome = (incomeData) => API.post('/finances', incomeData);

export default API;
