// src/pages/Account.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';
import { fetchUserAccounts, subscribeToBalance } from '../utils/derivApi';

export default function Account() {
  const navigate = useNavigate();
  const token = auth.getToken();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch user accounts on page load
  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    async function loadAccounts() {
      try {
        const accountList = await fetchUserAccounts(token);
        setAccounts(accountList);
        if (accountList.length > 0) {
          setSelectedAccount(accountList[0]);
        }
      } catch (err) {
        setError(err.message || 'Unable to fetch account list.');
      } finally {
        setLoading(false);
      }
    }

    loadAccounts();
  }, [token, navigate]);

  // 2. Subscribe to balance updates for the active selection
  useEffect(() => {
    if (!token || !selectedAccount) return;

    const unsubscribe = subscribeToBalance(
      token,
      (data) => {
        setBalanceData(data);
      },
      (errMessage) => {
        setError(errMessage);
      }
    );

    return () => unsubscribe();
  }, [token, selectedAccount]);

  if (loading) return <div style={styles.container}><p>Loading account details...</p></div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Dashboard
        </button>
        <h2>Account Overview</h2>
      </div>

      {error && (
        <div style={styles.errorCard}>
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {/* Account Selector */}
      {accounts.length > 0 && (
        <div style={styles.selectorGroup}>
          <label htmlFor="account-dropdown"><strong>Select Account: </strong></label>
          <select
            id="account-dropdown"
            value={selectedAccount?.loginid || ''}
            onChange={(e) => {
              const selected = accounts.find((a) => a.loginid === e.target.value);
              setSelectedAccount(selected);
            }}
            style={styles.select}
          >
            {accounts.map((acc) => (
              <option key={acc.loginid} value={acc.loginid}>
                {acc.loginid} — {acc.is_virtual ? 'Demo' : 'Real'} ({acc.currency})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Display Active Account Details */}
      {selectedAccount && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3>{selectedAccount.is_virtual ? 'Demo Trading Account' : 'Real Trading Account'}</h3>
            <span style={selectedAccount.is_virtual ? styles.demoBadge : styles.realBadge}>
              {selectedAccount.is_virtual ? 'DEMO' : 'REAL'}
            </span>
          </div>

          <p><strong>Login ID:</strong> <code>{selectedAccount.loginid}</code></p>
          <p><strong>Account Type:</strong> {selectedAccount.account_type || (selectedAccount.is_virtual ? 'Virtual' : 'Real')}</p>

          <div style={styles.balanceBox}>
            <span style={styles.balanceLabel}>Live Account Balance:</span>
            <h1 style={styles.balanceText}>
              {balanceData ? `${balanceData.currency} ${Number(balanceData.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Fetching balance...'}
            </h1>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '30px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' },
  header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
  backBtn: { padding: '8px 14px', backgroundColor: '#24292e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  selectorGroup: { marginBottom: '20px' },
  select: { padding: '8px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' },
  card: { padding: '25px', backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  demoBadge: { backgroundColor: '#fff8c5', color: '#9a6700', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
  realBadge: { backgroundColor: '#dafbe1', color: '#1a7f37', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
  balanceBox: { marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eaecef' },
  balanceLabel: { color: '#57606a', fontSize: '14px' },
  balanceText: { fontSize: '36px', color: '#1a7f37', margin: '8px 0 0 0' },
  errorCard: { padding: '15px', backgroundColor: '#ffebe9', color: '#cf222e', borderRadius: '6px', marginBottom: '20px' }
};