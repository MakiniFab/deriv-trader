// src/utils/derivApi.js
const APP_ID = '34jtvKMAMvumIpF2SDF0D';

/**
 * 1. Fetch user options trading accounts
 */
export async function fetchUserAccounts(token) {
  const response = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
    method: 'GET',
    headers: {
      'Deriv-App-ID': APP_ID,
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve account details.');
  }

  return data.accounts || data.data || [];
}

/**
 * 2. Generate OTP Authenticated WebSocket URL for a specific account ID
 */
export async function getAccountOtpWsUrl(token, accountId) {
  const response = await fetch(`https://api.derivws.com/trading/v1/options/accounts/${accountId}/otp`, {
    method: 'POST',
    headers: {
      'Deriv-App-ID': APP_ID,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (!response.ok || !data.ws_url) {
    throw new Error(data.message || data.error?.message || 'Failed to generate authenticated WebSocket OTP URL.');
  }

  return data.ws_url; // Returns the full authenticated wss:// URL
}

/**
 * 3. Connect to OTP WebSocket URL and subscribe to live balance updates
 */
export function subscribeToBalanceWithOtp(wsUrl, onBalanceUpdate, onError) {
  let ws = null;

  try {
    ws = new WebSocket(wsUrl);
  } catch (err) {
    if (onError) onError('Failed to initialize WebSocket with OTP URL.');
    return () => {};
  }

  ws.onopen = () => {
    // Send balance request once connected to OTP-authenticated socket
    ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
  };

  ws.onmessage = (event) => {
    try {
      const response = JSON.parse(event.data);

      if (response.error) {
        if (onError) onError(response.error.message);
        return;
      }

      if (response.msg_type === 'balance' || response.balance) {
        const balanceData = response.balance || response;
        if (onBalanceUpdate) {
          onBalanceUpdate({
            balance: balanceData.balance,
            currency: balanceData.currency,
            loginid: balanceData.loginid
          });
        }
      }
    } catch (err) {
      if (onError) onError('Failed to parse socket message.');
    }
  };

  ws.onerror = (err) => {
    if (onError) onError('Authenticated OTP WebSocket error occurred.');
  };

  return () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };
}