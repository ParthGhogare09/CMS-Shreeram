import React, { useState } from 'react';
import { User, Lock, Save } from 'lucide-react';

const Settings = () => {
  const [profile, setProfile] = useState({
    name: 'Admin',
    email: 'admin@shreeramconstruction.com',
    phone: '9876543210'
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleProfileSave = (e) => {
    e.preventDefault();
    setProfileMsg('Profile updated successfully!');
    setTimeout(() => setProfileMsg(''), 3000);
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMsg('New passwords do not match!');
      setTimeout(() => setPasswordMsg(''), 3000);
      return;
    }
    // Simulate API call to change password
    setPasswordMsg('Password changed successfully!');
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  return (
    <div className="settings-container">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Account Settings</h1>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', gap: '2rem' }}>
        {/* Profile Settings */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <User size={24} color="var(--color-primary)" />
            <h2 className="card-title" style={{ margin: 0 }}>Profile Settings</h2>
          </div>
          
          <form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                required
                value={profile.name} 
                onChange={e => setProfile({...profile, name: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ display: 'flex', gap: '1rem', flexDirection: 'row' }}>
              <div style={{ flex: 1 }}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  required
                  value={profile.email} 
                  onChange={e => setProfile({...profile, email: e.target.value})} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={profile.phone} 
                  onChange={e => setProfile({...profile, phone: e.target.value})} 
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <span className="text-success" style={{ fontWeight: 500 }}>{profileMsg}</span>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Save Profile
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Lock size={24} color="var(--color-danger)" />
            <h2 className="card-title" style={{ margin: 0 }}>Change Password</h2>
          </div>
          
          <form onSubmit={handlePasswordSave}>
            <div className="form-group">
              <label>Current Password</label>
              <input 
                type="password" 
                required
                value={passwords.currentPassword} 
                onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ display: 'flex', gap: '1rem', flexDirection: 'row' }}>
              <div style={{ flex: 1 }}>
                <label>New Password</label>
                <input 
                  type="password" 
                  required
                  value={passwords.newPassword} 
                  onChange={e => setPasswords({...passwords, newPassword: e.target.value})} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  value={passwords.confirmPassword} 
                  onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} 
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <span className={passwordMsg.includes('match') ? "text-danger" : "text-success"} style={{ fontWeight: 500 }}>
                {passwordMsg}
              </span>
              <button type="submit" className="btn" style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }}>
                <Save size={16} /> Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
