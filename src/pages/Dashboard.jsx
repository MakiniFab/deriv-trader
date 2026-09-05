import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';
import { fetchAccountDetails } from '../utils/derivApi';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = auth.getToken();

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    fetchAccountDetails(token)
      .then((data) => {
        setAccount(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [token]);

  const handleLogout = () => {
    auth.logout();
    navigate('/', { replace: true });
  };

  return (
    <div style={styles.container}>
      <h2>Trading Dashboard</h2>

      {loading && <p>Loading account balance and details...</p>}

      {error && (
        <div style={styles.errorCard}>
          <p><strong>Failed to load profile:</strong> {error}</p>
        </div>
      )}

      {account && (
        <div style={styles.grid}>
          {/* User Details Card */}
          <div style={styles.card}>
            <h3>Account Profile</h3>
            <p><strong>Name:</strong> {account.fullName}</p>
            <p><strong>Email:</strong> {account.email}</p>
            <p><strong>Account ID:</strong> <code>{account.loginid}</code></p>
          </div>

          {/* Balance Card */}
          <div style={styles.balanceCard}>
            <h3>Account Balance</h3>
            <h1 style={styles.balanceText}>
              {account.currency} {Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h1>
            <span style={styles.badge}>Live Session</span>
          </div>
        </div>
      )}

      <button onClick={handleLogout} style={styles.logoutBtn}>
        Log Out
      </button>
    </div>
  );
}

const styles = {
  container: { padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '20px 0' },
  card: { padding: '20px', backgroundColor: '#f6f8fa', border: '1px solid #e1e4e8', borderRadius: '8px' },
  balanceCard: { padding: '20px', backgroundColor: '#0e1525', color: '#fff', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  balanceText: { fontSize: '32px', margin: '10px 0', color: '#4caf50' },
  badge: { fontSize: '12px', backgroundColor: '#238636', color: '#fff', padding: '2px 8px', borderRadius: '12px', width: 'fit-content' },
  errorCard: { padding: '15px', backgroundColor: '#ffebe9', color: '#cf222e', borderRadius: '6px', margin: '10px 0' },
  logoutBtn: { padding: '10px 20px', backgroundColor: '#24292e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }
};