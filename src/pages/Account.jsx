// src/pages/Account.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';
import { subscribeToBalance } from '../utils/derivApi';

export default function Account() {
  const navigate = useNavigate();
  const token = auth.getToken();

  const [balanceData, setBalanceData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    // Subscribe to balance updates
    const unsubscribe = subscribeToBalance(
      token,
      (data) => {
        setBalanceData(data);
        setLoading(false);
      },
      (errMessage) => {
        setError(errMessage);
        setLoading(false);
      }
    );

    // Clean up WebSocket subscription when navigating away
    return () => unsubscribe();
  }, [token, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h2>Account Balance</h2>
      </div>

      {loading && <p>Connecting to live balance stream...</p>}

      {error && (
        <div style={styles.errorCard}>
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {balanceData && (
        <div style={styles.card}>
          <h3>Live Account Balance</h3>
          <p><strong>Login ID:</strong> <code>{balanceData.loginid}</code></p>
          <p><strong>Subscription Status:</strong> <span style={styles.liveBadge}>● Streaming Live</span></p>
          <h1 style={styles.balanceText}>
            {balanceData.currency} {Number(balanceData.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h1>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '30px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' },
  header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' },
  backBtn: { padding: '8px 14px', backgroundColor: '#24292e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  card: { padding: '25px', backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  balanceText: { fontSize: '36px', color: '#2da44e', margin: '15px 0 0 0' },
  liveBadge: { color: '#1a7f37', fontWeight: 'bold', fontSize: '13px' },
  errorCard: { padding: '15px', backgroundColor: '#ffebe9', color: '#cf222e', borderRadius: '6px' }
};