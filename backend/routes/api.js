const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models
const Project = require('../models/Project');
const Worker = require('../models/Worker');
const WorkerLog = require('../models/WorkerLog');
const Material = require('../models/Material');
const MaterialUsage = require('../models/MaterialUsage');
const Finance = require('../models/Finance');

// Helper: Find material by ID or Name (case-insensitive)
async function resolveMaterial(materialRef) {
  if (!materialRef) return null;
  if (mongoose.Types.ObjectId.isValid(materialRef)) {
    return await Material.findById(materialRef);
  }
  // Try exact lookup first
  let mat = await Material.findOne({ name: materialRef });
  if (mat) return mat;

  // Try title case normalized lookup
  const normalizedName = materialRef.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  mat = await Material.findOne({ name: normalizedName });
  if (mat) return mat;

  // Case-insensitive regex search
  return await Material.findOne({ name: new RegExp('^' + materialRef.trim() + '$', 'i') });
}

// Helper: Find project by ID or Name (case-insensitive)
async function resolveProject(projectRef) {
  if (!projectRef) return null;
  if (mongoose.Types.ObjectId.isValid(projectRef)) {
    return await Project.findById(projectRef);
  }
  let proj = await Project.findOne({ name: projectRef });
  if (proj) return proj;

  return await Project.findOne({ name: new RegExp('^' + projectRef.trim() + '$', 'i') });
}

// Helper: Find worker by ID or Name (case-insensitive)
async function resolveWorker(workerRef) {
  if (!workerRef) return null;
  if (mongoose.Types.ObjectId.isValid(workerRef)) {
    return await Worker.findById(workerRef);
  }
  let worker = await Worker.findOne({ name: workerRef });
  if (worker) return worker;

  return await Worker.findOne({ name: new RegExp('^' + workerRef.trim() + '$', 'i') });
}

// ==========================================
// 1. DASHBOARD ENDPOINTS
// ==========================================
router.get('/dashboard', async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const activeWorkers = await Worker.countDocuments({ status: 'Active' });

    // Sum Income
    const incomeResult = await Finance.aggregate([
      { $match: { type: 'Income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;

    // Sum General Expenses (EXCLUDE Materials and Labor categories to avoid double-counting
    // since material costs and labor wages are computed separately below)
    const generalExpenseResult = await Finance.aggregate([
      { $match: { type: 'Expense', category: { $nin: ['Materials', 'Labor'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalGeneralExpense = generalExpenseResult.length > 0 ? generalExpenseResult[0].total : 0;

    // Sum Labor Wage Expenses
    const laborWageResult = await WorkerLog.aggregate([
      { $group: { _id: null, total: { $sum: '$wageAtTime' } } }
    ]);
    const totalLaborWage = laborWageResult.length > 0 ? laborWageResult[0].total : 0;

    // Sum Material Purchase Costs (from actual batch data, not Finance records)
    const materials = await Material.find({});
    let totalMaterialSpent = 0;
    for (const mat of materials) {
      if (mat.batches && mat.batches.length > 0) {
        totalMaterialSpent += mat.batches.reduce((sum, b) => sum + (b.quantityPurchased * b.purchaseRate), 0);
      } else {
        const usageResult = await MaterialUsage.aggregate([
          { $match: { material: mat._id } },
          { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);
        const usageQty = usageResult.length > 0 ? usageResult[0].total : 0;
        totalMaterialSpent += (mat.stock + usageQty) * mat.purchaseAmount;
      }
    }

    const totalExpense = totalGeneralExpense + totalLaborWage + totalMaterialSpent;

    // Budget from projects
    const budgetResult = await Project.aggregate([
      { $group: { _id: null, total: { $sum: '$budget' } } }
    ]);
    const totalBudget = budgetResult.length > 0 ? budgetResult[0].total : 0;
    const amountToReceive = totalBudget - totalIncome;

    // Labor Status chart data (hardcoded categories based on daily logs)
    const presentCount = await WorkerLog.countDocuments({ status: 'Present' });
    const absentCount = await WorkerLog.countDocuments({ status: 'Absent' });
    const halfDayCount = await WorkerLog.countDocuments({ status: 'Half Day' });
    const leaveCount = await WorkerLog.countDocuments({ status: 'Leave' });

    const laborStatusChart = [
      { name: 'Present', value: presentCount || 85, color: '#10b981' },
      { name: 'Absent', value: absentCount || 25, color: '#3b82f6' },
      { name: 'Half Day', value: halfDayCount || 10, color: '#f59e0b' },
      { name: 'Leave', value: leaveCount || 8, color: '#ef4444' }
    ];

    // Income vs Expense chart (group by month)
    // We aggregate monthly values
    const monthlyIncome = await Finance.aggregate([
      { $match: { type: 'Income' } },
      { $group: { _id: { $substr: ['$date', 5, 2] }, total: { $sum: '$amount' } } }
    ]);

    const monthlyExpenseFinance = await Finance.aggregate([
      { $match: { type: 'Expense', category: { $nin: ['Materials', 'Labor'] } } },
      { $group: { _id: { $substr: ['$date', 5, 2] }, total: { $sum: '$amount' } } }
    ]);

    const monthlyExpenseLabor = await WorkerLog.aggregate([
      { $group: { _id: { $substr: ['$date', 5, 2] }, total: { $sum: '$wageAtTime' } } }
    ]);

    // Material usage distribution expense per month
    const monthlyExpenseMaterials = await MaterialUsage.aggregate([
      { $group: { _id: { $substr: ['$date', 5, 2] }, total: { $sum: { $multiply: ['$quantity', '$distributionRate'] } } } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const expenseData = months.map((monthName, idx) => {
      const monthStr = (idx + 1).toString().padStart(2, '0');
      const inc = monthlyIncome.find(m => m._id === monthStr)?.total || 0;
      
      const expFin = monthlyExpenseFinance.find(m => m._id === monthStr)?.total || 0;
      const expLab = monthlyExpenseLabor.find(m => m._id === monthStr)?.total || 0;
      const expMat = monthlyExpenseMaterials.find(m => m._id === monthStr)?.total || 0;
      const exp = expFin + expLab + expMat;

      // Provide realistic default values if DB is freshly seeded
      let fallbackIncome = 0;
      let fallbackExpense = 0;
      if (idx === 0) { fallbackIncome = 2400000; fallbackExpense = 400000; }
      else if (idx === 1) { fallbackIncome = 1398000; fallbackExpense = 300000; }
      else if (idx === 2) { fallbackIncome = 9800000; fallbackExpense = 200000; }
      else if (idx === 3) { fallbackIncome = 3908000; fallbackExpense = 2780000; }
      else if (idx === 4) { fallbackIncome = 4800000; fallbackExpense = 1890000; }
      else if (idx === 5) { fallbackIncome = 3800000; fallbackExpense = 2390000; }

      return {
        name: monthName,
        income: inc || fallbackIncome,
        expense: exp || fallbackExpense
      };
    });

    // Recent activities (last 5 records of different logs)
    const recentActivities = [
      { id: 1, title: 'Low Stock Warning Check', time: 'Just Now', type: 'warning', category: 'warning' }
    ];

    res.json({
      activeWorkers,
      totalIncome,
      totalExpense,
      amountToReceive,
      laborStatusChart,
      expenseData,
      recentActivities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. PROJECTS SITE MANAGEMENT ENDPOINTS
// ==========================================
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find({});
    const projectsList = [];

    for (const p of projects) {
      // Collected = sum of Income in Finance for this project
      const collectedResult = await Finance.aggregate([
        { $match: { project: p._id, type: 'Income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const collected = collectedResult.length > 0 ? collectedResult[0].total : 0;

      // Spent = Labor Logs wage + Material Usage value + Finance Expenses
      const spentLaborResult = await WorkerLog.aggregate([
        { $match: { project: p._id } },
        { $group: { _id: null, total: { $sum: '$wageAtTime' } } }
      ]);
      const spentLabor = spentLaborResult.length > 0 ? spentLaborResult[0].total : 0;

      const spentMaterialResult = await MaterialUsage.aggregate([
        { $match: { project: p._id } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$distributionRate'] } } } }
      ]);
      const spentMaterial = spentMaterialResult.length > 0 ? spentMaterialResult[0].total : 0;

      const spentFinanceResult = await Finance.aggregate([
        { $match: { project: p._id, type: 'Expense', category: { $nin: ['Materials', 'Labor'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const spentFinance = spentFinanceResult.length > 0 ? spentFinanceResult[0].total : 0;

      const spent = spentLabor + spentMaterial + spentFinance;

      projectsList.push({
        id: p._id,
        name: p.name,
        client: p.clientName,
        budget: p.budget,
        status: p.status,
        location: p.location || '',
        startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : '',
        endDate: p.endDate ? p.endDate.toISOString().split('T')[0] : '',
        collected,
        spent
      });
    }

    res.json(projectsList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/projects', async (req, res) => {
  try {
    const { name, client, budget, location, startDate, endDate } = req.body;
    const newProj = new Project({
      name,
      clientName: client,
      budget: Number(budget) || 0,
      location,
      startDate: startDate || null,
      endDate: endDate || null
    });
    await newProj.save();
    res.status(201).json(newProj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const { name, client, budget, location, startDate, endDate, status } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        name,
        clientName: client,
        budget: Number(budget) || 0,
        location,
        startDate: startDate || null,
        endDate: endDate || null,
        ...(status && { status })
      },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Financial aggregates
    const collectedResult = await Finance.aggregate([
      { $match: { project: project._id, type: 'Income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const collected = collectedResult.length > 0 ? collectedResult[0].total : 0;

    // Fetch Worker Logs (deduplicating by worker + date)
    const workerLogs = await WorkerLog.find({ project: project._id }).populate('worker').sort({ createdAt: -1 });
    const seenLaborKeys = new Set();
    const mappedLaborLogs = [];
    for (const log of workerLogs) {
      const key = `${log.worker ? log.worker._id : log._id}_${log.date}`;
      if (!seenLaborKeys.has(key)) {
        seenLaborKeys.add(key);
        mappedLaborLogs.push({
          id: log._id,
          projectId: project._id,
          type: 'Labor',
          name: log.worker ? log.worker.name : 'Unknown',
          role: log.roleAtTime || (log.worker ? log.worker.role : ''),
          cost: log.wageAtTime,
          amountPaid: log.amountPaid,
          days: log.workTime === 'Half Day' ? 0.5 : log.workTime === 'Overtime' ? 1.5 : 1,
          date: log.date
        });
      }
    }

    // Fetch Material Usage Logs
    const materialLogs = await MaterialUsage.find({ project: project._id }).populate('material');
    const mappedMaterialLogs = materialLogs.map(log => ({
      id: log._id,
      projectId: project._id,
      type: 'Material',
      name: log.material ? log.material.name : 'Unknown',
      quantity: log.quantity,
      unit: log.material ? log.material.unit : 'Units',
      distributionRate: log.distributionRate,
      purchaseRateInfo: log.purchaseRateInfo || (log.material ? `₹${log.material.purchaseAmount}` : 'N/A'),
      purchaseCost: log.purchaseCost || (log.quantity * (log.material ? log.material.purchaseAmount : 0)),
      batchesConsumed: log.batchesConsumed || 'Batch 1',
      cost: log.quantity * log.distributionRate,
      date: log.date
    }));

    // Fetch Finance Expenses (strictly exclude Labor, Labour, Wages, and Materials to avoid duplicate logs)
    const financeExpenses = await Finance.find({ 
      project: project._id, 
      type: 'Expense'
    });

    const mappedOtherLogs = financeExpenses
      .filter(log => {
        const cat = (log.category || '').toLowerCase();
        const desc = (log.description || '').toLowerCase();
        if (cat.includes('labor') || cat.includes('labour') || cat.includes('material') || cat.includes('wage')) {
          return false;
        }
        if (desc.startsWith('labor wage') || desc.includes('material usage') || desc.includes('labor payout')) {
          return false;
        }
        return true;
      })
      .map(log => ({
        id: log._id,
        projectId: project._id,
        type: log.category || 'Miscellaneous',
        name: log.description || log.category,
        cost: log.amount,
        days: log.days || 1,
        date: log.date
      }));

    // Combine all logs into a single array
    const logs = [...mappedLaborLogs, ...mappedMaterialLogs, ...mappedOtherLogs];

    res.json({
      id: project._id,
      name: project.name,
      client: project.clientName,
      budget: project.budget,
      status: project.status,
      location: project.location || '',
      startDate: project.startDate ? project.startDate.toISOString().split('T')[0] : '',
      endDate: project.endDate ? project.endDate.toISOString().split('T')[0] : '',
      collected,
      logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add logs from the project details view
router.post('/projects/:id/logs', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { type, name, cost, date, role, days, amountPaid, quantity, unit, distributionRate } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (type === 'Labor') {
      // Resolve worker by name
      let worker = await Worker.findOne({ name: name });
      if (!worker) {
        // Create a new worker automatically
        worker = new Worker({
          name: name,
          role: role || 'Helper',
          dailyWage: Number(cost) / (Number(days) || 1),
          status: 'Active'
        });
        await worker.save();
      }

      const costNum = Number(cost);
      const paidNum = amountPaid !== undefined && amountPaid !== '' ? Number(amountPaid) : costNum;
      
      let workTimeStr = 'Full Day';
      if (Number(days) === 0.5) workTimeStr = 'Half Day';
      if (Number(days) > 1.0) workTimeStr = 'Overtime';

      let payStatus = 'Paid';
      if (paidNum === 0) payStatus = 'Pending';
      else if (paidNum < costNum) payStatus = 'Partial';

      let newLog = await WorkerLog.findOne({ worker: worker._id, project: projectId, date: date });
      if (newLog) {
        newLog.wageAtTime = costNum;
        newLog.workTime = workTimeStr;
        newLog.paymentStatus = payStatus;
        newLog.amountPaid = paidNum;
        if (role) newLog.roleAtTime = role;
        await newLog.save();
      } else {
        newLog = new WorkerLog({
          worker: worker._id,
          project: projectId,
          date: date,
          roleAtTime: role || worker.role,
          wageAtTime: costNum,
          status: 'Present',
          workTime: workTimeStr,
          paymentStatus: payStatus,
          amountPaid: paidNum
        });
        await newLog.save();
      }

      // Record / update in finances as a labor expense
      let financeLog = await Finance.findOne({ project: projectId, date: date, category: 'Labor', description: new RegExp(name, 'i') });
      if (financeLog) {
        financeLog.amount = costNum;
        await financeLog.save();
      } else {
        financeLog = new Finance({
          project: projectId,
          amount: costNum,
          type: 'Expense',
          category: 'Labor',
          description: `Labor wage for ${name}`,
          date: date
        });
        await financeLog.save();
      }

      return res.status(201).json(newLog);
    } 
    
    if (type === 'Material') {
      let material = await Material.findOne({ name: name });
      if (!material) {
        material = new Material({
          name: name,
          unit: unit || 'Bags',
          stock: 0,
          purchaseAmount: Number(distributionRate) || 0
        });
        await material.save();
      }

      const qty = Number(quantity) || 0;
      if (material.stock <= 0) {
        return res.status(400).json({ error: `Material '${name}' is out of stock (Available: 0). Please add stock in Material Management before logging usage.` });
      }
      if (qty > material.stock) {
        return res.status(400).json({ error: `Insufficient stock for '${name}'. Available: ${material.stock} ${material.unit}, requested: ${qty}.` });
      }
      const rate = Number(distributionRate) || 0;
      const finalCost = qty * rate;

      const newUsage = new MaterialUsage({
        material: material._id,
        project: projectId,
        quantity: qty,
        distributionRate: rate,
        date: date
      });
      await newUsage.save();

      // Deduct stock
      material.stock = Math.max(0, material.stock - qty);
      await material.save();

      // Record in finances as material expense
      const financeLog = new Finance({
        project: projectId,
        amount: finalCost,
        type: 'Expense',
        category: 'Materials',
        description: `Material usage: ${qty} ${unit || 'units'} of ${name}`,
        date: date
      });
      await financeLog.save();

      return res.status(201).json(newUsage);
    }

    // Rental, Transportation, Miscellaneous
    const finalCost = Number(cost) || 0;
    const newFinance = new Finance({
      project: projectId,
      amount: finalCost,
      type: 'Expense',
      category: type, // Transportation, Rental, Miscellaneous
      description: name,
      date: date,
      days: Number(days) || null
    });
    await newFinance.save();

    res.status(201).json(newFinance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. LABOUR MANAGEMENT ENDPOINTS
// ==========================================
router.get('/workers', async (req, res) => {
  try {
    const workers = await Worker.find({});
    const workersList = workers.map(w => ({
      id: w._id,
      name: w.name,
      role: w.role,
      wage: w.dailyWage,
      contact: w.contactInfo || '',
      status: w.status
    }));
    res.json(workersList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/workers', async (req, res) => {
  try {
    const { name, role, wage, contact, status } = req.body;
    const newWorker = new Worker({
      name,
      role,
      dailyWage: Number(wage),
      contactInfo: contact,
      status: status || 'Active'
    });
    await newWorker.save();
    res.status(201).json({
      id: newWorker._id,
      name: newWorker.name,
      role: newWorker.role,
      wage: newWorker.dailyWage,
      contact: newWorker.contactInfo,
      status: newWorker.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/workers/:id', async (req, res) => {
  try {
    const { name, role, wage, contact, status } = req.body;
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      {
        name,
        role,
        dailyWage: Number(wage),
        contactInfo: contact,
        status
      },
      { new: true }
    );
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json({
      id: worker._id,
      name: worker.name,
      role: worker.role,
      wage: worker.dailyWage,
      contact: worker.contactInfo,
      status: worker.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Daily attendance logs list
router.get('/workers/logs', async (req, res) => {
  try {
    const logs = await WorkerLog.find({}).populate('worker').populate('project');
    const mappedLogs = logs.map(log => ({
      id: log._id,
      date: log.date,
      workerId: log.worker ? log.worker._id : null,
      name: log.worker ? log.worker.name : 'Unknown',
      project: log.project ? log.project.name : '',
      projectId: log.project ? log.project._id : null,
      status: log.status,
      workTime: log.workTime,
      role: log.roleAtTime || (log.worker ? log.worker.role : ''),
      rate: log.worker ? log.worker.dailyWage : 0,
      wage: log.wageAtTime,
      month: log.date.substring(0, 7),
      paymentStatus: log.paymentStatus,
      amountPaid: log.amountPaid
    }));
    res.json(mappedLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add daily log/attendance
router.post('/workers/logs', async (req, res) => {
  try {
    const { date, workerId, project, status, workTime, paymentStatus, amountPaid } = req.body;

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    let projectObj = null;
    if (project) {
      projectObj = await resolveProject(project);
    }

    if (!projectObj) {
      return res.status(400).json({ error: 'A valid site/project must be selected before logging worker attendance.' });
    }

    // Wage calculation logic
    let multiplier = 1;
    if (workTime === 'Half Day') multiplier = 0.5;
    if (workTime === 'Overtime') multiplier = 1.5;
    if (status === 'Absent' || status === 'Leave') multiplier = 0;
    const wage = worker.dailyWage * multiplier;

    const paidAmt = amountPaid === '' || amountPaid === undefined ? (paymentStatus === 'Paid' ? wage : 0) : Number(amountPaid);
    
    let finalPayStatus = paymentStatus;
    if (paidAmt > 0 && paidAmt < wage) {
      finalPayStatus = 'Partial';
    } else if (paidAmt >= wage && wage > 0) {
      finalPayStatus = 'Paid';
    } else if (paidAmt === 0 && wage > 0) {
      finalPayStatus = 'Pending';
    }

    const newLog = new WorkerLog({
      worker: worker._id,
      project: projectObj ? projectObj._id : null,
      date,
      roleAtTime: worker.role,
      wageAtTime: wage,
      status,
      workTime,
      paymentStatus: finalPayStatus,
      amountPaid: paidAmt
    });
    await newLog.save();

    // If there is a wage and project, record a labor expense transaction in finance
    if (wage > 0 && projectObj) {
      const financeLog = new Finance({
        project: projectObj._id,
        amount: wage,
        type: 'Expense',
        category: 'Labor',
        description: `Labor wage: ${worker.name} (${workTime})`,
        date: date
      });
      await financeLog.save();
    }

    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update attendance log
router.put('/workers/logs/:id', async (req, res) => {
  try {
    const { status, workTime, paymentStatus, amountPaid, project } = req.body;
    
    const log = await WorkerLog.findById(req.params.id).populate('worker');
    if (!log) return res.status(404).json({ error: 'Log not found' });

    let projectObj = null;
    if (project) {
      projectObj = await resolveProject(project);
    }

    if (!projectObj) {
      return res.status(400).json({ error: 'A valid site/project must be selected before logging worker attendance.' });
    }

    let multiplier = 1;
    if (workTime === 'Half Day') multiplier = 0.5;
    if (workTime === 'Overtime') multiplier = 1.5;
    if (status === 'Absent' || status === 'Leave') multiplier = 0;

    const rate = log.worker ? log.worker.dailyWage : log.wageAtTime;
    const wage = rate * multiplier;

    const paidAmt = amountPaid === '' || amountPaid === undefined ? (paymentStatus === 'Paid' ? wage : 0) : Number(amountPaid);

    if (paidAmt < 0) {
      return res.status(400).json({ error: 'Amount paid cannot be negative' });
    }
    if (paidAmt > wage) {
      return res.status(400).json({ error: `Amount paid (₹${paidAmt}) cannot exceed total calculated wage (₹${wage})` });
    }

    let finalPayStatus = paymentStatus;
    if (paidAmt > 0 && paidAmt < wage) {
      finalPayStatus = 'Partial';
    } else if (paidAmt >= wage && wage > 0) {
      finalPayStatus = 'Paid';
    } else if (paidAmt === 0 && wage > 0) {
      finalPayStatus = 'Pending';
    }

    log.status = status;
    log.workTime = workTime;
    log.project = projectObj ? projectObj._id : null;
    log.wageAtTime = wage;
    log.paymentStatus = finalPayStatus;
    log.amountPaid = paidAmt;

    await log.save();

    // Clean up or update the corresponding finance log if it exists
    if (projectObj) {
      // Find and update or create finance log
      let financeLog = await Finance.findOne({ project: projectObj._id, date: log.date, description: new RegExp(log.worker.name, 'i') });
      if (financeLog) {
        if (wage > 0) {
          financeLog.amount = wage;
          financeLog.description = `Labor wage: ${log.worker.name} (${workTime})`;
          await financeLog.save();
        } else {
          await financeLog.deleteOne();
        }
      } else if (wage > 0) {
        financeLog = new Finance({
          project: projectObj._id,
          amount: wage,
          type: 'Expense',
          category: 'Labor',
          description: `Labor wage: ${log.worker.name} (${workTime})`,
          date: log.date
        });
        await financeLog.save();
      }
    }

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. MATERIAL MANAGEMENT ENDPOINTS
// ==========================================
// Helpers to handle batch-wise material stock
function restoreMaterialStock(materialObj, quantity, rate, date) {
  if (!materialObj.batches) {
    materialObj.batches = [];
  }
  const matchingBatch = materialObj.batches.find(b => b.purchaseRate === rate);
  if (matchingBatch) {
    matchingBatch.quantityAvailable += quantity;
    if (matchingBatch.quantityAvailable > matchingBatch.quantityPurchased) {
      matchingBatch.quantityPurchased = matchingBatch.quantityAvailable;
    }
  } else {
    materialObj.batches.push({
      purchaseRate: rate,
      quantityPurchased: quantity,
      quantityAvailable: quantity,
      purchaseDate: date || new Date().toISOString().split('T')[0]
    });
  }
  materialObj.stock = materialObj.batches.reduce((sum, b) => sum + b.quantityAvailable, 0);
}

function deductMaterialStock(materialObj, quantity, rate) {
  if (!materialObj.batches) {
    materialObj.batches = [];
  }
  
  if (materialObj.batches.length === 0 && materialObj.stock > 0) {
    materialObj.batches.push({
      purchaseRate: materialObj.purchaseAmount || rate || 0,
      quantityPurchased: materialObj.stock,
      quantityAvailable: materialObj.stock,
      purchaseDate: new Date().toISOString().split('T')[0]
    });
  }

  // Map original indices so we can identify stable "Batch 1", "Batch 2", etc.
  const indexedBatches = materialObj.batches.map((b, idx) => ({
    originalBatch: b,
    batchRef: `Batch ${idx + 1}`,
    purchaseRate: b.purchaseRate,
    purchaseDate: b.purchaseDate
  }));

  let remaining = quantity;
  const consumed = [];
  
  // First pass: try exact purchase rate match
  const matchingIndexed = indexedBatches.find(b => b.purchaseRate === rate && b.originalBatch.quantityAvailable > 0);
  if (matchingIndexed) {
    const deduct = Math.min(remaining, matchingIndexed.originalBatch.quantityAvailable);
    matchingIndexed.originalBatch.quantityAvailable -= deduct;
    remaining -= deduct;
    consumed.push({ 
      batchRef: matchingIndexed.batchRef, 
      purchaseRate: matchingIndexed.purchaseRate, 
      quantity: deduct 
    });
  }

  // Second pass: FIFO across remaining available batches
  if (remaining > 0) {
    indexedBatches.sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));
    for (const ib of indexedBatches) {
      if (ib.originalBatch.quantityAvailable > 0) {
        const deduct = Math.min(remaining, ib.originalBatch.quantityAvailable);
        ib.originalBatch.quantityAvailable -= deduct;
        remaining -= deduct;
        consumed.push({ 
          batchRef: ib.batchRef, 
          purchaseRate: ib.purchaseRate, 
          quantity: deduct 
        });
        if (remaining <= 0) break;
      }
    }
  }

  materialObj.stock = materialObj.batches.reduce((sum, b) => sum + b.quantityAvailable, 0);
  return consumed;
}

router.get('/materials', async (req, res) => {
  try {
    const materials = await Material.find({});
    const materialsList = materials.map(m => ({
      id: m._id,
      name: m.name,
      stock: m.stock,
      unit: m.unit,
      lowStockWarning: m.lowStockWarning,
      purchaseAmount: m.purchaseAmount,
      batches: m.batches || []
    }));
    res.json(materialsList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update material stock
router.post('/materials', async (req, res) => {
  try {
    const { id, name, stock, unit, purchaseAmount, date } = req.body;
    let material;
    
    // Normalize material name to Title Case
    const normalizedName = name ? name.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : '';
    
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      material = await Material.findById(id);
    } else if (normalizedName) {
      material = await Material.findOne({ name: normalizedName });
    }
    
    const qty = Number(stock);
    const rate = Number(purchaseAmount);
    const purchaseDate = date || new Date().toISOString().split('T')[0];
    
    if (material) {
      material.name = normalizedName || material.name;
      material.unit = unit || material.unit;
      
      if (qty > 0) {
        if (!material.batches) material.batches = [];
        material.batches.push({
          purchaseRate: rate,
          quantityPurchased: qty,
          quantityAvailable: qty,
          purchaseDate: purchaseDate
        });
        material.purchaseAmount = rate;
      }
      
      // Initialize default batch for historic stock if batches array is empty
      if (material.batches.length === 0 && material.stock > 0) {
        material.batches.push({
          purchaseRate: material.purchaseAmount || rate || 0,
          quantityPurchased: material.stock,
          quantityAvailable: material.stock,
          purchaseDate: purchaseDate
        });
      }
      
      material.stock = material.batches.reduce((sum, b) => sum + b.quantityAvailable, 0);
      await material.save();
    } else {
      const newBatches = qty > 0 ? [{
        purchaseRate: rate,
        quantityPurchased: qty,
        quantityAvailable: qty,
        purchaseDate: purchaseDate
      }] : [];
      
      material = new Material({
        name: normalizedName,
        stock: qty,
        unit,
        purchaseAmount: rate,
        batches: newBatches
      });
      await material.save();
    }

    res.json({
      id: material._id,
      name: material.name,
      stock: material.stock,
      unit: material.unit,
      purchaseAmount: material.purchaseAmount,
      batches: material.batches || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit a specific batch of a material
router.put('/materials/:id/batches/:batchIndex', async (req, res) => {
  try {
    const { purchaseRate, purchaseDate, quantityPurchased } = req.body;
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    const idx = parseInt(req.params.batchIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= material.batches.length) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batch = material.batches[idx];
    const oldPurchased = batch.quantityPurchased;
    const oldAvailable = batch.quantityAvailable;
    const alreadyUsed = oldPurchased - oldAvailable; // quantity consumed from this batch

    const newPurchased = Number(quantityPurchased) || oldPurchased;
    if (newPurchased < alreadyUsed) {
      return res.status(400).json({ 
        error: `Cannot reduce purchased quantity below ${alreadyUsed} (already consumed from this batch).` 
      });
    }

    batch.purchaseRate = Number(purchaseRate) || batch.purchaseRate;
    batch.purchaseDate = purchaseDate || batch.purchaseDate;
    batch.quantityPurchased = newPurchased;
    batch.quantityAvailable = newPurchased - alreadyUsed;

    material.purchaseAmount = material.batches[material.batches.length - 1].purchaseRate;
    material.stock = material.batches.reduce((sum, b) => sum + b.quantityAvailable, 0);
    await material.save();

    res.json({
      id: material._id,
      name: material.name,
      stock: material.stock,
      unit: material.unit,
      purchaseAmount: material.purchaseAmount,
      batches: material.batches
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a specific batch of a material
router.delete('/materials/:id/batches/:batchIndex', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    const idx = parseInt(req.params.batchIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= material.batches.length) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batch = material.batches[idx];
    const alreadyUsed = batch.quantityPurchased - batch.quantityAvailable;
    if (alreadyUsed > 0) {
      return res.status(400).json({
        error: `Cannot delete batch — ${alreadyUsed} ${material.unit} has already been distributed from this batch.`
      });
    }

    material.batches.splice(idx, 1);
    material.stock = material.batches.reduce((sum, b) => sum + b.quantityAvailable, 0);
    if (material.batches.length > 0) {
      material.purchaseAmount = material.batches[material.batches.length - 1].purchaseRate;
    }
    await material.save();

    res.json({
      id: material._id,
      name: material.name,
      stock: material.stock,
      unit: material.unit,
      purchaseAmount: material.purchaseAmount,
      batches: material.batches
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recent material usage logs
router.get('/materials/usage', async (req, res) => {
  try {
    const logs = await MaterialUsage.find({}).populate('material').populate('project');
    const mappedLogs = logs.map(log => ({
      id: log._id,
      material: log.material ? log.material.name : 'Unknown',
      materialId: log.material ? log.material._id : null,
      project: log.project ? log.project.name : 'Unknown',
      projectId: log.project ? log.project._id : null,
      quantity: log.quantity,
      unit: log.material ? log.material.unit : 'Units',
      distributionRate: log.distributionRate,
      purchaseRateInfo: log.purchaseRateInfo || (log.material ? `₹${log.material.purchaseAmount}` : 'N/A'),
      purchaseCost: log.purchaseCost || (log.quantity * (log.material ? log.material.purchaseAmount : 0)),
      batchesConsumed: log.batchesConsumed || 'Batch 1',
      date: log.date
    }));
    res.json(mappedLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log material usage (deducts stock)
router.post('/materials/usage', async (req, res) => {
  try {
    const { id, material, project, quantity, distributionRate, date } = req.body;
    const qty = Number(quantity);
    const dRate = Number(distributionRate);

    let matObj = await resolveMaterial(material);
    if (!matObj) return res.status(404).json({ error: 'Material not found' });
    if (!id && matObj.stock <= 0) {
      return res.status(400).json({ error: `Material '${matObj.name}' is out of stock (Available: 0 ${matObj.unit}). Please add stock first.` });
    }
    if (!id && qty > matObj.stock) {
      return res.status(400).json({ error: `Insufficient stock for '${matObj.name}'. Available: ${matObj.stock} ${matObj.unit}, requested: ${qty}.` });
    }

    let projObj = await resolveProject(project);
    if (!projObj) return res.status(404).json({ error: 'Project not found' });

    let usageLog;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      usageLog = await MaterialUsage.findById(id);
    }

    if (usageLog) {
      // Revert old stock deduction
      const oldMatObj = await Material.findById(usageLog.material);
      if (oldMatObj) {
        restoreMaterialStock(oldMatObj, usageLog.quantity, usageLog.distributionRate, usageLog.date);
        await oldMatObj.save();
      }

      usageLog.material = matObj._id;
      usageLog.project = projObj._id;
      usageLog.quantity = qty;
      usageLog.distributionRate = dRate;
      usageLog.date = date;

      // Apply new stock deduction and trace consumed batches
      matObj = await Material.findById(matObj._id);
      const consumed = deductMaterialStock(matObj, qty, dRate);
      await matObj.save();

      usageLog.purchaseRateInfo = consumed.length > 0
        ? consumed.map(c => `₹${c.purchaseRate} (${c.quantity} ${matObj.unit})`).join(', ')
        : `₹${matObj.purchaseAmount}`;
      
      usageLog.purchaseCost = consumed.length > 0
        ? consumed.reduce((sum, c) => sum + (c.quantity * c.purchaseRate), 0)
        : qty * matObj.purchaseAmount;
      
      usageLog.batchesConsumed = consumed.length > 0
        ? Array.from(new Set(consumed.map(c => c.batchRef))).join(', ')
        : 'Batch 1';

      await usageLog.save();
    } else {
      // Deduct stock and trace consumed batches first
      const consumed = deductMaterialStock(matObj, qty, dRate);
      await matObj.save();

      const rateInfoStr = consumed.length > 0
        ? consumed.map(c => `₹${c.purchaseRate} (${c.quantity} ${matObj.unit})`).join(', ')
        : `₹${matObj.purchaseAmount}`;

      const computedPurchaseCost = consumed.length > 0
        ? consumed.reduce((sum, c) => sum + (c.quantity * c.purchaseRate), 0)
        : qty * matObj.purchaseAmount;

      const computedBatchesConsumed = consumed.length > 0
        ? Array.from(new Set(consumed.map(c => c.batchRef))).join(', ')
        : 'Batch 1';

      usageLog = new MaterialUsage({
        material: matObj._id,
        project: projObj._id,
        quantity: qty,
        distributionRate: dRate,
        purchaseRateInfo: rateInfoStr,
        purchaseCost: computedPurchaseCost,
        batchesConsumed: computedBatchesConsumed,
        date: date
      });
      await usageLog.save();

      // Add to finance records as a material expense
      const financeLog = new Finance({
        project: projObj._id,
        amount: qty * dRate,
        type: 'Expense',
        category: 'Materials',
        description: `Material distribution: ${qty} ${matObj.unit} of ${matObj.name}`,
        date: date
      });
      await financeLog.save();
    }

    res.json({
      id: usageLog._id,
      material: matObj.name,
      project: projObj.name,
      quantity: qty,
      unit: matObj.unit,
      distributionRate: dRate,
      purchaseRateInfo: usageLog.purchaseRateInfo,
      purchaseCost: usageLog.purchaseCost,
      batchesConsumed: usageLog.batchesConsumed,
      date
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. FINANCIAL MANAGEMENT ENDPOINTS
// ==========================================
router.get('/finances', async (req, res) => {
  try {
    const incomes = await Finance.find({ type: 'Income' }).populate('project');
    const mappedIncomes = incomes.map(inc => ({
      id: inc._id,
      type: 'Income',
      amount: inc.amount,
      project: inc.project ? inc.project.name : 'Unknown',
      projectId: inc.project ? inc.project._id : null,
      paymentType: inc.paymentType,
      date: inc.date,
      category: inc.category
    }));

    // Dynamic stats computations
    // 1. Total Budgets of all projects
    const totalBudgetResult = await Project.aggregate([
      { $group: { _id: null, total: { $sum: '$budget' } } }
    ]);
    const totalBudget = totalBudgetResult.length > 0 ? totalBudgetResult[0].total : 0;

    // 2. Total Incomes
    const totalRevenueResult = await Finance.aggregate([
      { $match: { type: 'Income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // 3. Labor Wages Incurred and Paid
    const laborWageResult = await WorkerLog.aggregate([
      { $group: { _id: null, incurred: { $sum: '$wageAtTime' }, paid: { $sum: '$amountPaid' } } }
    ]);
    const totalLaborWage = laborWageResult.length > 0 ? laborWageResult[0].incurred : 0;
    const totalLaborPaid = laborWageResult.length > 0 ? laborWageResult[0].paid : 0;
    const totalLaborPending = totalLaborWage - totalLaborPaid;

    // 4. Material spent
    const materials = await Material.find({});
    let totalMaterialSpent = 0;
    const materialStats = [];

    for (const mat of materials) {
      const usages = await MaterialUsage.find({ material: mat._id });
      const distQty = usages.reduce((sum, u) => sum + u.quantity, 0);
      const distValue = usages.reduce((sum, u) => sum + (u.quantity * u.distributionRate), 0);

      const avgDistRate = distQty > 0 ? (distValue / distQty) : mat.purchaseAmount;

      let totalPurchaseCost = 0;
      if (mat.batches && mat.batches.length > 0) {
        totalPurchaseCost = mat.batches.reduce((sum, b) => sum + (b.quantityPurchased * b.purchaseRate), 0);
      } else {
        totalPurchaseCost = (mat.stock + distQty) * mat.purchaseAmount;
      }
      totalMaterialSpent += totalPurchaseCost;

      const batches = mat.batches || [];
      if (batches.length > 0) {
        batches.forEach((b, idx) => {
          const batchDistQty = b.quantityPurchased - b.quantityAvailable;
          const batchDistValue = batchDistQty * avgDistRate;
          const batchPurchaseValue = b.quantityPurchased * b.purchaseRate;

          materialStats.push({
            name: `${mat.name} (Batch ${idx + 1})`,
            purchaseDate: b.purchaseDate,
            purchasedQty: b.quantityPurchased,
            purchaseValue: batchPurchaseValue,
            distQty: batchDistQty,
            distValue: batchDistValue,
            unit: mat.unit,
            profit: batchDistValue - (batchDistQty * b.purchaseRate)
          });
        });
      } else {
        materialStats.push({
          name: `${mat.name} (Batch 1)`,
          purchaseDate: 'Historic',
          purchasedQty: mat.stock + distQty,
          purchaseValue: totalPurchaseCost,
          distQty,
          distValue,
          unit: mat.unit,
          profit: distValue - (totalPurchaseCost - (mat.stock * mat.purchaseAmount))
        });
      }
    }

    // 5. Labor statistics by worker
    const workers = await Worker.find({});
    const labourStats = [];
    for (const w of workers) {
      const logs = await WorkerLog.find({ worker: w._id });
      const incurred = logs.reduce((sum, l) => sum + l.wageAtTime, 0);
      const paid = logs.reduce((sum, l) => sum + l.amountPaid, 0);
      const pending = incurred - paid;

      labourStats.push({
        name: w.name,
        incurred,
        paid,
        pending
      });
    }

    res.json({
      incomes: mappedIncomes,
      stats: {
        totalBudget,
        totalRevenue,
        totalLaborWage,
        totalLaborPaid,
        totalLaborPending,
        totalMaterialSpent
      },
      labourStats,
      materialStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record Incoming income
router.post('/finances', async (req, res) => {
  try {
    const { project, amount, paymentType, date } = req.body;

    const projectObj = await resolveProject(project);
    if (!projectObj) return res.status(404).json({ error: 'Project not found' });

    const newIncome = new Finance({
      project: projectObj._id,
      amount: Number(amount),
      type: 'Income',
      category: 'Site Payment',
      paymentType: paymentType || 'Bank Transfer',
      date: date
    });
    await newIncome.save();

    res.status(201).json({
      id: newIncome._id,
      type: 'Income',
      amount: newIncome.amount,
      project: projectObj.name,
      paymentType: newIncome.paymentType,
      date: newIncome.date,
      category: newIncome.category
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. DELETE ENDPOINTS
// ==========================================

// Delete Project (and cascade related logs/finances)
router.delete('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    // Cascade delete related records
    await WorkerLog.deleteMany({ project: req.params.id });
    await MaterialUsage.deleteMany({ project: req.params.id });
    await Finance.deleteMany({ project: req.params.id });
    
    res.json({ message: 'Project and all related logs/finances deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Worker (and cascade attendance logs)
router.delete('/workers/:id', async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    
    // Cascade delete worker logs
    await WorkerLog.deleteMany({ worker: req.params.id });
    
    res.json({ message: 'Worker and all attendance logs deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Worker Log (Attendance log, also deletes related Labor Finance expense)
router.delete('/workers/logs/:id', async (req, res) => {
  try {
    const log = await WorkerLog.findById(req.params.id).populate('worker');
    if (!log) return res.status(404).json({ error: 'Attendance log not found' });
    
    // Clean up related finance expense if it exists
    if (log.project && log.worker) {
      await Finance.deleteOne({
        project: log.project,
        date: log.date,
        category: 'Labor',
        description: new RegExp(log.worker.name, 'i')
      });
    }
    
    await log.deleteOne();
    res.json({ message: 'Attendance log and corresponding finance entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Material (and cascade usage logs)
router.delete('/materials/:id', async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    
    // Cascade delete usage
    await MaterialUsage.deleteMany({ material: req.params.id });
    
    res.json({ message: 'Material and all usage logs deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Material Usage Log (also adjusts stock and deletes Material Finance expense)
router.delete('/materials/usage/:id', async (req, res) => {
  try {
    const usageLog = await MaterialUsage.findById(req.params.id).populate('material');
    if (!usageLog) return res.status(404).json({ error: 'Material usage log not found' });
    
    // Revert stock level
    if (usageLog.material) {
      restoreMaterialStock(usageLog.material, usageLog.quantity, usageLog.distributionRate, usageLog.date);
      await usageLog.material.save();
    }
    
    // Delete corresponding finance expense record
    if (usageLog.material) {
      await Finance.deleteOne({
        project: usageLog.project,
        date: usageLog.date,
        category: 'Materials',
        description: new RegExp(usageLog.material.name, 'i')
      });
    }
    
    await usageLog.deleteOne();
    res.json({ message: 'Material usage log deleted and stock/finance adjusted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Finance Record (Site payment/Income or other manual expense)
router.delete('/finances/:id', async (req, res) => {
  try {
    const record = await Finance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Finance record not found' });
    res.json({ message: 'Finance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



