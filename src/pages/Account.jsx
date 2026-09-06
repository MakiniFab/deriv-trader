import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';
import { fetchAccountDetails } from '../utils/derivApi';

export default function Account() {
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h2>Account Details</h2>
      </div>

      {loading && <p>Loading user profile details...</p>}

      {error && (
        <div style={styles.errorCard}>
          <p><strong>Error loading account data:</strong> {error}</p>
        </div>
      )}

      {account && (
        <div style={styles.grid}>
          {/* Main Account Summary */}
          <div style={styles.card}>
            <h3>User Identity</h3>
            <p><strong>Full Name:</strong> {account.fullName}</p>
            <p><strong>Email Address:</strong> {account.email}</p>
            <p>
              <strong>Account Classification:</strong>{' '}
              <span style={account.isVirtual ? styles.demoBadge : styles.realBadge}>
                {account.accountType} Account
              </span>
            </p>
          </div>

          {/* Balance & Active ID */}
          <div style={styles.card}>
            <h3>Active Account Status</h3>
            <p><strong>Active Login ID:</strong> <code>{account.loginid}</code></p>
            <p><strong>Current Balance:</strong></p>
            <h2 style={styles.balanceText}>
              {account.currency} {Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
          </div>

          {/* Linked Accounts List */}
          <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
            <h3>All Connected Accounts</h3>
            <div style={styles.accountTable}>
              {account.accountList.map((acc) => (
                <div key={acc.loginid} style={styles.tableRow}>
                  <div>
                    <strong>{acc.loginid}</strong>
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6e7681' }}>
                      ({acc.is_virtual ? 'Demo' : 'Real'})
                    </span>
                  </div>
                  <div>
                    {acc.loginid === account.loginid ? (
                      <span style={styles.activeTag}>Active Session</span>
                    ) : (
                      <span style={{ color: '#8b949e', fontSize: '13px' }}>Available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '30px', maxWidth: '850px', margin: '0 auto', fontFamily: 'sans-serif' },
  header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' },
  backBtn: { padding: '8px 14px', backgroundColor: '#24292e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  balanceText: { fontSize: '28px', color: '#2da44e', margin: '5px 0' },
  realBadge: { backgroundColor: '#dafbe1', color: '#1a7f37', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px' },
  demoBadge: { backgroundColor: '#ddf4ff', color: '#0969da', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px' },
  accountTable: { marginTop: '10px', borderTop: '1px solid #e1e4e8' },
  tableRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e1e4e8', alignItems: 'center' },
  activeTag: { backgroundColor: '#238636', color: '#fff', fontSize: '12px', padding: '2px 8px', borderRadius: '10px' },
  errorCard: { padding: '15px', backgroundColor: '#ffebe9', color: '#cf222e', borderRadius: '6px' }
};