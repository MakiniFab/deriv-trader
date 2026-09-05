import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDerivWS } from '../context/WebSocketContext';

export const Callback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authorize } = useDerivWS();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      
      // Extract token1 and acct1 from URL query parameters
      const token1 = searchParams.get('token1');
      const acct1 = searchParams.get('acct1');

      if (!token1) {
        setError('Authorization failed: No access token returned from Deriv.');
        return;
      }

      try {
        // Authenticate the WebSocket connection using the newly received token
        const authRes = await authorize(token1);

        // Save session parameters locally
        localStorage.setItem('deriv_token', token1);
        localStorage.setItem('active_account', JSON.stringify({
          account: acct1 || authRes.loginid,
          currency: authRes.currency,
          token: token1
        }));

        // Route directly to the trading interface
        navigate('/dashboard');
      } catch (err) {
        setError(err?.message || 'WebSocket authorization failed.');
      }
    };

    handleAuthCallback();
  }, [location, authorize, navigate]);

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', color: '#d32f2f' }}>
        <h3>Authentication Error</h3>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
      <h2>Completing Authorization...</h2>
      <p>Finalizing your WebSocket connection to Deriv.</p>
    </div>
  );
};