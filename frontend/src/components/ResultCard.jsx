import { motion } from 'framer-motion';
import './ResultCard.css';

const ResultCard = ({ result, loading, error, onAddCalories, added }) => {
  if (loading) {
    return (
      <div className="result-card-container glass-panel loading-state">
        <div className="spinner"></div>
        <h3>Analyzing images...</h3>
        <p className="text-muted">Estimating volume and calculating calories</p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="result-card-container glass-panel error-state"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3>Oops!</h3>
        <p className="text-muted">{error}</p>
      </motion.div>
    );
  }

  if (!result) {
    return (
      <div className="result-card-container glass-panel empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.792 0-5.484-.28-8.135-.811-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
        <h3>Ready to Calculate</h3>
        <p className="text-muted">Upload top and side images of your food with a calibration coin.</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="result-card-container glass-panel success-state"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', bounce: 0.4 }}
    >
      <div className="result-header">
        <h2 className="gradient-text">{result.food_item.charAt(0).toUpperCase() + result.food_item.slice(1)}</h2>
        <span className="confidence-badge">
          {Math.round(result.confidence_score * 100)}% Match
        </span>
      </div>

      <div className="result-stats">
        <div className="stat-box">
          <span className="stat-label">Estimated Volume</span>
          <span className="stat-value">{result.volume_cm3} <span className="unit">cm³</span></span>
        </div>
        
        <div className="stat-box primary-stat">
          <span className="stat-label">Total Calories</span>
          <span className="stat-value accent-text">{result.calories} <span className="unit">kcal</span></span>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <button 
          className="btn-primary" 
          onClick={onAddCalories}
          disabled={added}
          style={{ width: '100%', background: added ? 'var(--success-color, #20c997)' : '' }}
        >
          {added ? 'Added to Daily Log' : 'Add to Daily Log'}
        </button>
      </div>

      <div className="glow-effect"></div>
    </motion.div>
  );
};

export default ResultCard;
