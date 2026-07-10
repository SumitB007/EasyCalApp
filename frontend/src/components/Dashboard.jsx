import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import ImageUploader from './ImageUploader';
import ResultCard from './ResultCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [topImage, setTopImage] = useState(null);
  const [sideImage, setSideImage] = useState(null);
  const [topPreview, setTopPreview] = useState('');
  const [sidePreview, setSidePreview] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [foodsList, setFoodsList] = useState([]);
  const [showFoods, setShowFoods] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [mealAdded, setMealAdded] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user profile
    fetch('http://0.0.0.0:8000/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setConsumedCalories(data.daily_consumed_calories || 0);
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });

    // Fetch supported foods
    fetch('http://0.0.0.0:8000/foods')
      .then(res => res.json())
      .then(data => {
        if (data && data.supported_foods) {
          setFoodsList(data.supported_foods);
        }
      })
      .catch(err => console.error("Could not fetch supported foods", err));
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTopImage = (file, preview) => {
    setTopImage(file);
    setTopPreview(preview);
    setResult(null);
    setMealAdded(false);
    setError('');
  };

  const handleSideImage = (file, preview) => {
    setSideImage(file);
    setSidePreview(preview);
    setResult(null);
    setMealAdded(false);
    setError('');
  };

  const handleCalculate = async () => {
    if (!topImage || !sideImage) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image1', topImage);
    formData.append('image2', sideImage);

    try {
      const response = await fetch('http://0.0.0.0:8000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to analyze images.');
      }

      setResult(data);
      setMealAdded(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCalories = async () => {
    if (result && result.calories && !mealAdded) {
      setConsumedCalories(prev => prev + result.calories);
      setMealAdded(true);

      try {
        const token = localStorage.getItem('token');
        await fetch('http://0.0.0.0:8000/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ consumed_calories: result.calories })
        });
      } catch (err) {
        console.error("Failed to sync calories with backend:", err);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return <div className="app-container"><div className="spinner" style={{ margin: 'auto' }}></div></div>;

  return (
    <div className="app-container">
      <motion.div
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontWeight: 500 }}>Welcome, <span className="accent-text">{user.name}</span></h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={() => navigate('/statistics')}
              style={{ 
                background: 'var(--accent-color)', 
                color: 'var(--bg-color)', 
                border: 'none', 
                borderRadius: '8px', 
                padding: '8px 16px', 
                fontWeight: 600, 
                cursor: 'pointer' 
              }}
            >
              Statistics
            </button>
            <div style={{ position: 'relative' }} ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--glass-border)',
                borderRadius: '50%',
                width: '45px',
                height: '45px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-color)' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: '60px',
                    right: '0',
                    width: '320px',
                    padding: '24px',
                    zIndex: 100,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '60px', height: '60px', background: 'var(--accent-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{user.name}</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Age</p>
                      <p style={{ margin: 0, fontWeight: 500 }}>{user.age} yrs</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gender</p>
                      <p style={{ margin: 0, fontWeight: 500, textTransform: 'capitalize' }}>{user.gender}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Height</p>
                      <p style={{ margin: 0, fontWeight: 500 }}>{user.height_cm} cm</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Weight</p>
                      <p style={{ margin: 0, fontWeight: 500 }}>{user.weight_kg} kg</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Activity Level</p>
                      <p style={{ margin: 0, fontWeight: 500, textTransform: 'capitalize' }}>{user.activity_level.replace('_', ' ')}</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>BMR (Base Calories)</p>
                      <p style={{ margin: 0, fontWeight: 500 }}>{Math.round(user.bmr)} kcal</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(240, 46, 101, 0.2)',
                      color: '#ff8fa3',
                      border: '1px solid rgba(240, 46, 101, 0.4)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(240, 46, 101, 0.3)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(240, 46, 101, 0.2)'}
                  >
                    Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', marginBottom: '40px', display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '220px', height: '220px' }}>
            <svg width="220" height="220" viewBox="0 0 220 220">
              <defs>
                <linearGradient id="calGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff8fa3" />
                  <stop offset="100%" stopColor="#ff4d6d" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              <motion.circle 
                cx="110" cy="110" r="90" 
                fill="none" 
                stroke="url(#calGradient)" 
                strokeWidth="16"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={2 * Math.PI * 90 - ((Math.min(consumedCalories / user.daily_calorie_goal, 1)) * 2 * Math.PI * 90)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                transform="rotate(-90 110 110)"
                filter="url(#glow)"
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Consumed</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{Math.round(consumedCalories)}</span>
              </div>
              <span className="text-muted" style={{ fontSize: '1rem', marginTop: '4px' }}>/ {Math.round(user.daily_calorie_goal)} kcal</span>
            </div>
          </div>
        </div>

        <h1 className="gradient-text">EasyCal Scanner</h1>
        <p>Advanced computer vision for precise food volume and calorie estimation.</p>

        <button className="btn-secondary" onClick={() => setShowFoods(!showFoods)}>
          {showFoods ? 'Hide Supported Foods' : 'View Supported Foods'}
        </button>

        <AnimatePresence>
          {showFoods && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="foods-list"
            >
              {foodsList.map(food => (
                <span key={food} className="food-badge glass-panel">{food}</span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="main-content">
        <motion.div
          className="upload-section"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="images-container">
            <ImageUploader
              label="Top View (with coin)"
              onFileSelect={handleTopImage}
              preview={topPreview}
            />
            <ImageUploader
              label="Side View (with coin)"
              onFileSelect={handleSideImage}
              preview={sidePreview}
            />
          </div>

          <motion.button
            className="btn-primary"
            onClick={handleCalculate}
            disabled={!topImage || !sideImage || loading}
            whileHover={!topImage || !sideImage || loading ? {} : { scale: 1.02 }}
            whileTap={!topImage || !sideImage || loading ? {} : { scale: 0.98 }}
          >
            {loading ? 'Analyzing...' : 'Calculate Calories'}
          </motion.button>
        </motion.div>

        <motion.div
          className="results-section"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <ResultCard 
            result={result} 
            loading={loading} 
            error={error} 
            onAddCalories={handleAddCalories} 
            added={mealAdded} 
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
