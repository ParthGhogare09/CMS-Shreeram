import React, { useState } from 'react';
import { Building2, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useCMS } from '../context/CMSContext';

const Login = () => {
  const { loginAction } = useCMS();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    // Simulate network delay for a premium experience
    setTimeout(() => {
      const success = loginAction(username, password);
      setIsSubmitting(false);
      if (!success) {
        setErrorMsg('Invalid username or password!');
      }
    }, 800);
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg-overlay"></div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <Building2 size={36} color="#f29b20" />
          </div>
          <h1 className="login-title">Shreeram</h1>
          <p className="login-subtitle">Construction Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errorMsg && (
            <div className="login-error-alert">
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="login-input-group">
            <label>Username</label>
            <div className="login-input-wrapper">
              <User size={16} className="login-input-icon" />
              <input 
                type="text" 
                required 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Enter username (admin)" 
              />
            </div>
          </div>

          <div className="login-input-group">
            <label>Password</label>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Enter password (admin123)" 
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-submit-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="login-loader"></div>
            ) : (
              "Sign In to Portal"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 Shreeram Construction. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
