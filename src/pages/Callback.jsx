import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDerivWS } from '../context/WebSocketContext';

export const Callback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authorize } = useDerivWS();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accounts = [];
    let index = 1;

    while (params.has(`acct${index}`)) {
      accounts.push({
        account: params.get(`acct${index}`),
        token: params.get(`token${index}`),
        currency: params.get(`cur${index}`),
      });
      index++;
    }

    if (accounts.length > 0) {
      const primary = accounts[0];
      localStorage.setItem('deriv_token', primary.token);
      localStorage.setItem('active_account', JSON.stringify(primary));

      authorize(primary.token)
        .then(() => navigate('/dashboard'))
        .catch(() => navigate('/'));
    }
  }, [location, navigate, authorize]);

  return <div style={{ textAlign: 'center', marginTop: '100px' }}>Authenticating and securing session...</div>;
};