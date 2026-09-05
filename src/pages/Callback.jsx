import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../utils/auth';

const CLIENT_ID = '34jtvKMAMvumIpF2SDF0D';
const REDIRECT_URI = 'https://deriv-trader-shp0.onrender.com/callback';

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    async function processOAuthCallback() {
      const code = searchParams.get('code');
      const returnedState = searchParams.get('state');
      const storedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      // 1. Verify CSRF State matches
      if (!returnedState || returnedState !== storedState) {
        setErrorMessage('Security verification failed: State mismatch (CSRF protection).');
        return;
      }

      // 2. Validate essential parameters
      if (!code || !codeVerifier) {
        setErrorMessage('Invalid authentication parameters returned from server.');
        return;
      }

      try {
        // 3. Exchange single-use auth code for access token
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
          // 4. Store token & clean up temporary PKCE keys
          auth.setToken(data.access_token);
          sessionStorage.removeItem('pkce_code_verifier');
          sessionStorage.removeItem('oauth_state');

          // 5. Navigate straight to protected dashboard
          navigate('/dashboard', { replace: true });
        } else {
          setErrorMessage(data.error_description || 'Failed to exchange authorization code.');
        }
      } catch (err) {
        setErrorMessage('Network error while exchanging authentication token.');
      }
    }

    processOAuthCallback();
  }, [searchParams, navigate]);

  if (errorMessage) {
    return (
      <div style={styles.errorBox}>
        <h3>Authentication Failed</h3>
        <p>{errorMessage}</p>
        <button onClick={() => navigate('/', { replace: true })} style={styles.retryBtn}>
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div style={styles.loadingBox}>
      <h2>Authenticating with Deriv...</h2>
      <p>Validating credentials and establishing session. Please wait.</p>
    </div>
  );
}

const styles = {
  loadingBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' },
  errorBox: { margin: '100px auto', maxWidth: '400px', padding: '20px', backgroundColor: '#ffebe9', border: '1px solid #ffc1c0', borderRadius: '6px', color: '#cf222e' },
  retryBtn: { padding: '8px 16px', backgroundColor: '#cf222e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }
};