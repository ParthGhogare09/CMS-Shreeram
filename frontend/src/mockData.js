export let MOCK_PROJECTS = [
  { id: 1, name: 'Skyline Tower', client: 'Apex Builders', budget: 50000000, status: 'Active', collected: 20000000, spent: 17500000 },
  { id: 2, name: 'Riverside Condos', client: 'Grand Lakes Realty', budget: 25000000, status: 'Planning', collected: 5000000, spent: 800000 },
  { id: 3, name: 'Downtown Mall Renovation', client: 'City Properties', budget: 8500000, status: 'Completed', collected: 8500000, spent: 8500000 },
];

export let MOCK_WORKERS = [
  { id: 1, name: 'Rajesh Kumar', role: 'Foreman', wage: 1200, contact: '9876543210', status: 'Active' },
  { id: 2, name: 'Amit Singh', role: 'Electrician', wage: 800, contact: '9876543211', status: 'Active' },
  { id: 3, name: 'Priya Sharma', role: 'Plumber', wage: 900, contact: '9876543212', status: 'Active' },
  { id: 4, name: 'Vikram Patel', role: 'Mason', wage: 750, contact: '9876543213', status: 'Inactive' },
  { id: 5, name: 'Suresh Das', role: 'Helper', wage: 500, contact: '9876543214', status: 'Active' },
  { id: 6, name: 'Anita Desai', role: 'Mason', wage: 750, contact: '9876543215', status: 'Active' },
  { id: 7, name: 'Ravi Verma', role: 'Electrician', wage: 800, contact: '9876543216', status: 'Inactive' },
];

export let MOCK_DAILY_LOGS = [
  { id: 1, date: '2026-05-01', workerId: 1, name: 'Rajesh Kumar', project: 'Skyline Tower', status: 'Present', workTime: 'Full Day', role: 'Foreman', rate: 1200, wage: 1200, month: '2026-05', paymentStatus: 'Paid' },
  { id: 2, date: '2026-05-01', workerId: 2, name: 'Amit Singh', project: 'Skyline Tower', status: 'Present', workTime: 'Half Day', role: 'Electrician', rate: 800, wage: 400, month: '2026-05', paymentStatus: 'Pending' },
  { id: 3, date: '2026-05-01', workerId: 5, name: 'Suresh Das', project: 'Riverside Condos', status: 'Present', workTime: 'Full Day', role: 'Helper', rate: 500, wage: 500, month: '2026-05', paymentStatus: 'Paid' },
  { id: 4, date: '2026-05-01', workerId: 6, name: 'Anita Desai', project: 'Downtown Mall Renovation', status: 'Present', workTime: 'Full Day', role: 'Mason', rate: 750, wage: 750, month: '2026-05', paymentStatus: 'Paid' },
  { id: 5, date: '2026-05-02', workerId: 1, name: 'Rajesh Kumar', project: 'Skyline Tower', status: 'Present', workTime: 'Full Day', role: 'Foreman', rate: 1200, wage: 1200, month: '2026-05', paymentStatus: 'Pending' },
  { id: 6, date: '2026-05-02', workerId: 3, name: 'Priya Sharma', project: 'Skyline Tower', status: 'Absent', workTime: '-', role: 'Plumber', rate: 900, wage: 0, month: '2026-05', paymentStatus: 'Paid' },
  { id: 7, date: '2026-05-02', workerId: 5, name: 'Suresh Das', project: 'Riverside Condos', status: 'Present', workTime: 'Full Day', role: 'Helper', rate: 500, wage: 500, month: '2026-05', paymentStatus: 'Pending' },
];

export let PROJECT_LOGS = [
  { id: 1, projectId: 1, type: 'Material', name: 'Cement', quantity: '50 Bags', cost: 15000, date: '2026-04-24' },
  { id: 2, projectId: 1, type: 'Labor', name: 'Rajesh Kumar', role: 'Foreman', cost: 1200, date: '2026-04-24', days: 1 },
  { id: 3, projectId: 1, type: 'Transportation', name: 'Steel Delivery Truck', cost: 12000, date: '2026-04-23' },
  { id: 4, projectId: 1, type: 'Rental', name: 'Excavator Model X', cost: 25000, date: '2026-04-22', days: 2 },
  { id: 5, projectId: 2, type: 'Material', name: 'Bricks', quantity: '200 Pallets', cost: 80000, date: '2026-04-20' },
];

export const MOCK_FINANCES = [
  { id: 1, type: 'Income', amount: 1500000, category: 'Phase 1 Payment', project: 'Skyline Tower', date: '2026-04-01' },
  { id: 2, type: 'Expense', amount: 200000, category: 'Materials', project: 'Skyline Tower', date: '2026-04-05' },
  { id: 3, type: 'Expense', amount: 50000, category: 'Labor', project: 'Skyline Tower', date: '2026-04-10' },
  { id: 4, type: 'Income', amount: 500000, category: 'Deposit', project: 'Riverside Condos', date: '2026-04-12' },
];

export const DASHBOARD_STATS = {
  totalProjects: 3,
  activeWorkers: 15,
  totalExpenses: 2500000,
  totalEarnings: 20000000,
};

export const EXPENSE_DATA = [
  { name: 'Jan', expense: 400000, income: 2400000 },
  { name: 'Feb', expense: 300000, income: 1398000 },
  { name: 'Mar', expense: 200000, income: 9800000 },
  { name: 'Apr', expense: 2780000, income: 3908000 },
  { name: 'May', expense: 1890000, income: 4800000 },
  { name: 'Jun', expense: 2390000, income: 3800000 },
];

// Helper variables
export const addProjectMock = (project) => {
  MOCK_PROJECTS.push({ ...project, id: MOCK_PROJECTS.length + 1 });
};

export const addProjectLogMock = (log) => {
  PROJECT_LOGS.push({ ...log, id: PROJECT_LOGS.length + 1 });
};

export let MOCK_MATERIALS = [
  { 
    id: 1, 
    name: 'Cement', 
    stock: 450, 
    unit: 'Bags', 
    lowStockWarning: 50, 
    purchaseAmount: 350,
    batches: [
      { purchaseRate: 350, quantityPurchased: 300, quantityAvailable: 250, purchaseDate: '2026-04-01' },
      { purchaseRate: 380, quantityPurchased: 200, quantityAvailable: 200, purchaseDate: '2026-04-15' }
    ]
  },
  { 
    id: 2, 
    name: 'Steel Rebar', 
    stock: 200, 
    unit: 'Tons', 
    lowStockWarning: 20, 
    purchaseAmount: 55000,
    batches: [
      { purchaseRate: 55000, quantityPurchased: 220, quantityAvailable: 200, purchaseDate: '2026-04-05' }
    ]
  },
  { 
    id: 3, 
    name: 'Bricks', 
    stock: 150, 
    unit: 'Pallets', 
    lowStockWarning: 30, 
    purchaseAmount: 4000,
    batches: [
      { purchaseRate: 4000, quantityPurchased: 150, quantityAvailable: 150, purchaseDate: '2026-04-10' }
    ]
  },
  { 
    id: 4, 
    name: 'Sand', 
    stock: 1000, 
    unit: 'Cubic Feet', 
    lowStockWarning: 200, 
    purchaseAmount: 80,
    batches: [
      { purchaseRate: 80, quantityPurchased: 1000, quantityAvailable: 1000, purchaseDate: '2026-04-20' }
    ]
  },
];

export let MOCK_MATERIAL_USAGE = [
  { id: 1, material: 'Cement', project: 'Skyline Tower', quantity: 50, unit: 'Bags', date: '2026-05-07', distributionRate: 360 },
  { id: 2, material: 'Steel Rebar', project: 'Skyline Tower', quantity: 20, unit: 'Tons', date: '2026-05-06', distributionRate: 56000 },
];
