import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../config';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    gender: 'male',
    height_cm: '',
    weight_kg: '',
    activity_level: 'sedentary'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          height_cm: parseFloat(formData.height_cm),
          weight_kg: parseFloat(formData.weight_kg)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to register');
      }

      // After successful registration, log them in automatically
      const loginFormData = new URLSearchParams();
      loginFormData.append('username', formData.email); // FastAPI OAuth2 expects 'username' field to hold the email
      loginFormData.append('password', formData.password);

      const loginResponse = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginFormData
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        localStorage.setItem('token', loginData.access_token);
        navigate('/dashboard');
      } else {
        navigate('/login');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div 
        className="glass-panel auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="gradient-text">Create Account</h2>
        <p className="text-muted">Enter your biometrics to calculate your daily goals.</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" required onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" required onChange={handleChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" required onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input type="number" name="age" required onChange={handleChange} min="1" />
            </div>
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '20px' }}>
            <label style={{ margin: 0 }}>Gender</label>
            <div className="radio-group" style={{ marginTop: 0 }}>
              <label className="radio-label">
                <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleChange} />
                <span>Male</span>
              </label>
              <label className="radio-label">
                <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleChange} />
                <span>Female</span>
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Height (cm)</label>
              <input type="number" name="height_cm" required onChange={handleChange} min="1" step="0.1" />
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" name="weight_kg" required onChange={handleChange} min="1" step="0.1" />
            </div>
          </div>

          <div className="form-group">
            <label>Daily Activity Level</label>
            <select name="activity_level" onChange={handleChange} value={formData.activity_level}>
              <option value="sedentary">Sedentary (Little to no exercise)</option>
              <option value="lightly_active">Lightly active (1-3 days/week)</option>
              <option value="moderately_active">Moderately active (3-5 days/week)</option>
              <option value="very_active">Very active (6-7 days/week)</option>
              <option value="extra_active">Extra active (Intense physical job)</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login" className="accent-text">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
