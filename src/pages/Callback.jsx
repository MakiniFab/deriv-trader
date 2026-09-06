// src/pages/Callback.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../utils/auth';

const CLIENT_ID = '34jtvKMAMvumIpF2SDF0D';
const REDIRECT_URI = 'https://deriv-trader-shp0.onrender.com/callback';

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(null);
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent React 18 Strict Mode double-invocation
    if (processedRef.current) return;

    async function processOAuthCallback() {
      // 1. Direct token fallback (if returned as query parameter)
      const directToken = searchParams.get('token1') || searchParams.get('token');
      if (directToken) {
        processedRef.current = true;
        auth.setToken(directToken);
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('oauth_state');
        navigate('/account', { replace: true });
        return;
      }

      // 2. PKCE parameters
      const code = searchParams.get('code');
      const returnedState = searchParams.get('state');
      const storedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      if (storedState && returnedState && returnedState !== storedState) {
        setErrorMessage('Security check failed: CSRF State mismatch.');
        return;
      }

      if (!code) {
        setErrorMessage('No authorization code returned from server.');
        return;
      }

      if (!codeVerifier) {
        setErrorMessage('Session expired or PKCE code verifier missing. Please log in again.');
        return;
      }

      processedRef.current = true;

      try {
        // Exchange authorization code for token directly from client
        const response = await fetch('https://auth.deriv.com/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            code: code,
            code_verifier: codeVerifier,
            redirect_uri: REDIRECT_URI
          })
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
          auth.setToken(data.access_token);
          sessionStorage.removeItem('pkce_code_verifier');
          sessionStorage.removeItem('oauth_state');
          navigate('/account', { replace: true });
        } else {
          setErrorMessage(data.error_description || data.message || 'Token exchange failed.');
        }
      } catch (err) {
        setErrorMessage('Network error during authentication.');
      }
    }

    processOAuthCallback();
  }, [searchParams, navigate]);

  if (errorMessage) {
    return (
      <div style={styles.errorBox}>
        <h3>Authentication Error</h3>
        <p>{errorMessage}</p>
        <button onClick={() => navigate('/', { replace: true })} style={styles.retryBtn}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={styles.loadingBox}>
      <h2>Authenticating...</h2>
      <p>Validating login session with Deriv. Please wait.</p>
    </div>
  );
}

const styles = {
  loadingBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px', fontFamily: 'sans-serif' },
  errorBox: { margin: '100px auto', maxWidth: '400px', padding: '20px', backgroundColor: '#ffebe9', border: '1px solid #ffc1c0', borderRadius: '6px', color: '#cf222e', fontFamily: 'sans-serif' },
  retryBtn: { padding: '8px 16px', backgroundColor: '#cf222e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }
};