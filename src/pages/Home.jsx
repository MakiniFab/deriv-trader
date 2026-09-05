import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDerivWS } from '../context/WebSocketContext';

export const Home = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { authorize } = useDerivWS();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Connect to Deriv WebSocket using the pasted token
      const authResponse = await authorize(token.trim());
      
      // Store session locally
      localStorage.setItem('deriv_token', token.trim());
      localStorage.setItem('active_account', JSON.stringify({
        account: authResponse.loginid,
        currency: authResponse.currency
      }));

      // Navigate straight to dashboard inside your SPA
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Invalid API Token. Please generate a new one from Deriv.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '24px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>Deriv Trading Terminal</h2>
      <p style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
        Enter your Deriv Personal Access Token (PAT) to authorize.
      </p>

      <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
        <input 
          type="password" 
          placeholder="Paste PAT Token Here"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: '#ff444f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Authenticating...' : 'Connect Terminal'}
        </button>
      </form>

      {error && <p style={{ color: 'red', fontSize: '13px', marginTop: '10px', textAlign: 'center' }}>{error}</p>}
    </div>
  );
};