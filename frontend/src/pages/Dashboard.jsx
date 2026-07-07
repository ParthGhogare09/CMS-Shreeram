import React from 'react';
import { 
  Users, Package, IndianRupee, TrendingDown, AlertTriangle,
  CheckSquare, FileText, Settings, Briefcase, MapPin
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useCMS } from '../context/CMSContext';
import SkeletonLoader from '../components/SkeletonLoader';

const RECENT_ACTIVITIES = [
  { id: 1, title: 'Low Stock Warning: Cement (Only 10 bags left)', time: 'Today, 11:00 AM', type: 'warning', icon: <AlertTriangle size={18}/>, bg: '#fee2e2', color: '#ef4444' },
  { id: 2, title: 'Received payment of ₹1,50,000', time: 'Yesterday, 05:20 PM', type: 'income', icon: <IndianRupee size={18}/>, bg: '#fef3c7', color: '#f59e0b' },
  { id: 3, title: 'New labour added (Ramesh)', time: 'Yesterday, 04:45 PM', type: 'labour', icon: <Users size={18}/>, bg: '#d1fae5', color: '#10b981' },
  { id: 4, title: 'Expense added (Transportation)', time: 'Yesterday, 02:30 PM', type: 'expense', icon: <TrendingDown size={18}/>, bg: '#fee2e2', color: '#ef4444' }
];

const formatRupee = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { dashboardStats, loading } = useCMS();

  if (loading) {
    return <SkeletonLoader type="dashboard" />;
  }

  const { activeWorkers, totalIncome, totalExpense, amountToReceive, laborStatusChart, expenseData } = dashboardStats;

  return (
    <div className="dashboard-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ fontSize: '1.25rem' }}>Dashboard Overview</h1>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card summary-card" style={{ backgroundColor: '#f0fdf4', borderColor: '#d1fae5', padding: '1rem' }}>
          <div className="summary-icon-box" style={{ backgroundColor: '#d1fae5', color: '#10b981', width: '40px', height: '40px' }}>
            <Users size={20} />
          </div>
          <div className="summary-content">
            <div className="summary-title" style={{ fontSize: '0.8rem' }}>Active Workers</div>
            <div className="summary-value" style={{ fontSize: '1.2rem' }}>{activeWorkers}</div>
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
          <div className="summary-icon-box" style={{ backgroundColor: '#fee2e2', color: '#ef4444', width: '40px', height: '40px' }}>
            <TrendingDown size={20} />
          </div>
          <div className="summary-content">
            <div className="summary-title" style={{ fontSize: '0.8rem' }}>Total Expense</div>
            <div className="summary-value" style={{ fontSize: '1.2rem' }}>{formatRupee(totalExpense)}</div>
            <div className="summary-trend trend-down" style={{ fontSize: '0.75rem' }}>Across All Sites</div>
          </div>
        </div>

        <div className="card summary-card" style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe', padding: '1rem' }}>
          <div className="summary-icon-box" style={{ backgroundColor: '#dbeafe', color: '#3b82f6', width: '40px', height: '40px' }}>
            <IndianRupee size={20} />
          </div>
          <div className="summary-content">
            <div className="summary-title" style={{ fontSize: '0.8rem' }}>Amount To Receive</div>
            <div className="summary-value" style={{ fontSize: '1.2rem' }}>{formatRupee(amountToReceive)}</div>
            <div className="summary-trend trend-up" style={{ fontSize: '0.75rem' }}>Pending Payments</div>
          </div>
        </div>
      </div>

      <div className="dashboard-main-row" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Income vs Expense (This Month)</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={expenseData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}K`} />
                <Tooltip />
                <Legend iconType="circle" verticalAlign="top" height={24} wrapperStyle={{ fontSize: '0.8rem' }}/>
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Labour Status</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={laborStatusChart}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="70%"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {laborStatusChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle"
                  wrapperStyle={{ fontSize: '0.8rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

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
            <div className="quick-icon-wrapper" style={{ color: '#8b5cf6', width: '32px', height: '32px' }}><Users size={18} /></div>
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
            <div className="quick-icon-wrapper" style={{ color: '#ef4444', width: '32px', height: '32px' }}><IndianRupee size={18} /></div>
            Finance Mgt.
          </div>
          <div className="quick-action-btn" onClick={() => navigate('/settings')} style={{ padding: '0.5rem', gap: '0.25rem', fontSize: '0.75rem' }}>
            <div className="quick-icon-wrapper" style={{ color: '#3b82f6', width: '32px', height: '32px' }}><Settings size={18} /></div>
            Settings
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
