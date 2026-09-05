import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Home = () => {
  const navigate = useNavigate();

  const APP_ID = import.meta.env.VITE_DERIV_APP_ID || '1089';
  const REDIRECT_URL = encodeURIComponent(`https://deriv-trader-shp0.onrender.com/callback`);

  useEffect(() => {
    // Check if user is already authenticated
    const savedToken = localStorage.getItem('deriv_token');
    
    if (savedToken) {
      // User has a session -> go straight to trading dashboard
      navigate('/dashboard');
    } else {
      // No active session -> trigger OAuth redirect immediately
      window.location.href = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=EN&redirect_uri=${REDIRECT_URL}`;
    }
  }, [navigate, APP_ID, REDIRECT_URL]);

  return (
    <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
      <h2>Connecting to Deriv Authentication...</h2>
      <p>Please wait while we redirect you to authorize your account.</p>
    </div>
  );
};