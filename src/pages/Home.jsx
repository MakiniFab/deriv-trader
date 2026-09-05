import React from 'react';

export const Home = () => {
  const APP_ID = import.meta.env.VITE_DERIV_APP_ID || 'YOUR_APP_ID';
  
  // Point explicitly to your React callback route
  const REDIRECT_URL = encodeURIComponent('http://localhost:5173/callback');

  const handleLogin = () => {
    window.location.href = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=EN&redirect_uri=${REDIRECT_URL}`;
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
      <h1>Automated Deriv Trading Terminal</h1>
      <p>Log in with your Deriv account to authorize automatic trade execution.</p>
      <button 
        onClick={handleLogin}
        style={{ padding: '12px 24px', backgroundColor: '#ff444f', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}
      >
        Authenticate with Deriv
      </button>
    </div>
  );
};