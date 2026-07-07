import React from 'react';
import { MOCK_WORKERS, PROJECT_LOGS, MOCK_PROJECTS } from '../mockData';

const formatRupee = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const Reports = () => {
  // We want to show a report of laborers, the sites they've been on, and their rate + total earnings
  const laborLogs = PROJECT_LOGS.filter(log => log.type === 'Labor');
  
  // Aggregate by worker
  const aggregatedData = {};
  
  // Initialize with all workers based on MOCK_WORKERS
  MOCK_WORKERS.forEach(worker => {
    aggregatedData[worker.name] = {
      name: worker.name,
      role: worker.role,
      wageRate: worker.wage,
      sitesWorked: new Set(),
      totalEarned: 0,
      totalDays: 0
    };
  });
  
  // Process actual logs
  laborLogs.forEach(log => {
    // If worker not found in mock, create an entry
    if (!aggregatedData[log.name]) {
      aggregatedData[log.name] = {
        name: log.name,
        role: log.role,
        wageRate: log.cost / log.days || 0, // Fallback rate calculation
        sitesWorked: new Set(),
        totalEarned: 0,
        totalDays: 0
      };
    }
    
    // Attach project name
    const project = MOCK_PROJECTS.find(p => p.id === log.projectId);
    if (project) {
      aggregatedData[log.name].sitesWorked.add(project.name);
    }
    
    aggregatedData[log.name].totalEarned += log.cost;
    aggregatedData[log.name].totalDays += log.days;
  });

  const reportRows = Object.values(aggregatedData);

  return (
    <div className="reports-container">
      <div className="page-header">
        <h1 className="page-title">Labor & Wage Reporting</h1>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
          Worker Assignment & Earnings Summary
        </h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Laborer Name</th>
                <th>Role</th>
                <th>Daily Rate</th>
                <th>Sites Worked On</th>
                <th>Total Days Logged</th>
                <th>Total Disbursed</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{row.name}</td>
                  <td>{row.role}</td>
                  <td style={{ color: '#FDB813' }}>{formatRupee(row.wageRate)}</td>
                  <td>
                    {row.sitesWorked.size > 0 
                      ? Array.from(row.sitesWorked).join(', ') 
                      : <span style={{ color: '#A0A0A0' }}>Unassigned</span>
                    }
                  </td>
                  <td>{row.totalDays}</td>
                  <td className="text-success">{formatRupee(row.totalEarned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
