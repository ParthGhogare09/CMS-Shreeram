import React, { useMemo } from 'react';
import { 
  Users, Package, IndianRupee, TrendingDown, AlertTriangle,
  Settings, MapPin
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
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
  const { dashboardStats, workers, finances, dailyLogs, usageLogs, loading } = useCMS();

  // 1. Calculate Real Income vs Expense Bar Graph Data
  const incomeVsExpenseData = useMemo(() => {
    if (dashboardStats && dashboardStats.expenseData && dashboardStats.expenseData.length > 0) {
      return dashboardStats.expenseData.map(item => ({
        name: item.name,
        Income: Number(item.income || 0),
        Expense: Number(item.expense || 0)
      }));
    }

    // Dynamic aggregation fallback from state
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap = {};
    months.forEach((m, idx) => {
      monthMap[idx] = { name: m, Income: 0, Expense: 0 };
    });

    if (finances && finances.incomes) {
      finances.incomes.forEach(inc => {
        if (inc.date) {
          const m = new Date(inc.date).getMonth();
          if (monthMap[m]) monthMap[m].Income += Number(inc.amount || 0);
        }
      });
    }

    if (dailyLogs) {
      dailyLogs.forEach(log => {
        if (log.date) {
          const m = new Date(log.date).getMonth();
          if (monthMap[m]) monthMap[m].Expense += Number(log.wage || 0);
        }
      });
    }

    if (usageLogs) {
      usageLogs.forEach(u => {
        if (u.date) {
          const m = new Date(u.date).getMonth();
          const cost = Number(u.quantity || 0) * Number(u.distributionRate || 0);
          if (monthMap[m]) monthMap[m].Expense += cost;
        }
      });
    }

    const aggregated = Object.values(monthMap);
    const hasData = aggregated.some(item => item.Income > 0 || item.Expense > 0);
    
    if (!hasData) {
      return [
        { name: 'Jan', Income: 450000, Expense: 280000 },
        { name: 'Feb', Income: 620000, Expense: 340000 },
        { name: 'Mar', Income: 890000, Expense: 510000 },
        { name: 'Apr', Income: 750000, Expense: 420000 },
        { name: 'May', Income: 980000, Expense: 610000 },
        { name: 'Jun', Income: 1120000, Expense: 730000 }
      ];
    }

    return aggregated.filter(m => m.Income > 0 || m.Expense > 0);
  }, [dashboardStats, finances, dailyLogs, usageLogs]);

  // 2. Calculate Labour Role Breakdown (Mason, Electrician, Plumber, Helper, Foreman)
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
        {/* Income vs Expense Bar Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Income vs Expense Bar Chart</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={incomeVsExpenseData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4dec8" />
                <XAxis dataKey="name" stroke="#786c66" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#786c66" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}K`} />
                <Tooltip formatter={(value) => [formatRupee(value), '']} />
                <Legend iconType="circle" verticalAlign="top" height={28} wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="Income" name="Total Income (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" name="Total Expense (₹)" fill="#f4511e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Labour Role Counts Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Labour Roster Breakdown by Type</h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Count of active workers by designation (Mason, Electrician, Plumber, etc.)</div>
          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={labourRoleData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4dec8" />
                <XAxis type="number" stroke="#786c66" fontSize={10} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#786c66" fontSize={11} width={80} tickLine={false} axisLine={false} />
                <Tooltip formatter={(val) => [`${val} Workers`, 'Count']} />
                <Bar dataKey="count" name="Worker Count" radius={[0, 4, 4, 0]}>
                  {labourRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
