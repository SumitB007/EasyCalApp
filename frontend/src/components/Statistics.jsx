import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';

const Statistics = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user and logs in parallel
    Promise.all([
      fetch('http://0.0.0.0:8000/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json()),
      fetch('http://0.0.0.0:8000/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json())
    ])
    .then(([userData, logsData]) => {
      setUser(userData);
      // Ensure logsData is array and sorted by date
      const sortedLogs = Array.isArray(logsData) 
        ? logsData.sort((a, b) => new Date(a.date) - new Date(b.date))
        : [];
      setLogs(sortedLogs);
    })
    .catch(err => {
      console.error(err);
      if (err.message.includes('Unauthorized')) navigate('/login');
    })
    .finally(() => setLoading(false));
  }, [navigate]);

  if (loading || !user) {
    return <div className="app-container"><div className="spinner" style={{ margin: 'auto' }}></div></div>;
  }

  // Generate last 7 days of data for the weekly chart
  const weeklyData = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const log = logs.find(l => l.date === dateStr);
    weeklyData.push({
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      calories: log ? Math.round(log.consumed_calories) : 0
    });
  }

  // Calculate monthly stats
  const currentMonthStr = today.toISOString().slice(0, 7); // YYYY-MM
  const monthlyLogs = logs.filter(l => l.date.startsWith(currentMonthStr));
  const totalMonthlyCalories = monthlyLogs.reduce((acc, l) => acc + l.consumed_calories, 0);
  const avgMonthlyCalories = monthlyLogs.length ? totalMonthlyCalories / monthlyLogs.length : 0;

  return (
    <div className="app-container">
      <motion.div
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 className="gradient-text" style={{ margin: 0, fontSize: '2.5rem' }}>Statistics</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Track your calorie trends</p>
          </div>
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/dashboard')}
            style={{ margin: 0 }}
          >
            Back to Dashboard
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
      >
        {/* Weekly Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Last 7 Days</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                />
                <ReferenceLine y={user.daily_calorie_goal} stroke="#ffb703" strokeDasharray="3 3" label={{ position: 'top', value: 'Goal', fill: '#ffb703', fontSize: 12 }} />
                <Bar dataKey="calories" fill="var(--accent-color)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ marginTop: 0, marginBottom: '24px' }}>This Month</h3>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Daily Average</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
                {Math.round(avgMonthlyCalories)}
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>kcal</p>
            </div>
            
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Days Tracked</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
                {monthlyLogs.length}
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>days</p>
            </div>
          </div>

          <div style={{ background: 'rgba(255,183,3,0.1)', border: '1px solid rgba(255,183,3,0.3)', padding: '16px', borderRadius: '12px' }}>
            <p style={{ margin: 0, color: '#ffb703', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Your daily goal is <strong>{Math.round(user.daily_calorie_goal)} kcal</strong>. 
              {avgMonthlyCalories > user.daily_calorie_goal 
                ? " You're trending slightly above your goal this month." 
                : " Great job staying within your goals!"}
            </p>
          </div>
        </div>

        {/* Historical Trend Line (Full History) */}
        <div className="glass-panel" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0, marginBottom: '24px' }}>All-Time Trend</h3>
          <div style={{ width: '100%', height: '300px' }}>
            {logs.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={logs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-muted)" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString()}
                  />
                  <ReferenceLine y={user.daily_calorie_goal} stroke="#ffb703" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="consumed_calories" stroke="var(--accent-color)" strokeWidth={3} dot={{ fill: 'var(--accent-color)', r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No historical data yet. Log meals to see your trend!
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Statistics;
