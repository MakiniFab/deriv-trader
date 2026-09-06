// src/utils/derivApi.js
const APP_ID = '34jtvKMAMvumIpF2SDF0D';

// Function to fetch balance over standard HTTPS REST (never blocked by WebSocket filters)
export async function fetchBalanceViaHTTP(token) {
  const response = await fetch('https://api.derivws.com/account/v1/balance', {
    method: 'GET',
    headers: {
      'Deriv-App-ID': APP_ID,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const body = await response.json();

  if (!response.ok || (body.errors && body.errors.length > 0)) {
    throw new Error(body.errors?.[0]?.message || 'HTTP request failed.');
  }

  return body.data; // { balance, currency, loginid }
}