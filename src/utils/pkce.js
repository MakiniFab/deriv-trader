const CLIENT_ID = '34jtvKMAMvumIpF2SDF0D';
const REDIRECT_URI = 'https://deriv-trader-shp0.onrender.com/callback';

export async function initiateDerivLogin() {
  // 1. Generate random code_verifier (43-128 chars)
  const array = crypto.getRandomValues(new Uint8Array(64));
  const codeVerifier = Array.from(array)
    .map(v => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[v % 66])
    .join('');

  // 2. Derive code_challenge using SHA-256 + Base64URL encoding
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // 3. Generate random state string for CSRF mitigation
  const state = crypto.getRandomValues(new Uint8Array(16))
    .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

  // 4. Save state and verifier temporarily before external redirect
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  sessionStorage.setItem('oauth_state', state);

  // 5. Build full OAuth endpoint URL
  const authUrl = `https://auth.deriv.com/oauth2/auth?` +
    `response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=trade+account_manage` +
    `&state=${state}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`;

  // Redirect browser to Deriv
  window.location.href = authUrl;
}