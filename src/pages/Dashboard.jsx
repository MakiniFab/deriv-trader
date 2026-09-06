import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = auth.getToken();

  const handleLogout = () => {
    auth.logout();
    navigate('/', { replace: true });
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Trading Dashboard</h2>
      <div style={styles.card}>
        <h3>Connection Info</h3>
        <p><strong>Status:</strong> <span style={{ color: 'green' }}>Connected to Deriv API</span></p>
        <p><strong>Active Access Token:</strong> <code>{token ? `${token.substring(0, 16)}...` : 'None'}</code></p>
      </div>
      <button onClick={() => navigate('/account')} style={{ padding: '10px 20px', marginRight: '10px' }}>
        View Account Details
      </button>
      <button onClick={handleLogout} style={styles.logoutBtn}>
        Log Out
      </button>
    </div>
  );
}

const styles = {
  card: { padding: '20px', backgroundColor: '#f6f8fa', border: '1px solid #e1e4e8', borderRadius: '6px', margin: '20px 0' },
  logoutBtn: { padding: '10px 20px', backgroundColor: '#24292e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};