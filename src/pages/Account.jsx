// src/pages/Account.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';
import { fetchUserNickname, fetchAccountDetailsAndStatement } from '../utils/derivApi';

export default function Account() {
  const navigate = useNavigate();
  const token = auth.getToken();

  const [nicknameData, setNicknameData] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    async function loadAccountInformation() {
      setLoading(true);
      setError(null);

      try {
        // 1. REST Call for User Nickname
        const nicknameRes = await fetchUserNickname(token);
        setNicknameData(nicknameRes);

        // 2. WebSocket Call for Financials & Statement
        const wsRes = await fetchAccountDetailsAndStatement(token);
        setAccountData(wsRes.account);
        setStatementData(wsRes.statement);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }

    loadAccountInformation();
  }, [token, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
        <h2>Account Profile & Statement</h2>
      </div>

      {loading && <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading account details...</p>}

      {error && (
        <div style={styles.errorCard}>
          <p><strong>Error loading account data:</strong> {error}</p>
          <button onClick={() => window.location.reload()} style={styles.retryBtn}>Retry Connection</button>
        </div>
      )}

      {!loading && !error && (
        <div style={styles.grid}>
          {/* Identity & Nickname (REST API) */}
          <div style={styles.card}>
            <h3>Identity (REST API)</h3>
            <p><strong>Nickname:</strong> {nicknameData?.nickname || 'N/A'}</p>
            <p><strong>External Ref ID:</strong> <code>{nicknameData?.external_reference_id || 'N/A'}</code></p>
            {accountData && (
              <>
                <p><strong>Email:</strong> {accountData.email}</p>
                <p>
                  <strong>Account Type:</strong>{' '}
                  <span style={accountData.isVirtual ? styles.demoBadge : styles.realBadge}>
                    {accountData.accountType}
                  </span>
                </p>
              </>
            )}
          </div>

          {/* Active Balance (WebSocket API) */}
          <div style={styles.card}>
            <h3>Active Account Status</h3>
            {accountData && (
              <>
                <p><strong>Login ID:</strong> <code>{accountData.loginid}</code></p>
                <p><strong>Balance:</strong></p>
                <h2 style={styles.balanceText}>
                  {accountData.currency} {Number(accountData.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h2>
              </>
            )}
          </div>

          {/* Statement Transactions Table */}
          <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
            <h3>Recent Statement Transactions ({statementData?.count || 0})</h3>
            {statementData?.transactions?.length > 0 ? (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Transaction ID</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementData.transactions.map((tx) => (
                      <tr key={tx.transaction_id} style={styles.tr}>
                        <td style={styles.td}><span style={styles.actionTag}>{tx.action_type}</span></td>
                        <td style={styles.td}><code>{tx.transaction_id}</code></td>
                        <td style={{ ...styles.td, color: tx.amount < 0 ? '#cf222e' : '#1a7f37', fontWeight: 'bold' }}>
                          {tx.amount}
                        </td>
                        <td style={styles.td}>{tx.balance_after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#6e7681' }}>No statement transactions found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' },
  header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' },
  backBtn: { padding: '8px 14px', backgroundColor: '#24292e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  balanceText: { fontSize: '28px', color: '#2da44e', margin: '5px 0' },
  realBadge: { backgroundColor: '#dafbe1', color: '#1a7f37', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px' },
  demoBadge: { backgroundColor: '#ddf4ff', color: '#0969da', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px' },
  errorCard: { padding: '15px', backgroundColor: '#ffebe9', color: '#cf222e', borderRadius: '6px', margin: '20px 0' },
  retryBtn: { marginTop: '10px', padding: '6px 12px', backgroundColor: '#cf222e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  tableContainer: { overflowX: 'auto', marginTop: '10px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '8px', borderBottom: '2px solid #e1e4e8', fontSize: '13px', color: '#57606a' },
  td: { padding: '10px 8px', borderBottom: '1px solid #e1e4e8', fontSize: '14px' },
  tr: { borderBottom: '1px solid #e1e4e8' },
  actionTag: { textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }
};