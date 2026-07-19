import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getProjects, createProject, addProjectLog,
  getWorkers, createWorker, updateWorker,
  getWorkerLogs, createWorkerLog, updateWorkerLog,
  getMaterials, saveMaterial, getMaterialUsage, logMaterialUsage,
  getFinances, addIncome, getDashboardStats,
  deleteProject, deleteWorker, deleteWorkerLog,
  deleteMaterial, deleteMaterialUsage, deleteFinance
} from '../api';
import {
  MOCK_PROJECTS, MOCK_WORKERS, MOCK_DAILY_LOGS, MOCK_MATERIALS,
  MOCK_MATERIAL_USAGE, MOCK_FINANCES, EXPENSE_DATA,
  addProjectMock, addProjectLogMock
} from '../mockData';

const CMSContext = createContext(null);

export const CMSProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('shreeram_auth') === 'true';
  });

  const [loading, setLoading] = useState(true);

  const loginAction = (username, password) => {
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('shreeram_auth', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logoutAction = () => {
    localStorage.removeItem('shreeram_auth');
    setIsAuthenticated(false);
  };
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [usageLogs, setUsageLogs] = useState([]);
  const [finances, setFinances] = useState({
    incomes: [],
    stats: { totalBudget: 0, totalRevenue: 0, totalLaborWage: 0, totalLaborPaid: 0, totalLaborPending: 0, totalMaterialSpent: 0 },
    labourStats: [],
    materialStats: []
  });
  const [dashboardStats, setDashboardStats] = useState({
    activeWorkers: 0,
    totalIncome: 0,
    totalExpense: 0,
    amountToReceive: 0,
    laborStatusChart: [],
    expenseData: []
  });

  const fetchData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [
        projectsRes,
        workersRes,
        logsRes,
        materialsRes,
        usageRes,
        financesRes,
        dashboardRes
      ] = await Promise.all([
        getProjects(),
        getWorkers(),
        getWorkerLogs(),
        getMaterials(),
        getMaterialUsage(),
        getFinances(),
        getDashboardStats()
      ]);

      setProjects(projectsRes.data);
      setWorkers(workersRes.data);
      setDailyLogs(logsRes.data);
      setMaterials(materialsRes.data);
      setUsageLogs(usageRes.data);
      setFinances(financesRes.data);
      setDashboardStats(dashboardRes.data);
      setLoading(false);
    } catch (err) {
      console.warn('Backend server unreachable. Cascading fallback to local mock data caches:', err.message);
      
      // FALLBACK CALCULATIONS
      // 1. Projects
      setProjects([...MOCK_PROJECTS]);

      // 2. Workers
      setWorkers([...MOCK_WORKERS]);

      // 3. WorkerLogs
      setDailyLogs([...MOCK_DAILY_LOGS]);

      // 4. Materials
      setMaterials([...MOCK_MATERIALS]);

      // 5. UsageLogs
      setUsageLogs([...MOCK_MATERIAL_USAGE]);

      // 6. Finances fallback calculations
      const totalBudget = MOCK_PROJECTS.reduce((acc, p) => acc + p.budget, 0);
      const totalRevenue = MOCK_FINANCES.filter(f => f.type === 'Income').reduce((acc, f) => acc + f.amount, 0);
      const totalLaborWage = MOCK_DAILY_LOGS.reduce((acc, l) => acc + (l.wage || 0), 0);
      const totalLaborPaid = MOCK_DAILY_LOGS.filter(l => l.paymentStatus === 'Paid').reduce((acc, l) => acc + (l.wage || 0), 0);
      const totalLaborPending = totalLaborWage - totalLaborPaid;
      
      const matStats = MOCK_MATERIALS.map(mat => {
        const usages = MOCK_MATERIAL_USAGE.filter(u => u.material === mat.name);
        const distQty = usages.reduce((acc, u) => acc + Number(u.quantity || 0), 0);
        const distValue = usages.reduce((acc, u) => acc + (Number(u.quantity || 0) * Number(u.distributionRate || 0)), 0);
        const purchasedQty = Number(mat.stock || 0) + distQty;
        const purchaseValue = purchasedQty * Number(mat.purchaseAmount || 0);
        return {
          name: mat.name,
          purchasedQty,
          purchaseValue,
          distQty,
          distValue,
          unit: mat.unit,
          profit: distValue - (distQty * Number(mat.purchaseAmount || 0))
        };
      });
      const totalMaterialSpent = matStats.reduce((acc, mat) => acc + mat.purchaseValue, 0);

      setFinances({
        incomes: MOCK_FINANCES.filter(f => f.type === 'Income').map(f => ({ ...f, paymentType: f.paymentType || 'Bank Transfer' })),
        stats: {
          totalBudget,
          totalRevenue,
          totalLaborWage,
          totalLaborPaid,
          totalLaborPending,
          totalMaterialSpent
        },
        materialStats: matStats,
        labourStats: Object.values(MOCK_DAILY_LOGS.reduce((acc, log) => {
          if (!acc[log.name]) {
            acc[log.name] = { name: log.name, incurred: 0, paid: 0, pending: 0 };
          }
          acc[log.name].incurred += (log.wage || 0);
          if (log.paymentStatus === 'Paid') {
            acc[log.name].paid += (log.wage || 0);
          } else {
            acc[log.name].pending += (log.wage || 0);
          }
          return acc;
        }, {}))
      });

      // 7. Dashboard Stats fallback calculations
      setDashboardStats({
        activeWorkers: MOCK_WORKERS.filter(w => w.status === 'Active').length,
        totalIncome: MOCK_PROJECTS.reduce((sum, p) => sum + (p.collected || 0), 0),
        totalExpense: MOCK_PROJECTS.reduce((sum, p) => sum + (p.spent || 0), 0),
        amountToReceive: MOCK_PROJECTS.reduce((sum, p) => sum + (p.budget - (p.collected || 0)), 0),
        laborStatusChart: [
          { name: 'Present', value: 85, color: '#10b981' },
          { name: 'Absent', value: 25, color: '#3b82f6' },
          { name: 'Half Day', value: 10, color: '#f59e0b' },
          { name: 'Leave', value: 8, color: '#ef4444' }
        ],
        expenseData: EXPENSE_DATA,
        recentActivities: []
      });

      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData(true);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Action helpers to sync DB and background reload context state
  const addProjectAction = async (newProj) => {
    try {
      await createProject(newProj);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend createProject failed, updating local mock dataset:', err.message);
      const fallbackProj = {
        ...newProj,
        collected: 0,
        spent: 0,
        status: 'Planning'
      };
      addProjectMock(fallbackProj);
      await fetchData(false);
    }
  };

  const addProjectLogAction = async (projectId, logData) => {
    try {
      await addProjectLog(projectId, logData);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend addProjectLog failed, updating local mock dataset:', err.message);
      addProjectLogMock(logData);
      await fetchData(false);
    }
  };

  const addWorkerAction = async (workerData) => {
    try {
      await createWorker(workerData);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend createWorker failed, updating local mock dataset:', err.message);
      const newId = MOCK_WORKERS.length > 0 ? Math.max(...MOCK_WORKERS.map(w => w.id)) + 1 : 1;
      MOCK_WORKERS.push({
        ...workerData,
        id: newId
      });
      await fetchData(false);
    }
  };

  const updateWorkerAction = async (id, workerData) => {
    try {
      await updateWorker(id, workerData);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend updateWorker failed, updating local mock dataset:', err.message);
      const idx = MOCK_WORKERS.findIndex(w => (w.id || w._id).toString() === id.toString());
      if (idx !== -1) {
        MOCK_WORKERS[idx] = { ...MOCK_WORKERS[idx], ...workerData };
      }
      await fetchData(false);
    }
  };

  const addWorkerLogAction = async (logData) => {
    try {
      await createWorkerLog(logData);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend createWorkerLog failed, updating local mock dataset:', err.message);
      const worker = MOCK_WORKERS.find(w => (w.id || w._id).toString() === logData.workerId.toString());
      if (worker) {
        let multiplier = 1;
        if (logData.workTime === 'Half Day') multiplier = 0.5;
        if (logData.workTime === 'Overtime') multiplier = 1.5;
        if (logData.status === 'Absent' || logData.status === 'Leave') multiplier = 0;
        const wage = worker.dailyWage || worker.wage || 0;
        const finalWage = wage * multiplier;

        MOCK_DAILY_LOGS.push({
          id: MOCK_DAILY_LOGS.length + 1,
          date: logData.date,
          workerId: worker.id || worker._id,
          name: worker.name,
          project: logData.project,
          status: logData.status,
          workTime: logData.workTime,
          role: worker.role,
          rate: wage,
          wage: finalWage,
          month: logData.date.substring(0, 7),
          paymentStatus: logData.paymentStatus,
          amountPaid: logData.amountPaid
        });
      }
      await fetchData(false);
    }
  };

  const updateWorkerLogAction = async (id, logData) => {
    try {
      await updateWorkerLog(id, logData);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend updateWorkerLog failed, updating local mock dataset:', err.message);
      const idx = MOCK_DAILY_LOGS.findIndex(l => (l.id || l._id).toString() === id.toString());
      if (idx !== -1) {
        const worker = MOCK_WORKERS.find(w => (w.id || w._id).toString() === logData.workerId.toString());
        const wage = worker ? (worker.dailyWage || worker.wage || 0) : MOCK_DAILY_LOGS[idx].rate;
        let multiplier = 1;
        if (logData.workTime === 'Half Day') multiplier = 0.5;
        if (logData.workTime === 'Overtime') multiplier = 1.5;
        if (logData.status === 'Absent' || logData.status === 'Leave') multiplier = 0;
        const finalWage = wage * multiplier;

        MOCK_DAILY_LOGS[idx] = {
          ...MOCK_DAILY_LOGS[idx],
          ...logData,
          wage: finalWage,
          rate: wage
        };
      }
      await fetchData(false);
    }
  };

  const saveMaterialAction = async (materialData) => {
    try {
      await saveMaterial(materialData);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend saveMaterial failed, updating local mock dataset:', err.message);
      if (materialData.id) {
        const idx = MOCK_MATERIALS.findIndex(m => (m.id || m._id).toString() === materialData.id.toString());
        if (idx !== -1) {
          MOCK_MATERIALS[idx] = { ...MOCK_MATERIALS[idx], ...materialData, stock: materialData.stock, purchaseAmount: materialData.purchaseAmount };
        }
      } else {
        MOCK_MATERIALS.push({
          id: MOCK_MATERIALS.length + 1,
          name: materialData.name,
          stock: materialData.stock,
          unit: materialData.unit,
          purchaseAmount: materialData.purchaseAmount
        });
      }
      await fetchData(false);
    }
  };

  const logMaterialUsageAction = async (usageData) => {
    try {
      await logMaterialUsage(usageData);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend logMaterialUsage failed, updating local mock dataset:', err.message);
      if (usageData.id) {
        const idx = MOCK_MATERIAL_USAGE.findIndex(u => (u.id || u._id).toString() === usageData.id.toString());
        if (idx !== -1) {
          MOCK_MATERIAL_USAGE[idx] = { ...MOCK_MATERIAL_USAGE[idx], ...usageData };
        }
      } else {
        MOCK_MATERIAL_USAGE.push({
          id: MOCK_MATERIAL_USAGE.length + 1,
          material: usageData.material,
          project: usageData.project,
          quantity: usageData.quantity,
          unit: usageData.unit,
          distributionRate: usageData.distributionRate,
          date: usageData.date
        });
        // Deduct stock locally
        const mat = MOCK_MATERIALS.find(m => m.name === usageData.material);
        if (mat) {
          mat.stock = Math.max(0, mat.stock - usageData.quantity);
        }
      }
      await fetchData(false);
    }
  };

  const addIncomeAction = async (incomeData) => {
    try {
      await addIncome(incomeData);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend addIncome failed, updating local mock dataset:', err.message);
      MOCK_FINANCES.push({
        id: MOCK_FINANCES.length + 1,
        type: 'Income',
        amount: incomeData.amount,
        project: incomeData.project,
        paymentType: incomeData.paymentType,
        date: incomeData.date,
        category: 'Site Payment'
      });
      await fetchData(false);
    }
  };

  const deleteProjectAction = async (id) => {
    try {
      await deleteProject(id);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend deleteProject failed, updating local mock dataset:', err.message);
      const pIdx = MOCK_PROJECTS.findIndex(p => (p.id || p._id).toString() === id.toString());
      let pName = '';
      if (pIdx !== -1) {
        pName = MOCK_PROJECTS[pIdx].name;
        MOCK_PROJECTS.splice(pIdx, 1);
      }
      if (pName) {
        for (let i = MOCK_DAILY_LOGS.length - 1; i >= 0; i--) {
          if (MOCK_DAILY_LOGS[i].project === pName) {
            MOCK_DAILY_LOGS.splice(i, 1);
          }
        }
        for (let i = MOCK_MATERIAL_USAGE.length - 1; i >= 0; i--) {
          if (MOCK_MATERIAL_USAGE[i].project === pName) {
            MOCK_MATERIAL_USAGE.splice(i, 1);
          }
        }
        for (let i = MOCK_FINANCES.length - 1; i >= 0; i--) {
          if (MOCK_FINANCES[i].project === pName) {
            MOCK_FINANCES.splice(i, 1);
          }
        }
      }
      await fetchData(false);
    }
  };

  const deleteWorkerAction = async (id) => {
    try {
      await deleteWorker(id);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend deleteWorker failed, updating local mock dataset:', err.message);
      const wIdx = MOCK_WORKERS.findIndex(w => (w.id || w._id).toString() === id.toString());
      let wName = '';
      if (wIdx !== -1) {
        wName = MOCK_WORKERS[wIdx].name;
        MOCK_WORKERS.splice(wIdx, 1);
      }
      if (wName) {
        for (let i = MOCK_DAILY_LOGS.length - 1; i >= 0; i--) {
          if (MOCK_DAILY_LOGS[i].name === wName) {
            MOCK_DAILY_LOGS.splice(i, 1);
          }
        }
      }
      await fetchData(false);
    }
  };

  const deleteWorkerLogAction = async (id) => {
    try {
      await deleteWorkerLog(id);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend deleteWorkerLog failed, updating local mock dataset:', err.message);
      const logIdx = MOCK_DAILY_LOGS.findIndex(l => (l.id || l._id).toString() === id.toString());
      if (logIdx !== -1) {
        const log = MOCK_DAILY_LOGS[logIdx];
        const finIdx = MOCK_FINANCES.findIndex(f => 
          f.project === log.project && 
          f.date === log.date && 
          f.category === 'Labor' && 
          f.amount === log.wage
        );
        if (finIdx !== -1) {
          MOCK_FINANCES.splice(finIdx, 1);
        }
        MOCK_DAILY_LOGS.splice(logIdx, 1);
      }
      await fetchData(false);
    }
  };

  const deleteMaterialAction = async (id) => {
    try {
      await deleteMaterial(id);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend deleteMaterial failed, updating local mock dataset:', err.message);
      const mIdx = MOCK_MATERIALS.findIndex(m => (m.id || m._id).toString() === id.toString());
      let mName = '';
      if (mIdx !== -1) {
        mName = MOCK_MATERIALS[mIdx].name;
        MOCK_MATERIALS.splice(mIdx, 1);
      }
      if (mName) {
        for (let i = MOCK_MATERIAL_USAGE.length - 1; i >= 0; i--) {
          if (MOCK_MATERIAL_USAGE[i].material === mName) {
            MOCK_MATERIAL_USAGE.splice(i, 1);
          }
        }
      }
      await fetchData(false);
    }
  };

  const deleteMaterialUsageAction = async (id) => {
    try {
      await deleteMaterialUsage(id);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend deleteMaterialUsage failed, updating local mock dataset:', err.message);
      const uIdx = MOCK_MATERIAL_USAGE.findIndex(u => (u.id || u._id).toString() === id.toString());
      if (uIdx !== -1) {
        const log = MOCK_MATERIAL_USAGE[uIdx];
        const mat = MOCK_MATERIALS.find(m => m.name === log.material);
        if (mat) {
          mat.stock = (mat.stock || 0) + log.quantity;
        }
        const cost = log.quantity * log.distributionRate;
        const finIdx = MOCK_FINANCES.findIndex(f => 
          f.project === log.project && 
          f.date === log.date && 
          f.category === 'Materials' && 
          f.amount === cost
        );
        if (finIdx !== -1) {
          MOCK_FINANCES.splice(finIdx, 1);
        }
        MOCK_MATERIAL_USAGE.splice(uIdx, 1);
      }
      await fetchData(false);
    }
  };

  const deleteFinanceAction = async (id) => {
    try {
      await deleteFinance(id);
      await fetchData(false);
    } catch (err) {
      console.warn('Backend deleteFinance failed, updating local mock dataset:', err.message);
      const fIdx = MOCK_FINANCES.findIndex(f => (f.id || f._id).toString() === id.toString());
      if (fIdx !== -1) {
        MOCK_FINANCES.splice(fIdx, 1);
      }
      await fetchData(false);
    }
  };

  return (
    <CMSContext.Provider value={{
      loading,
      projects,
      workers,
      dailyLogs,
      materials,
      usageLogs,
      finances,
      dashboardStats,
      fetchData,
      addProjectAction,
      deleteProjectAction,
      addProjectLogAction,
      addWorkerAction,
      updateWorkerAction,
      deleteWorkerAction,
      addWorkerLogAction,
      updateWorkerLogAction,
      deleteWorkerLogAction,
      saveMaterialAction,
      deleteMaterialAction,
      logMaterialUsageAction,
      deleteMaterialUsageAction,
      addIncomeAction,
      deleteFinanceAction,
      isAuthenticated,
      loginAction,
      logoutAction
    }}>
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
};
