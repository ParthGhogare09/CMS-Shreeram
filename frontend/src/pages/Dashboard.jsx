import React, { useMemo } from 'react';
import { 
  Users, Package, IndianRupee, TrendingDown, AlertTriangle,
  Settings, MapPin
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useCMS } from '../context/CMSContext';
import SkeletonLoader from '../components/SkeletonLoader';

const RECENT_ACTIVITIES = [
  { id: 1, title: 'Low Stock Warning: Cement (Only 10 bags left)', time: 'Today, 11:00 AM', type: 'warning', icon: <AlertTriangle size={18}/>, bg: '#fee2e2', color: '#ef4444' },
  { id: 2, title: 'Received site payment of ₹1,50,000', time: 'Yesterday, 05:20 PM', type: 'income', icon: <IndianRupee size={18}/>, bg: '#fef3c7', color: '#f4511e' },
  { id: 3, title: 'New labour added to roster', time: 'Yesterday, 04:45 PM', type: 'labour', icon: <Users size={18}/>, bg: '#d1fae5', color: '#10b981' },
  { id: 4, title: 'Material usage logged (Steel bars)', time: 'Yesterday, 02:30 PM', type: 'expense', icon: <TrendingDown size={18}/>, bg: '#fee2e2', color: '#ef4444' }
];

const formatRupee = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { dashboardStats, projects, workers, finances, dailyLogs, usageLogs, loading } = useCMS();

  // 1. Calculate Real Income vs Expense Bar Graph Data using Original Project Values
  const projectIncomeVsExpenseData = useMemo(() => {
    if (projects && projects.length > 0) {
      return projects.map(proj => {
        const pName = proj.name;
        // Sum Income for project
        const incSum = (finances && finances.incomes) 
          ? finances.incomes.filter(i => i.project === pName || (i.projectId && (i.projectId === proj.id || i.projectId === proj._id))).reduce((acc, i) => acc + Number(i.amount || 0), 0)
          : Number(proj.collected || 0);
        const income = incSum > 0 ? incSum : Number(proj.collected || 0);

        // Sum Expense for project (Labour + Material usage + Manual expenses)
        const labourExpense = dailyLogs ? dailyLogs.filter(l => l.project === pName).reduce((acc, l) => acc + Number(l.wage || 0), 0) : 0;
        const matExpense = usageLogs ? usageLogs.filter(u => u.project === pName).reduce((acc, u) => acc + (Number(u.quantity || 0) * Number(u.distributionRate || 0)), 0) : 0;
        
        const calcExpense = labourExpense + matExpense;
        const expense = calcExpense > 0 ? calcExpense : Number(proj.spent || 0);

        return {
          name: pName.length > 12 ? pName.substring(0, 12) + '...' : pName,
          fullName: pName,
          Income: income,
          Expense: expense
        };
      });
    }

    return [
      { name: 'City Center', fullName: 'City Center Mall', Income: 12500000, Expense: 8900000 },
      { name: 'Riverside Villa', fullName: 'Riverside Villa', Income: 6500000, Expense: 4200000 },
      { name: 'Govt. Flyover', fullName: 'Govt. Flyover', Income: 21000000, Expense: 14800000 }
    ];
  }, [projects, finances, dailyLogs, usageLogs]);

  // 2. Calculate Circular Labour Breakdown Data by Role Count (Mason, Electrician, Plumber, Helper, Foreman, Custom roles)
  const labourRoleData = useMemo(() => {
    const roleCounts = {};

    if (workers && workers.length > 0) {
      workers.forEach(w => {
        const role = w.role || 'Unspecified';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
    } else {
      roleCounts['Mason'] = 5;
      roleCounts['Electrician'] = 3;
      roleCounts['Plumber'] = 2;
      roleCounts['Helper'] = 8;
      roleCounts['Foreman'] = 2;
    }

    const roleColors = {
      'Foreman': '#f4511e',
      'Mason': '#e64a19',
      'Electrician': '#ff7043',
      'Plumber': '#ff8a65',
      'Helper': '#ffab91',
      'Carpenter': '#d84315',
      'Welder': '#bf360c',
      'Painter': '#f57c00',
      'Unspecified': '#8d6e63'
    };

    return Object.keys(roleCounts).map(role => ({
      name: role,
      value: roleCounts[role],
      count: roleCounts[role],
      color: roleColors[role] || '#f4511e'
    }));
  }, [workers]);

  if (loading) {
    return <SkeletonLoader type="dashboard" />;
  }

  const { activeWorkers, totalIncome, totalExpense, amountToReceive } = dashboardStats;

  return (
    <div className="dashboard-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ fontSize: '1.25rem' }}>Dashboard Overview</h1>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card summary-card" style={{ backgroundColor: '#f0fdf4', borderColor: '#d1fae5', padding: '1rem' }}>
          <div className="summary-icon-box" style={{ backgroundColor: '#d1fae5', color: '#10b981', width: '40px', height: '40px' }}>
            <Users size={20} />
          </div>
          <div className="summary-content">
            <div className="summary-title" style={{ fontSize: '0.8rem' }}>Active Workers</div>
            <div className="summary-value" style={{ fontSize: '1.2rem' }}>{activeWorkers || workers.length || 0}</div>
            <div className="summary-trend trend-up" style={{ fontSize: '0.75rem' }}>Currently Active</div>
          </div>
        </div>

        <div className="card summary-card" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7', padding: '1rem' }}>
          <div className="summary-icon-box" style={{ backgroundColor: '#fef3c7', color: '#f59e0b', width: '40px', height: '40px' }}>
            <IndianRupee size={20} />
          </div>
          <div className="summary-content">
            <div className="summary-title" style={{ fontSize: '0.8rem' }}>Total Income</div>
            <div className="summary-value" style={{ fontSize: '1.2rem' }}>{formatRupee(totalIncome)}</div>
            <div className="summary-trend trend-up" style={{ fontSize: '0.75rem' }}>From All Projects</div>
          </div>
        </div>

        <div className="card summary-card" style={{ backgroundColor: '#fef2f2', borderColor: '#fee2e2', padding: '1rem' }}>
          <div className="summary-icon-box" style={{ backgroundColor: '#fee2e2', color: '#f4511e', width: '40px', height: '40px' }}>
            <TrendingDown size={20} />
          </div>
          <div className="summary-content">
            <div className="summary-title" style={{ fontSize: '0.8rem' }}>Total Expense</div>
            <div className="summary-value" style={{ fontSize: '1.2rem', color: '#f4511e' }}>{formatRupee(totalExpense)}</div>
            <div className="summary-trend trend-down" style={{ fontSize: '0.75rem' }}>Across All Sites</div>
          </div>
        </div>

        <div className="card summary-card" style={{ backgroundColor: '#fbe9e7', borderColor: '#ffccbc', padding: '1rem' }}>
          <div className="summary-icon-box" style={{ backgroundColor: '#ffccbc', color: '#f4511e', width: '40px', height: '40px' }}>
            <IndianRupee size={20} />
          </div>
          <div className="summary-content">
            <div className="summary-title" style={{ fontSize: '0.8rem' }}>Amount To Receive</div>
            <div className="summary-value" style={{ fontSize: '1.2rem', color: '#f4511e' }}>{formatRupee(amountToReceive)}</div>
            <div className="summary-trend trend-up" style={{ fontSize: '0.75rem' }}>Pending Payments</div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="dashboard-main-row" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Project-Wise Income vs Expense Bar Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Project Income vs Expense Bar Chart</h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Calculated using original project financial values</div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={projectIncomeVsExpenseData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4dec8" />
                <XAxis dataKey="name" stroke="#786c66" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#786c66" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}K`} />
                <Tooltip formatter={(value, name, item) => [formatRupee(value), `${name} (${item.payload.fullName || ''})`]} />
                <Legend iconType="circle" verticalAlign="top" height={28} wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="Income" name="Project Income (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" name="Project Expense (₹)" fill="#f4511e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Circular Labour Breakdown Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Labour Circular Graph (By Role)</h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Count of active workers by designation (Mason, Electrician, Plumber, etc.)</div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={labourRoleData}
                  cx="50%"
                  cy="50%"
                  innerRadius="35%"
                  outerRadius="60%"
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, count }) => `${name}: ${count}`}
                  labelLine={true}
                >
                  {labourRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} Workers`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Clear Role & Count Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'center', marginTop: '0.4rem' }}>
            {labourRoleData.map((item, idx) => (
              <span 
                key={idx} 
                style={{ 
                  backgroundColor: item.color, 
                  color: '#ffffff', 
                  fontSize: '0.72rem', 
                  fontWeight: 700, 
                  padding: '0.2rem 0.55rem', 
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {item.name}: &nbsp;<strong>{item.count}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Recent Activities</h3>
          <div className="activity-list" style={{ height: 260, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {RECENT_ACTIVITIES.map(activity => (
              <div key={activity.id} className="activity-item" style={{ marginBottom: '0.5rem' }}>
                <div className="activity-icon" style={{ backgroundColor: activity.bg, color: activity.color, width: '30px', height: '30px' }}>
                  {activity.icon}
                </div>
                <div className="activity-details">
                  <div className="activity-desc" style={{ fontSize: '0.8rem', marginBottom: '0.1rem' }}>{activity.title}</div>
                  <div className="activity-time" style={{ fontSize: '0.7rem' }}>{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--color-text-main)', fontSize: '1rem' }}>Quick Access</div>
        <div className="quick-access-grid" style={{ gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <div className="quick-action-btn" onClick={() => navigate('/workers')} style={{ padding: '0.5rem', gap: '0.25rem', fontSize: '0.75rem' }}>
            <div className="quick-icon-wrapper" style={{ color: '#f4511e', width: '32px', height: '32px' }}><Users size={18} /></div>
            Labour Mgt.
          </div>
          <div className="quick-action-btn" onClick={() => navigate('/materials')} style={{ padding: '0.5rem', gap: '0.25rem', fontSize: '0.75rem' }}>
            <div className="quick-icon-wrapper" style={{ color: '#f59e0b', width: '32px', height: '32px' }}><Package size={18} /></div>
            Material Mgt.
          </div>
          <div className="quick-action-btn" onClick={() => navigate('/projects')} style={{ padding: '0.5rem', gap: '0.25rem', fontSize: '0.75rem' }}>
            <div className="quick-icon-wrapper" style={{ color: '#10b981', width: '32px', height: '32px' }}><MapPin size={18} /></div>
            Site Mgt.
          </div>
          <div className="quick-action-btn" onClick={() => navigate('/finance')} style={{ padding: '0.5rem', gap: '0.25rem', fontSize: '0.75rem' }}>
            <div className="quick-icon-wrapper" style={{ color: '#f4511e', width: '32px', height: '32px' }}><IndianRupee size={18} /></div>
            Finance Mgt.
          </div>
          <div className="quick-action-btn" onClick={() => navigate('/settings')} style={{ padding: '0.5rem', gap: '0.25rem', fontSize: '0.75rem' }}>
            <div className="quick-icon-wrapper" style={{ color: '#4e342e', width: '32px', height: '32px' }}><Settings size={18} /></div>
            Settings
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
