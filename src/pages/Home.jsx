import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initiateDerivLogin } from '../utils/pkce';
import { auth } from '../utils/auth';

export default function Home() {
  const navigate = useNavigate();

  // If already authenticated, redirect immediately to dashboard
  useEffect(() => {
    if (auth.isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  return (
    <div style={styles.container}>
      <h1>Real Trading App</h1>
      <p>Connect your Deriv account to begin automated or manual trading.</p>
      <button style={styles.loginBtn} onClick={initiateDerivLogin}>
        Log in with Deriv
      </button>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center' },
  loginBtn: { padding: '14px 28px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#ff444f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }
};