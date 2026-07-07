require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Models
const Project = require('./models/Project');
const Worker = require('./models/Worker');
const WorkerLog = require('./models/WorkerLog');
const Material = require('./models/Material');
const MaterialUsage = require('./models/MaterialUsage');
const Finance = require('./models/Finance');

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Clearing database...');
    await Project.deleteMany({});
    await Worker.deleteMany({});
    await WorkerLog.deleteMany({});
    await Material.deleteMany({});
    await MaterialUsage.deleteMany({});
    await Finance.deleteMany({});

    console.log('Seeding projects...');
    const projects = await Project.insertMany([
      { name: 'Skyline Tower', clientName: 'Apex Builders', budget: 50000000, status: 'Active', location: 'Worli, Mumbai', startDate: new Date('2026-01-10'), endDate: new Date('2027-06-30') },
      { name: 'Riverside Condos', clientName: 'Grand Lakes Realty', budget: 25000000, status: 'Planning', location: 'Kalyan, Thane', startDate: new Date('2026-06-01'), endDate: new Date('2028-02-15') },
      { name: 'Downtown Mall Renovation', clientName: 'City Properties', budget: 8500000, status: 'Completed', location: 'Shivajinagar, Pune', startDate: new Date('2025-08-01'), endDate: new Date('2026-04-30') }
    ]);

    const pSkyline = projects[0];
    const pRiverside = projects[1];
    const pMall = projects[2];

    console.log('Seeding workers...');
    const workers = await Worker.insertMany([
      { name: 'Rajesh Kumar', role: 'Foreman', dailyWage: 1200, contactInfo: '9876543210', status: 'Active' },
      { name: 'Amit Singh', role: 'Electrician', dailyWage: 800, contactInfo: '9876543211', status: 'Active' },
      { name: 'Priya Sharma', role: 'Plumber', dailyWage: 900, contactInfo: '9876543212', status: 'Active' },
      { name: 'Vikram Patel', role: 'Mason', dailyWage: 750, contactInfo: '9876543213', status: 'Inactive' },
      { name: 'Suresh Das', role: 'Helper', dailyWage: 500, contactInfo: '9876543214', status: 'Active' },
      { name: 'Anita Desai', role: 'Mason', dailyWage: 750, contactInfo: '9876543215', status: 'Active' },
      { name: 'Ravi Verma', role: 'Electrician', dailyWage: 800, contactInfo: '9876543216', status: 'Inactive' }
    ]);

    const wRajesh = workers[0];
    const wAmit = workers[1];
    const wPriya = workers[2];
    const wVikram = workers[3];
    const wSuresh = workers[4];
    const wAnita = workers[5];
    const wRavi = workers[6];

    console.log('Seeding daily attendance logs...');
    // Logs from mock data
    const dailyLogs = [
      { worker: wRajesh._id, project: pSkyline._id, date: '2026-05-01', roleAtTime: 'Foreman', wageAtTime: 1200, status: 'Present', workTime: 'Full Day', paymentStatus: 'Paid', amountPaid: 1200 },
      { worker: wAmit._id, project: pSkyline._id, date: '2026-05-01', roleAtTime: 'Electrician', wageAtTime: 400, status: 'Present', workTime: 'Half Day', paymentStatus: 'Pending', amountPaid: 0 },
      { worker: wSuresh._id, project: pRiverside._id, date: '2026-05-01', roleAtTime: 'Helper', wageAtTime: 500, status: 'Present', workTime: 'Full Day', paymentStatus: 'Paid', amountPaid: 500 },
      { worker: wAnita._id, project: pMall._id, date: '2026-05-01', roleAtTime: 'Mason', wageAtTime: 750, status: 'Present', workTime: 'Full Day', paymentStatus: 'Paid', amountPaid: 750 },
      
      { worker: wRajesh._id, project: pSkyline._id, date: '2026-05-02', roleAtTime: 'Foreman', wageAtTime: 1200, status: 'Present', workTime: 'Full Day', paymentStatus: 'Pending', amountPaid: 0 },
      { worker: wPriya._id, project: pSkyline._id, date: '2026-05-02', roleAtTime: 'Plumber', wageAtTime: 0, status: 'Absent', workTime: '-', paymentStatus: 'Paid', amountPaid: 0 },
      { worker: wSuresh._id, project: pRiverside._id, date: '2026-05-02', roleAtTime: 'Helper', wageAtTime: 500, status: 'Present', workTime: 'Full Day', paymentStatus: 'Pending', amountPaid: 0 }
    ];
    await WorkerLog.insertMany(dailyLogs);

    console.log('Seeding materials...');
    const materials = await Material.insertMany([
      { name: 'Cement', unit: 'Bags', stock: 450, lowStockWarning: 50, purchaseAmount: 350 },
      { name: 'Steel Rebar', unit: 'Tons', stock: 200, lowStockWarning: 20, purchaseAmount: 55000 },
      { name: 'Bricks', unit: 'Pallets', stock: 150, lowStockWarning: 30, purchaseAmount: 4000 },
      { name: 'Sand', unit: 'Cubic Feet', stock: 1000, lowStockWarning: 200, purchaseAmount: 80 }
    ]);

    const mCement = materials[0];
    const mSteel = materials[1];
    const mBricks = materials[2];
    const mSand = materials[3];

    console.log('Seeding material usage logs...');
    const materialUsage = [
      { material: mCement._id, project: pSkyline._id, quantity: 50, distributionRate: 360, date: '2026-05-07' },
      { material: mSteel._id, project: pSkyline._id, quantity: 20, distributionRate: 56000, date: '2026-05-06' },
      // Logs from PROJECT_LOGS
      { material: mCement._id, project: pSkyline._id, quantity: 50, distributionRate: 300, date: '2026-04-24' },
      { material: mBricks._id, project: pRiverside._id, quantity: 20, distributionRate: 4000, date: '2026-04-20' }
    ];
    await MaterialUsage.insertMany(materialUsage);

    console.log('Seeding finances...');
    const finances = [
      // Incomes
      { project: pSkyline._id, amount: 15000000, type: 'Income', category: 'Site Payment', paymentType: 'Bank Transfer', description: 'Phase 1 Payment', date: '2026-04-01' },
      { project: pRiverside._id, amount: 5000000, type: 'Income', category: 'Site Payment', paymentType: 'Bank Transfer', description: 'Deposit', date: '2026-04-12' },
      { project: pMall._id, amount: 8500000, type: 'Income', category: 'Site Payment', paymentType: 'Bank Transfer', description: 'Final Payment', date: '2026-04-30' },
      
      // Expenses (from MOCK_FINANCES & PROJECT_LOGS)
      { project: pSkyline._id, amount: 200000, type: 'Expense', category: 'Materials', paymentType: 'UPI', description: 'Materials purchase', date: '2026-04-05' },
      { project: pSkyline._id, amount: 50000, type: 'Expense', category: 'Labor', paymentType: 'Cash', description: 'Labor payout', date: '2026-04-10' },
      { project: pSkyline._id, amount: 12000, type: 'Expense', category: 'Transportation', paymentType: 'Bank Transfer', description: 'Steel Delivery Truck', date: '2026-04-23' },
      { project: pSkyline._id, amount: 25000, type: 'Expense', category: 'Rental', paymentType: 'Bank Transfer', description: 'Excavator Model X', date: '2026-04-22', days: 2 }
    ];
    await Finance.insertMany(finances);

    // Add labor expenses to finance to keep database synced with worker logs
    for (const log of dailyLogs) {
      if (log.wageAtTime > 0) {
        await Finance.create({
          project: log.project,
          amount: log.wageAtTime,
          type: 'Expense',
          category: 'Labor',
          description: `Labor wage for worker log on ${log.date}`,
          date: log.date
        });
      }
    }

    // Add material usage expenses to finance to sync with usage logs
    for (const usage of materialUsage) {
      const val = usage.quantity * usage.distributionRate;
      await Finance.create({
        project: usage.project,
        amount: val,
        type: 'Expense',
        category: 'Materials',
        description: `Material distribution: ${usage.quantity} units`,
        date: usage.date
      });
    }

    console.log('Database seeded successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
